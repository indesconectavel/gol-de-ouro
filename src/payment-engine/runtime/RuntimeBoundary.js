'use strict';



/**

 * PE.2K — RuntimeBoundary™

 *

 * Único ponto autorizado para workers / schedulers / bootstrap / admin

 * acessarem a superfície financeira da Payment Engine.

 *

 * Flag PE_RUNTIME_BOUNDARY_ENABLED:

 *   false (default) → legado domain/finance (idêntico pré-PE.2K)

 *   true            → PaymentEngine facade → ports/bridges → legado

 *

 * Este módulo NÃO contém regras financeiras, schema SQL nem Express.

 */



const { isRuntimeBoundaryEnabled, FLAG_NAME, DEFAULT_VALUE } = require('../boundary/runtime-boundary-config');



function facade() {

  return require('../api/PaymentEngine');

}



function legacyPayout() {

  return require('../../domain/payout/processPendingWithdrawals');

}



function legacyFactory() {

  // PE.2L — health/público via ProviderResolver (selection única)

  return require('../providers');

}



function ensureFacadeConfigured(deps = {}) {

  const pe = facade();

  if (!pe._runtime) {

    pe.configure(deps);

  }

  return pe;

}



/**

 * @param {object} input

 * @returns {Promise<object>}

 */

async function processPendingWithdrawals(input = {}) {

  if (!isRuntimeBoundaryEnabled()) {

    return legacyPayout().processPendingWithdrawals(input);

  }

  const pe = ensureFacadeConfigured();

  return pe.withdraw.processPending(input);

}



/**

 * @param {object} input

 */

async function createLedgerEntry(input = {}) {

  if (!isRuntimeBoundaryEnabled()) {

    return legacyPayout().createLedgerEntry(input);

  }

  return ensureFacadeConfigured().withdraw.createLedgerEntry(input);

}



/**

 * @param {object} input

 */

async function rollbackWithdraw(input = {}) {

  if (!isRuntimeBoundaryEnabled()) {

    return legacyPayout().rollbackWithdraw(input);

  }

  return ensureFacadeConfigured().withdraw.rollback(input);

}



function getPayoutCounters() {

  if (!isRuntimeBoundaryEnabled()) {

    return legacyPayout().payoutCounters;

  }

  return ensureFacadeConfigured().withdraw.counters;

}



function getHealthSnapshot() {

  if (!isRuntimeBoundaryEnabled()) {

    return legacyFactory().getHealthSnapshot();

  }

  return ensureFacadeConfigured().providers().snapshot();

}



function getPublicPspSnapshot() {

  if (!isRuntimeBoundaryEnabled()) {

    return legacyFactory().getPublicPspSnapshot();

  }

  return ensureFacadeConfigured().providers().snapshot();

}



async function reconcileAsaasPendingPayouts(input = {}) {

  if (!isRuntimeBoundaryEnabled()) {

    const { reconcileAsaasPendingPayouts: fn } = require('../../finance/reconciliation/asaasPayoutRecovery');

    return fn(input);

  }

  return ensureFacadeConfigured().reconcile.asaasPendingPayouts(input);

}



function isAsaasPayoutRecoveryEnabled() {

  if (!isRuntimeBoundaryEnabled()) {

    const { isAsaasPayoutRecoveryEnabled: fn } = require('../../finance/reconciliation/asaasPayoutRecovery');

    return fn();

  }

  return ensureFacadeConfigured().reconcile.isAsaasRecoveryEnabled();

}



async function approveWithdrawManualAdmin(input = {}) {

  if (!isRuntimeBoundaryEnabled()) {

    return legacyPayout().approveWithdrawManualAdmin(input);

  }

  return ensureFacadeConfigured().withdraw.approveManualAdmin(input);

}



async function approveAndSendWithdrawAdmin(input = {}) {

  if (!isRuntimeBoundaryEnabled()) {

    return legacyPayout().approveAndSendWithdrawAdmin(input);

  }

  return ensureFacadeConfigured().withdraw.approveAndSendAdmin(input);

}



async function cancelWithdrawManualAdmin(input = {}) {

  if (!isRuntimeBoundaryEnabled()) {

    return legacyPayout().cancelWithdrawManualAdmin(input);

  }

  return ensureFacadeConfigured().withdraw.cancelManualAdmin(input);

}



async function runAsaasPayoutRecoveryCycle(runtime = {}) {

  const supabase = runtime.getSupabase?.();

  const dbConnected = runtime.getDbConnected?.();

  const financeLog = runtime.financeLog || (() => {});

  if (!dbConnected || !supabase) return;

  if (!isAsaasPayoutRecoveryEnabled()) return;

  return reconcileAsaasPendingPayouts({ supabase, financeLog });

}



async function runMpDepositReconcileCycle(runtime = {}) {

  if (!isRuntimeBoundaryEnabled()) {

    const { runMpDepositReconcileCycle: fn } = require('../scheduler/mpDepositReconcile');

    return fn(runtime);

  }

  return ensureFacadeConfigured().reconcile.mpDeposits(runtime);

}



function inspect() {

  return {

    flag: FLAG_NAME,

    flagDefault: DEFAULT_VALUE,

    enabled: isRuntimeBoundaryEnabled(),

    mode: isRuntimeBoundaryEnabled() ? 'facade' : 'legacy_direct'

  };

}



module.exports = {

  processPendingWithdrawals,

  createLedgerEntry,

  rollbackWithdraw,

  get payoutCounters() {

    return getPayoutCounters();

  },

  getHealthSnapshot,

  getPublicPspSnapshot,

  reconcileAsaasPendingPayouts,

  isAsaasPayoutRecoveryEnabled,

  approveWithdrawManualAdmin,

  approveAndSendWithdrawAdmin,

  cancelWithdrawManualAdmin,

  runAsaasPayoutRecoveryCycle,

  runMpDepositReconcileCycle,

  inspect,

  isRuntimeBoundaryEnabled,

  FLAG_NAME,

  DEFAULT_VALUE,

  /** bootstrap opcional (flag ON) */

  configure: (deps) => ensureFacadeConfigured(deps)

};

