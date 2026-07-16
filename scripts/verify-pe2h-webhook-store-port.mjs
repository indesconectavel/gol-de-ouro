'use strict';

/**
 * PE.2H — verify WebhookStorePort (mocks only).
 * node scripts/verify-pe2h-webhook-store-port.mjs
 */

import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const core = require('../src/payment-engine/core/webhookStore');
const { createInMemoryWebhookStore } = require('../src/payment-engine/adapters/memory/InMemoryWebhookStore');
const { createGolDeOuroWebhookStore } = require('../src/payment-engine/adapters/goldeouro/GolDeOuroWebhookStore');
const { PaymentWebhookDryRunStore } = require('../src/finance/webhooks/paymentWebhookDryRunStore');
const { markWebhookProcessedCompat } = require('../src/payment-engine/compat/webhookStorePortBridge');
const { isWebhookStorePortEnabled } = require('../src/payment-engine/boundary/webhook-store-port-config');
const { sanitizeMetadata } = require('../src/payment-engine/types/WebhookStoreRecord');

const prev = process.env.PE_WEBHOOK_STORE_PORT_ENABLED;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`OK ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`FAIL ${name}:`, err.message);
  }
}

await test('registro recebido', async () => {
  const { store } = createInMemoryWebhookStore();
  const r = await core.registerReceived(store, { provider: 'asaas', eventId: 'a' });
  assert.equal(r.status, 'received');
});

await test('consulta por event ID / inexistente', async () => {
  const { store } = createInMemoryWebhookStore();
  await core.registerReceived(store, { provider: 'asaas', eventId: 'b' });
  const f = await core.findByEventId(store, 'b');
  assert.equal(f.eventId, 'b');
  assert.equal(await core.findByEventId(store, 'missing'), null);
});

await test('status processing → processed', async () => {
  const { store } = createInMemoryWebhookStore();
  await core.registerReceived(store, { provider: 'mp', eventId: 'c' });
  await core.markProcessing(store, { provider: 'mp', eventId: 'c' });
  const p = await core.markProcessed(store, { provider: 'mp', eventId: 'c' });
  assert.equal(p.status, 'processed');
});

await test('status failed + retry', async () => {
  const { store } = createInMemoryWebhookStore();
  await core.registerReceived(store, { provider: 'asaas', eventId: 'd' });
  await core.markFailed(store, { provider: 'asaas', eventId: 'd', errorCode: 'X' });
  const r = await core.recordRetry(store, { provider: 'asaas', eventId: 'd' });
  assert.equal(r.retryCount, 1);
  assert.equal(r.status, 'received');
});

await test('PE.2H.1 timeout semantics Option B', async () => {
  const { store } = createInMemoryWebhookStore();
  await core.registerReceived(store, { provider: 'mp', eventId: 'to1' });
  const f = await core.markFailed(store, { provider: 'mp', eventId: 'to1', errorCode: 'TIMEOUT' });
  assert.equal(f.status, 'failed');
  assert.equal(f.lastErrorCode, 'TIMEOUT');
  assert.notEqual(f.status, 'TIMEOUT');
  const gdo = createGolDeOuroWebhookStore({ backingStore: new PaymentWebhookDryRunStore() });
  await core.registerReceived(gdo, { provider: 'asaas', eventId: 'to2' });
  const g = await core.markFailed(gdo, { provider: 'asaas', eventId: 'to2', errorCode: 'TIMEOUT' });
  assert.equal(g.status, 'failed');
  assert.equal(g.lastErrorCode, 'TIMEOUT');
});

await test('transição inválida processed→failed', async () => {
  const { store } = createInMemoryWebhookStore();
  await core.registerReceived(store, { provider: 'asaas', eventId: 'e' });
  await core.markProcessed(store, { provider: 'asaas', eventId: 'e' });
  const f = await core.markFailed(store, { provider: 'asaas', eventId: 'e' });
  assert.equal(f.status, 'processed');
  assert.equal(f.duplicate, true);
});

await test('concorrência markProcessed', async () => {
  const { store, state } = createInMemoryWebhookStore();
  await core.registerReceived(store, { provider: 'asaas', eventId: 'race' });
  const [a, b] = await Promise.all([
    core.markProcessed(store, { provider: 'asaas', eventId: 'race' }),
    core.markProcessed(store, { provider: 'asaas', eventId: 'race' })
  ]);
  const processedUnique = [a, b].filter((x) => x.status === 'processed' && !x.duplicate).length;
  assert.ok(processedUnique <= 1);
  assert.equal(state.markProcessedCalls, 2);
});

await test('adapter GDO Asaas + MP', async () => {
  const dry = new PaymentWebhookDryRunStore();
  const gdo = createGolDeOuroWebhookStore({ backingStore: dry });
  await core.markProcessed(gdo, { provider: 'asaas', eventId: 'as1', resourceId: 'pay_as' });
  await core.markProcessed(gdo, { provider: 'mercadopago', eventId: 'mp1', resourceId: '123' });
  assert.equal(dry.hasProcessed('asaas', 'as1'), true);
  assert.equal(dry.hasProcessed('mercadopago', 'mp1'), true);
});

await test('sanitização metadata', async () => {
  const s = sanitizeMetadata({ token: 'secret', ok: 'yes', authorization: 'Bearer x' });
  assert.equal(s.token, undefined);
  assert.equal(s.authorization, undefined);
  assert.equal(s.ok, 'yes');
});

await test('compat flag OFF', async () => {
  process.env.PE_WEBHOOK_STORE_PORT_ENABLED = 'false';
  assert.equal(isWebhookStorePortEnabled(), false);
  const dry = new PaymentWebhookDryRunStore();
  const r = markWebhookProcessedCompat(
    { dryRunStore: dry },
    { provider: 'asaas', eventId: 'off1' }
  );
  assert.equal(r.duplicate, false);
});

await test('compat flag ON sem dupla escrita financeira', async () => {
  process.env.PE_WEBHOOK_STORE_PORT_ENABLED = 'true';
  const dry = new PaymentWebhookDryRunStore();
  const gdo = createGolDeOuroWebhookStore({ backingStore: dry });
  const r1 = await Promise.resolve(
    markWebhookProcessedCompat({ dryRunStore: dry, webhookStore: gdo }, { provider: 'asaas', eventId: 'on1' })
  );
  assert.equal(r1.duplicate, false);
  const r2 = await Promise.resolve(
    markWebhookProcessedCompat({ dryRunStore: dry, webhookStore: gdo }, { provider: 'asaas', eventId: 'on1' })
  );
  assert.equal(r2.duplicate, true);
  assert.equal(dry.processedEvents.size, 1);
});

await test('core sem supabase', async () => {
  const src = fs.readFileSync(path.join(root, 'src/payment-engine/core/webhookStore.js'), 'utf8');
  assert.equal(/supabase/i.test(src), false);
});

await test('store unavailable error', async () => {
  const r = await core.registerReceived(null, { provider: 'x', eventId: 'y' });
  assert.ok(r.error);
});

await test('findByProviderEvent', async () => {
  const { store } = createInMemoryWebhookStore();
  await core.registerReceived(store, { provider: 'asaas', eventId: 'px' });
  const f = await core.findByProviderEvent(store, 'asaas', 'px');
  assert.equal(f.eventId, 'px');
});

if (prev === undefined) delete process.env.PE_WEBHOOK_STORE_PORT_ENABLED;
else process.env.PE_WEBHOOK_STORE_PORT_ENABLED = prev;

if (failed) {
  console.error(`PE.2H verify: ${failed} FAIL`);
  process.exit(1);
}
console.log('PE.2H verify-pe2h-webhook-store-port: ALL OK');
