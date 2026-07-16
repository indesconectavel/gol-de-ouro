'use strict';



/**

 * PE.2H — smoke WebhookStorePort (sem banco / sem produção).

 * node scripts/pe2h-webhook-store-smoke.mjs

 */



import assert from 'node:assert/strict';

import { createRequire } from 'node:module';

import fs from 'node:fs';

import path from 'node:path';

import { fileURLToPath } from 'node:url';



const require = createRequire(import.meta.url);

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');



const {

  isWebhookStorePortEnabled,

  FLAG_NAME,

  DEFAULT_VALUE

} = require('../src/payment-engine/boundary/webhook-store-port-config');

const { resolveWebhookStore } = require('../src/payment-engine/boundary/index');

const core = require('../src/payment-engine/core/webhookStore');

const { createInMemoryWebhookStore } = require('../src/payment-engine/adapters/memory/InMemoryWebhookStore');

const { createGolDeOuroWebhookStore } = require('../src/payment-engine/adapters/goldeouro/GolDeOuroWebhookStore');

const { PaymentWebhookDryRunStore } = require('../src/finance/webhooks/paymentWebhookDryRunStore');

const {

  markWebhookProcessedCompat,

  recordWebhookCreditDecisionCompat

} = require('../src/payment-engine/compat/webhookStorePortBridge');

const { createInMemoryIdempotencyStore } = require('../src/payment-engine/adapters/memory/InMemoryIdempotencyStore');

const idemCore = require('../src/payment-engine/core/idempotency');



const prev = process.env.PE_WEBHOOK_STORE_PORT_ENABLED;



try {

  delete process.env.PE_WEBHOOK_STORE_PORT_ENABLED;

  assert.equal(DEFAULT_VALUE, false);

  assert.equal(FLAG_NAME, 'PE_WEBHOOK_STORE_PORT_ENABLED');

  assert.equal(isWebhookStorePortEnabled(), false);

  assert.equal(resolveWebhookStore({}), null);



  const coreSrc = fs.readFileSync(path.join(root, 'src/payment-engine/core/webhookStore.js'), 'utf8');

  assert.equal(/supabase/i.test(coreSrc), false, 'core must not mention supabase');

  assert.equal(/pagamentos_pix/.test(coreSrc), false);

  assert.equal(/\.from\(/.test(coreSrc), false);

  assert.equal(/\.rpc\(/.test(coreSrc), false);



  // Flag OFF legado

  process.env.PE_WEBHOOK_STORE_PORT_ENABLED = 'false';

  const dry = new PaymentWebhookDryRunStore();

  const off1 = markWebhookProcessedCompat(

    { dryRunStore: dry },

    { provider: 'asaas', eventId: 'evt_1', paymentId: 'pay_1', shouldCreditWallet: false }

  );

  assert.equal(off1.duplicate, false);

  const off2 = markWebhookProcessedCompat(

    { dryRunStore: dry },

    { provider: 'asaas', eventId: 'evt_1', paymentId: 'pay_1' }

  );

  assert.equal(off2.duplicate, true);



  // Flag ON + in-memory

  process.env.PE_WEBHOOK_STORE_PORT_ENABLED = 'true';

  assert.equal(isWebhookStorePortEnabled(), true);



  const { store, state } = createInMemoryWebhookStore();

  const reg = await core.registerReceived(store, {

    provider: 'asaas',

    eventId: 'e1',

    eventType: 'PAYMENT_RECEIVED',

    resourceId: 'pay_x'

  });

  assert.equal(reg.status, 'received');

  const dupReg = await core.registerReceived(store, { provider: 'asaas', eventId: 'e1' });

  assert.equal(dupReg.duplicate, true);



  await core.markProcessing(store, { provider: 'asaas', eventId: 'e1' });

  const done = await core.markProcessed(store, { provider: 'asaas', eventId: 'e1' });

  assert.equal(done.status, 'processed');

  const again = await core.markProcessed(store, { provider: 'asaas', eventId: 'e1' });

  assert.equal(again.duplicate, true);



  // PE.2H.1 Opção B: status=failed + lastErrorCode=TIMEOUT (TIMEOUT nunca é status)

  const failStore = createInMemoryWebhookStore().store;

  await core.registerReceived(failStore, { provider: 'mp', eventId: 'ef' });

  const failed = await core.markFailed(failStore, { provider: 'mp', eventId: 'ef', errorCode: 'TIMEOUT' });

  assert.equal(failed.status, 'failed', 'timeout must use status=failed');

  assert.equal(failed.lastErrorCode, 'TIMEOUT', 'timeout code must be lastErrorCode');

  assert.notEqual(failed.status, 'TIMEOUT', 'TIMEOUT must not be a lifecycle status');



  const retryStore = createInMemoryWebhookStore().store;

  await core.registerReceived(retryStore, { provider: 'asaas', eventId: 'er' });

  const r1 = await core.recordRetry(retryStore, { provider: 'asaas', eventId: 'er' });

  assert.equal(r1.retryCount, 1);



  // Adapter GDO + DryRun backing — sem dupla persistência financeira

  const backing = new PaymentWebhookDryRunStore();

  const gdo = createGolDeOuroWebhookStore({ backingStore: backing });

  const m1 = await core.markProcessedLegacyShape(gdo, {

    provider: 'asaas',

    eventId: 'g1',

    paymentId: 'pay_g',

    shouldCreditWallet: true

  });

  assert.equal(m1.duplicate, false);

  const m2 = await core.markProcessedLegacyShape(gdo, {

    provider: 'asaas',

    eventId: 'g1',

    paymentId: 'pay_g'

  });

  assert.equal(m2.duplicate, true);

  assert.equal(backing.hasProcessed('asaas', 'g1'), true);



  // Integração conceitual IdempotencyStore → WebhookStore (ordem)

  const { store: idem } = createInMemoryIdempotencyStore();

  const { store: wh } = createInMemoryWebhookStore();

  const reserved = await idemCore.reserve(idem, { scope: 'deposit_pix', key: 'pay_ord' });

  assert.equal(reserved.reserved, true);

  await core.registerReceived(wh, { provider: 'asaas', eventId: 'evt_ord', resourceId: 'pay_ord' });

  await core.markProcessed(wh, { provider: 'asaas', eventId: 'evt_ord' });

  await idemCore.commit(idem, { scope: 'deposit_pix', key: 'pay_ord' });



  // Compat ON

  const onMark = await Promise.resolve(

    markWebhookProcessedCompat(

      { dryRunStore: new PaymentWebhookDryRunStore(), webhookStore: gdo },

      { provider: 'asaas', eventId: 'g2', paymentId: 'p2' }

    )

  );

  assert.equal(typeof onMark.duplicate, 'boolean');

  recordWebhookCreditDecisionCompat(

    { dryRunStore: backing, webhookStore: gdo },

    { provider: 'asaas', eventId: 'g1', paymentId: 'pay_g' },

    'dry_run_credit_decision_only'

  );



  assert.ok(state.markProcessedCalls >= 1 || state.writes >= 1);

  console.log('PE.2H webhook store smoke: PASS');

} finally {

  if (prev === undefined) delete process.env.PE_WEBHOOK_STORE_PORT_ENABLED;

  else process.env.PE_WEBHOOK_STORE_PORT_ENABLED = prev;

}

