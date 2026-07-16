'use strict';

/**
 * PE.2K — verify Runtime Boundary.
 * node scripts/verify-pe2k-runtime-boundary.mjs
 */

import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const RuntimeBoundary = require('../src/payment-engine/runtime/RuntimeBoundary');
const { isRuntimeBoundaryEnabled, DEFAULT_VALUE } = require('../src/payment-engine/boundary/runtime-boundary-config');
const { PaymentEngine } = require('../src/payment-engine');

const prev = process.env.PE_RUNTIME_BOUNDARY_ENABLED;
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
  delete process.env.PE_RUNTIME_BOUNDARY_ENABLED;
  assert.equal(DEFAULT_VALUE, false);
  assert.equal(isRuntimeBoundaryEnabled(), false);
});

await test('compat OFF legacy mode', async () => {
  process.env.PE_RUNTIME_BOUNDARY_ENABLED = 'false';
  assert.equal(RuntimeBoundary.inspect().mode, 'legacy_direct');
});

await test('compat ON facade mode', async () => {
  process.env.PE_RUNTIME_BOUNDARY_ENABLED = 'true';
  assert.equal(RuntimeBoundary.inspect().mode, 'facade');
});

await test('worker no domain/finance require', async () => {
  const src = fs.readFileSync(path.join(root, 'src/workers/payout-worker.js'), 'utf8');
  assert.equal(/require\(['\"][^'\"]*domain\/payout/.test(src), false);
  assert.equal(/require\(['\"][^'\"]*finance\//.test(src), false);
  assert.ok(/RuntimeBoundary/.test(src));
});

await test('admin no domain/payout require', async () => {
  const src = fs.readFileSync(path.join(root, 'controllers/adminWithdrawController.js'), 'utf8');
  assert.equal(/domain\/payout/.test(src), false);
  assert.ok(/RuntimeBoundary/.test(src));
});

await test('scheduler no finance/domain bypass', async () => {
  const src = fs.readFileSync(
    path.join(root, 'src/payment-engine/scheduler/asaasPayoutRecoveryScheduler.js'),
    'utf8'
  );
  assert.equal(/domain\/payout/.test(src), false);
  assert.equal(/finance\//.test(src), false);
  assert.ok(/RuntimeBoundary/.test(src));
});

await test('server-fly no domain payout require', async () => {
  const src = fs.readFileSync(path.join(root, 'server-fly.js'), 'utf8');
  assert.equal(
    /require\(['\"]\.\/src\/domain\/payout\/processPendingWithdrawals['\"]\)/.test(src),
    false
  );
  assert.ok(/RuntimeBoundary/.test(src));
});

await test('facade wire + pe2k health', async () => {
  process.env.PE_RUNTIME_BOUNDARY_ENABLED = 'true';
  PaymentEngine.configure({});
  assert.equal(PaymentEngine.health().pe2k.runtimeBoundaryEnabled, true);
  assert.equal(typeof PaymentEngine.withdraw.approveManualAdmin, 'function');
});

await test('RuntimeBoundary surface', async () => {
  assert.equal(typeof RuntimeBoundary.processPendingWithdrawals, 'function');
  assert.equal(typeof RuntimeBoundary.runAsaasPayoutRecoveryCycle, 'function');
  assert.equal(typeof RuntimeBoundary.runMpDepositReconcileCycle, 'function');
});

await test('payoutBoundaryBridge still has admin compat', async () => {
  const bridge = require('../src/payment-engine/compat/payoutBoundaryBridge');
  assert.equal(typeof bridge.approveWithdrawManualAdminCompat, 'function');
});

if (prev === undefined) delete process.env.PE_RUNTIME_BOUNDARY_ENABLED;
else process.env.PE_RUNTIME_BOUNDARY_ENABLED = prev;

if (failed) {
  console.error(`PE.2K verify: ${failed} FAIL`);
  process.exit(1);
}
console.log('PE.2K verify-pe2k-runtime-boundary: ALL OK');
