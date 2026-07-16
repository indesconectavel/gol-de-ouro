'use strict';



/**

 * PE.2K — smoke Runtime Boundary (sem produção).

 * node scripts/pe2k-runtime-boundary-smoke.mjs

 */



import assert from 'node:assert/strict';

import { createRequire } from 'node:module';

import fs from 'node:fs';

import path from 'node:path';

import { fileURLToPath } from 'node:url';



const require = createRequire(import.meta.url);

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');



const RuntimeBoundary = require('../src/payment-engine/runtime/RuntimeBoundary');

const {

  isRuntimeBoundaryEnabled,

  FLAG_NAME,

  DEFAULT_VALUE

} = require('../src/payment-engine/boundary/runtime-boundary-config');

const { PaymentEngine } = require('../src/payment-engine');



const prev = process.env.PE_RUNTIME_BOUNDARY_ENABLED;



try {

  delete process.env.PE_RUNTIME_BOUNDARY_ENABLED;

  assert.equal(DEFAULT_VALUE, false);

  assert.equal(FLAG_NAME, 'PE_RUNTIME_BOUNDARY_ENABLED');

  assert.equal(isRuntimeBoundaryEnabled(), false);

  assert.equal(RuntimeBoundary.inspect().mode, 'legacy_direct');



  assert.equal(typeof RuntimeBoundary.processPendingWithdrawals, 'function');

  assert.equal(typeof RuntimeBoundary.createLedgerEntry, 'function');

  assert.equal(typeof RuntimeBoundary.getHealthSnapshot, 'function');

  assert.equal(typeof RuntimeBoundary.approveWithdrawManualAdmin, 'function');

  assert.equal(typeof RuntimeBoundary.reconcileAsaasPendingPayouts, 'function');



  // Worker: zero domain/finance requires

  const worker = fs.readFileSync(path.join(root, 'src/workers/payout-worker.js'), 'utf8');

  assert.ok(/RuntimeBoundary/.test(worker));

  assert.equal(/require\(['\"][^'\"]*domain\/payout/.test(worker), false);

  assert.equal(/require\(['\"][^'\"]*finance\//.test(worker), false);

  assert.ok(/processPendingWithdrawals\(/.test(worker));



  // Admin

  const admin = fs.readFileSync(path.join(root, 'controllers/adminWithdrawController.js'), 'utf8');

  assert.ok(/RuntimeBoundary/.test(admin));

  assert.equal(/domain\/payout/.test(admin), false);



  // Scheduler

  const sched = fs.readFileSync(

    path.join(root, 'src/payment-engine/scheduler/asaasPayoutRecoveryScheduler.js'),

    'utf8'

  );

  assert.ok(/RuntimeBoundary/.test(sched));

  assert.equal(/domain\/payout/.test(sched), false);

  assert.equal(/finance\/reconciliation/.test(sched), false);



  // server-fly payout surface

  const fly = fs.readFileSync(path.join(root, 'server-fly.js'), 'utf8');

  assert.ok(/RuntimeBoundary/.test(fly));

  assert.equal(

    /require\(['\"]\.\/src\/domain\/payout\/processPendingWithdrawals['\"]\)/.test(fly),

    false

  );



  // Flag ON → facade mode

  process.env.PE_RUNTIME_BOUNDARY_ENABLED = 'true';

  assert.equal(isRuntimeBoundaryEnabled(), true);

  assert.equal(RuntimeBoundary.inspect().mode, 'facade');

  PaymentEngine.configure({});

  const health = PaymentEngine.health();

  assert.equal(health.pe2k.runtimeBoundaryEnabled, true);



  // Flag OFF restore

  process.env.PE_RUNTIME_BOUNDARY_ENABLED = 'false';

  assert.equal(RuntimeBoundary.inspect().mode, 'legacy_direct');



  console.log('PE.2K runtime-boundary smoke: PASS');

} finally {

  if (prev === undefined) delete process.env.PE_RUNTIME_BOUNDARY_ENABLED;

  else process.env.PE_RUNTIME_BOUNDARY_ENABLED = prev;

}

