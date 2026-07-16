'use strict';

/**
 * PE.2I — verify Core↔Finance boundary.
 * node scripts/verify-pe2i-core-finance-boundary.mjs
 */

import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const coreDir = path.join(root, 'src/payment-engine/core');

const { resolveFinanceSurface } = require('../src/payment-engine/boundary/resolveFinanceSurface');
const financeSurface = require('../src/payment-engine/compat/financeLegacySurface');
const { PaymentEngine } = require('../src/payment-engine');

const prev = process.env.PE_CORE_FINANCE_BOUNDARY_ENABLED;
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

await test('core zero finance requires', async () => {
  const re = /require\s*\(\s*['"][^'"]*finance\//;
  for (const f of fs.readdirSync(coreDir).filter((x) => x.endsWith('.js'))) {
    const src = fs.readFileSync(path.join(coreDir, f), 'utf8');
    assert.equal(re.test(src), false, f);
  }
});

await test('core zero domain/payout requires', async () => {
  const re = /require\s*\(\s*['"][^'"]*domain\/payout/;
  for (const f of fs.readdirSync(coreDir).filter((x) => x.endsWith('.js'))) {
    const src = fs.readFileSync(path.join(coreDir, f), 'utf8');
    assert.equal(re.test(src), false, f);
  }
});

await test('core zero supabase client require', async () => {
  const re = /require\s*\(\s*['"]@supabase/;
  for (const f of fs.readdirSync(coreDir).filter((x) => x.endsWith('.js'))) {
    const src = fs.readFileSync(path.join(coreDir, f), 'utf8');
    assert.equal(re.test(src), false, f);
  }
});

await test('compat flag OFF mode', async () => {
  process.env.PE_CORE_FINANCE_BOUNDARY_ENABLED = 'false';
  const r = resolveFinanceSurface();
  assert.equal(r.mode, 'legacy_direct');
  assert.equal(r.boundaryEnabled, false);
});

await test('compat flag ON mode same surface identity', async () => {
  process.env.PE_CORE_FINANCE_BOUNDARY_ENABLED = 'true';
  const r = resolveFinanceSurface();
  assert.equal(r.mode, 'core_bridge');
  assert.equal(r.surface, financeSurface);
});

await test('surface exports deposit/withdraw/webhooks/reconciliation', async () => {
  assert.equal(typeof financeSurface.createPixDepositCompat, 'function');
  assert.equal(typeof financeSurface.createPixDeposit, 'function');
  assert.equal(typeof financeSurface.claimApprovedPixDeposit, 'function');
  assert.equal(typeof financeSurface.createPixWithdrawCompat, 'function');
  assert.equal(typeof financeSurface.createLedgerEntry, 'function');
  assert.equal(typeof financeSurface.processPendingWithdrawals, 'function');
  assert.equal(typeof financeSurface.processPaymentWebhook, 'function');
  assert.equal(typeof financeSurface.processPaymentWebhookCompat, 'function');
  assert.equal(typeof financeSurface.processAsaasTransferWebhook, 'function');
  assert.equal(typeof financeSurface.handleAsaasTransferAuthorization, 'function');
  assert.equal(typeof financeSurface.reconcileAsaasPendingPayouts, 'function');
  assert.equal(typeof financeSurface.isAsaasPayoutRecoveryEnabled, 'function');
});

await test('facade wire', async () => {
  PaymentEngine.configure({});
  assert.equal(typeof PaymentEngine.deposit.getHealth(), 'object');
  assert.equal(typeof PaymentEngine.webhooks.isEngineEnabled(), 'boolean');
  assert.equal(typeof PaymentEngine.reconcile.isAsaasRecoveryEnabled(), 'boolean');
  assert.ok(PaymentEngine.withdraw.counters);
});

await test('scheduler imports surface not core reconciliation finance', async () => {
  const sched = fs.readFileSync(
    path.join(root, 'src/payment-engine/scheduler/asaasPayoutRecoveryScheduler.js'),
    'utf8'
  );
  assert.equal(/core\/reconciliation/.test(sched), false);
  assert.ok(/financeLegacySurface/.test(sched));
});

await test('PaymentEngine has no finance require', async () => {
  const src = fs.readFileSync(path.join(root, 'src/payment-engine/api/PaymentEngine.js'), 'utf8');
  assert.equal(/require\s*\(\s*['"][^'"]*finance\//.test(src), false);
});

await test('ports cores still present', async () => {
  assert.ok(fs.existsSync(path.join(coreDir, 'claimApprovedDeposit.js')));
  assert.ok(fs.existsSync(path.join(coreDir, 'idempotency.js')));
  assert.ok(fs.existsSync(path.join(coreDir, 'webhookStore.js')));
});

if (prev === undefined) delete process.env.PE_CORE_FINANCE_BOUNDARY_ENABLED;
else process.env.PE_CORE_FINANCE_BOUNDARY_ENABLED = prev;

if (failed) {
  console.error(`PE.2I verify: ${failed} FAIL`);
  process.exit(1);
}
console.log('PE.2I verify-pe2i-core-finance-boundary: ALL OK');
