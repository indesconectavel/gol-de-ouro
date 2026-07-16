'use strict';



/**

 * PE.2J — smoke Payout Boundary (sem produção / sem banco).

 * node scripts/pe2j-payout-boundary-smoke.mjs

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

  processPendingPayouts,

  createPayoutLedgerEntry,

  rollbackPayout,

  reconcilePayouts

} = require('../src/payment-engine/core/payout');

const { createInMemoryPayoutPorts } = require('../src/payment-engine/adapters/memory/InMemoryPayoutPorts');

const { createGolDeOuroPayoutAdapter } = require('../src/payment-engine/adapters/goldeouro/GolDeOuroPayoutAdapter');

const { PaymentEngine } = require('../src/payment-engine');

const { resolvePayoutStore } = require('../src/payment-engine/boundary');

const {

  isPayoutBoundaryEnabled,

  FLAG_NAME,

  DEFAULT_VALUE

} = require('../src/payment-engine/boundary/payout-boundary-config');



const prev = process.env.PE_PAYOUT_BOUNDARY_ENABLED;



try {

  delete process.env.PE_PAYOUT_BOUNDARY_ENABLED;

  assert.equal(DEFAULT_VALUE, false);

  assert.equal(FLAG_NAME, 'PE_PAYOUT_BOUNDARY_ENABLED');

  assert.equal(isPayoutBoundaryEnabled(), false);

  assert.equal(resolvePayoutStore({}), null);



  // Core: zero require domain/payout

  const domainRe = /require\s*\(\s*['"][^'"]*domain\/payout/;

  const supabaseRe = /require\s*\(\s*['"]@supabase/;

  for (const f of fs.readdirSync(coreDir).filter((x) => x.endsWith('.js'))) {

    const src = fs.readFileSync(path.join(coreDir, f), 'utf8');

    assert.equal(domainRe.test(src), false, `core/${f} must not require domain/payout`);

    assert.equal(supabaseRe.test(src), false, `core/${f} must not require @supabase`);

  }



  // In-memory ports

  const { payoutStore, payoutRecovery, _test } = createInMemoryPayoutPorts({

    withdrawals: [

      { id: 'w1', status: 'pending' },

      { id: 'w2', status: 'pending' }

    ]

  });



  const batch = await processPendingPayouts(

    { payoutEnabled: true, isDbConnected: true },

    { payoutStore }

  );

  assert.equal(batch.success, true);

  assert.equal(batch.processedCount, 2);



  const led = await createPayoutLedgerEntry(

    { correlationId: 'c1', tipo: 'saque', usuarioId: 'u1', valor: 10, referencia: 'r1' },

    { payoutStore }

  );

  assert.equal(led.success, true);

  const led2 = await createPayoutLedgerEntry(

    { correlationId: 'c1', tipo: 'saque', usuarioId: 'u1', valor: 10, referencia: 'r1' },

    { payoutStore }

  );

  assert.equal(led2.deduped, true);



  const rb = await rollbackPayout({ motivo: 'TIMEOUT' }, { payoutStore });

  assert.equal(rb.success, true);



  const rec = await reconcilePayouts({}, { payoutRecovery });

  assert.equal(rec.success, true);

  _test.setRecoveryEnabled(false);

  const recOff = await reconcilePayouts({}, { payoutRecovery });

  assert.equal(recOff.skipped, true);



  // Flag OFF — resolve null; compat calls legado (sem DB → falha controlada ok)

  process.env.PE_PAYOUT_BOUNDARY_ENABLED = 'false';

  assert.equal(resolvePayoutStore({}), null);



  // Flag ON — adapter GDO shape

  process.env.PE_PAYOUT_BOUNDARY_ENABLED = 'true';

  assert.equal(isPayoutBoundaryEnabled(), true);

  const resolved = resolvePayoutStore({});

  assert.ok(resolved);

  assert.equal(typeof resolved.processPending, 'function');

  assert.equal(typeof resolved.createLedgerEntry, 'function');

  assert.equal(typeof resolved.recovery.reconcilePending, 'function');



  const gdo = createGolDeOuroPayoutAdapter({});

  assert.equal(gdo.productId, 'gol-de-ouro');

  assert.equal(typeof gdo.rollback, 'function');

  assert.equal(typeof gdo.approveManualAdmin, 'function');



  // Facade

  PaymentEngine.configure({});

  const health = PaymentEngine.health();

  assert.equal(health.pe2j.payoutBoundaryEnabled, true);

  assert.equal(typeof PaymentEngine.withdraw.processPending, 'function');

  assert.equal(typeof PaymentEngine.withdraw.createLedgerEntry, 'function');

  assert.equal(typeof PaymentEngine.withdraw.rollback, 'function');



  // Worker via RuntimeBoundary (PE.2K) — sem domain/payout direto

  const workerSrc = fs.readFileSync(path.join(root, 'src/workers/payout-worker.js'), 'utf8');

  assert.ok(/RuntimeBoundary/.test(workerSrc));

  assert.equal(/domain\/payout/.test(workerSrc), false);

  assert.equal(/finance\/factory/.test(workerSrc), false);



  // Ports contracts load

  require('../src/payment-engine/ports/WithdrawalPort');

  require('../src/payment-engine/ports/PayoutStorePort');

  require('../src/payment-engine/ports/PayoutRecoveryPort');



  console.log('PE.2J payout-boundary smoke: PASS');

} finally {

  if (prev === undefined) delete process.env.PE_PAYOUT_BOUNDARY_ENABLED;

  else process.env.PE_PAYOUT_BOUNDARY_ENABLED = prev;

}

