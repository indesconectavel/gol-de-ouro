'use strict';

/**
 * PE.2J — verify Payout Boundary.
 * node scripts/verify-pe2j-payout-boundary.mjs
 */

import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const coreDir = path.join(root, 'src/payment-engine/core');
const peRoot = path.join(root, 'src/payment-engine');

const { isPayoutBoundaryEnabled, DEFAULT_VALUE } = require('../src/payment-engine/boundary/payout-boundary-config');
const { resolvePayoutStore } = require('../src/payment-engine/boundary');
const { createInMemoryPayoutPorts } = require('../src/payment-engine/adapters/memory/InMemoryPayoutPorts');
const { processPendingPayouts } = require('../src/payment-engine/core/payout');
const { PaymentEngine } = require('../src/payment-engine');

const prev = process.env.PE_PAYOUT_BOUNDARY_ENABLED;
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

await test('flag default false', async () => {
  delete process.env.PE_PAYOUT_BOUNDARY_ENABLED;
  assert.equal(DEFAULT_VALUE, false);
  assert.equal(isPayoutBoundaryEnabled(), false);
});

await test('core zero domain/payout require', async () => {
  const re = /require\s*\(\s*['"][^'"]*domain\/payout/;
  for (const f of fs.readdirSync(coreDir).filter((x) => x.endsWith('.js'))) {
    assert.equal(re.test(fs.readFileSync(path.join(coreDir, f), 'utf8')), false, f);
  }
});

await test('core zero supabase / express', async () => {
  for (const f of fs.readdirSync(coreDir).filter((x) => x.endsWith('.js'))) {
    const src = fs.readFileSync(path.join(coreDir, f), 'utf8');
    assert.equal(/require\s*\(\s*['"]@supabase/.test(src), false, f);
    assert.equal(/require\s*\(\s*['"]express['"]/.test(src), false, f);
  }
});

await test('compat OFF resolve null', async () => {
  process.env.PE_PAYOUT_BOUNDARY_ENABLED = 'false';
  assert.equal(resolvePayoutStore({}), null);
});

await test('compat ON resolve adapter', async () => {
  process.env.PE_PAYOUT_BOUNDARY_ENABLED = 'true';
  const p = resolvePayoutStore({});
  assert.ok(p);
  assert.equal(typeof p.processPending, 'function');
  assert.ok(p.recovery);
});

await test('in-memory withdrawal + retry shape', async () => {
  const { payoutStore } = createInMemoryPayoutPorts({
    withdrawals: [{ id: 'a', status: 'pending' }]
  });
  const r1 = await processPendingPayouts({ payoutEnabled: true, isDbConnected: true }, { payoutStore });
  assert.equal(r1.processedCount, 1);
  const r2 = await processPendingPayouts({ payoutEnabled: true, isDbConnected: true }, { payoutStore });
  assert.equal(r2.processedCount, 0);
});

await test('timeout/rollback path via port', async () => {
  const { payoutStore } = createInMemoryPayoutPorts();
  const rb = await payoutStore.rollback({ motivo: 'TIMEOUT' });
  assert.equal(rb.success, true);
});

await test('scheduler uses RuntimeBoundary (PE.2K)', async () => {
  const src = fs.readFileSync(
    path.join(peRoot, 'scheduler/asaasPayoutRecoveryScheduler.js'),
    'utf8'
  );
  assert.ok(/RuntimeBoundary/.test(src));
  assert.equal(/domain\/payout/.test(src), false);
});

await test('worker uses RuntimeBoundary not domain (PE.2K)', async () => {
  const src = fs.readFileSync(path.join(root, 'src/workers/payout-worker.js'), 'utf8');
  assert.ok(/RuntimeBoundary/.test(src));
  assert.equal(/domain\/payout/.test(src), false);
});

await test('adapter imports domain/payout (expected)', async () => {
  const src = fs.readFileSync(
    path.join(peRoot, 'adapters/goldeouro/GolDeOuroPayoutAdapter.js'),
    'utf8'
  );
  assert.ok(/domain\/payout/.test(src));
});

await test('bridge exists and PaymentEngine wired', async () => {
  PaymentEngine.configure({});
  assert.equal(typeof PaymentEngine.withdraw.processPending, 'function');
  assert.ok(fs.existsSync(path.join(peRoot, 'compat/payoutBoundaryBridge.js')));
  assert.ok(fs.existsSync(path.join(peRoot, 'ports/PayoutStorePort.js')));
  assert.ok(fs.existsSync(path.join(peRoot, 'ports/PayoutRecoveryPort.js')));
});

await test('facade providers snapshot intact', async () => {
  const snap = PaymentEngine.providers().snapshot();
  assert.ok(snap && typeof snap === 'object');
});

if (prev === undefined) delete process.env.PE_PAYOUT_BOUNDARY_ENABLED;
else process.env.PE_PAYOUT_BOUNDARY_ENABLED = prev;

if (failed) {
  console.error(`PE.2J verify: ${failed} FAIL`);
  process.exit(1);
}
console.log('PE.2J verify-pe2j-payout-boundary: ALL OK');
