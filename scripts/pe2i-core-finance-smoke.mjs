'use strict';



/**

 * PE.2I — smoke Core↔Finance boundary (sem produção / sem banco).

 * node scripts/pe2i-core-finance-smoke.mjs

 */



import assert from 'node:assert/strict';

import { createRequire } from 'node:module';

import fs from 'node:fs';

import path from 'node:path';

import { fileURLToPath } from 'node:url';



const require = createRequire(import.meta.url);

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const coreDir = path.join(root, 'src/payment-engine/core');



const {

  isCoreFinanceBoundaryEnabled,

  FLAG_NAME,

  DEFAULT_VALUE,

  resolveFinanceSurface,

  getFinanceSurface

} = require('../src/payment-engine/boundary/resolveFinanceSurface');

const { PaymentEngine } = require('../src/payment-engine');



const prev = process.env.PE_CORE_FINANCE_BOUNDARY_ENABLED;



try {

  delete process.env.PE_CORE_FINANCE_BOUNDARY_ENABLED;

  assert.equal(DEFAULT_VALUE, false);

  assert.equal(FLAG_NAME, 'PE_CORE_FINANCE_BOUNDARY_ENABLED');

  assert.equal(isCoreFinanceBoundaryEnabled(), false);



  // Core: zero require(...finance/

  const financeRequire = /require\s*\(\s*['"][^'"]*finance\//;

  const domainRequire = /require\s*\(\s*['"][^'"]*domain\/payout/;

  const coreFiles = fs.readdirSync(coreDir).filter((f) => f.endsWith('.js'));

  assert.ok(coreFiles.length >= 5, 'core files present');

  for (const f of coreFiles) {

    const src = fs.readFileSync(path.join(coreDir, f), 'utf8');

    assert.equal(financeRequire.test(src), false, `core/${f} must not require finance/*`);

    assert.equal(domainRequire.test(src), false, `core/${f} must not require domain/payout`);

  }



  // Flag OFF surface

  process.env.PE_CORE_FINANCE_BOUNDARY_ENABLED = 'false';

  const off = resolveFinanceSurface();

  assert.equal(off.boundaryEnabled, false);

  assert.equal(off.mode, 'legacy_direct');

  assert.equal(typeof off.surface.createPixDepositCompat, 'function');

  assert.equal(typeof off.surface.processPaymentWebhook, 'function');

  assert.equal(typeof off.surface.createLedgerEntry, 'function');

  assert.equal(typeof off.surface.reconcileAsaasPendingPayouts, 'function');



  // Flag ON — mesma surface financeira (sem mudança de regras)

  process.env.PE_CORE_FINANCE_BOUNDARY_ENABLED = 'true';

  assert.equal(isCoreFinanceBoundaryEnabled(), true);

  const on = resolveFinanceSurface();

  assert.equal(on.boundaryEnabled, true);

  assert.equal(on.mode, 'core_bridge');

  assert.equal(on.surface.createPixDeposit, off.surface.createPixDeposit);

  assert.equal(on.surface.claimApprovedPixDeposit, off.surface.claimApprovedPixDeposit);



  // Facade bootstrap

  PaymentEngine.configure({});

  const health = PaymentEngine.health();

  assert.equal(health.engine, 'payment-engine');

  assert.ok(health.pe2i);

  assert.equal(health.pe2i.coreFinanceBoundaryEnabled, true);

  assert.equal(typeof PaymentEngine.deposit.createCompat, 'function');

  assert.equal(typeof PaymentEngine.withdraw.createLedgerEntry, 'function');

  assert.equal(typeof PaymentEngine.webhooks.process, 'function');

  assert.equal(typeof PaymentEngine.reconcile.isAsaasRecoveryEnabled, 'function');

  assert.equal(typeof PaymentEngine.financeBoundary, 'function');



  // Ports core still loadable; deposit sem createPixDeposit (só ports)

  const depositCore = require('../src/payment-engine/core/deposit');

  assert.equal(typeof depositCore.claimApprovedDeposit, 'function');

  assert.equal(typeof depositCore.claimApprovedPixDepositCompat, 'function');

  assert.equal(typeof depositCore.createPixDeposit, 'undefined');



  // Core withdraw/webhooks/reconcile via bridge (não finance/* direto)

  const withdrawCore = require('../src/payment-engine/core/withdraw');

  const webhooksCore = require('../src/payment-engine/core/webhooks');

  const reconCore = require('../src/payment-engine/core/reconciliation');

  assert.equal(typeof withdrawCore.createLedgerEntry, 'function');

  assert.equal(typeof webhooksCore.processPaymentWebhook, 'function');

  assert.equal(typeof reconCore.reconcileAsaasPendingPayouts, 'function');

  assert.ok(/financeLegacySurface/.test(fs.readFileSync(path.join(coreDir, 'withdraw.js'), 'utf8')));



  const surface = getFinanceSurface();

  assert.ok(surface.deposit);

  assert.ok(surface.withdraw);

  assert.ok(surface.webhooks);

  assert.ok(surface.reconciliation);



  console.log('PE.2I core-finance smoke: PASS');

} finally {

  if (prev === undefined) delete process.env.PE_CORE_FINANCE_BOUNDARY_ENABLED;

  else process.env.PE_CORE_FINANCE_BOUNDARY_ENABLED = prev;

}

