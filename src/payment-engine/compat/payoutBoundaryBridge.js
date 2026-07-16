'use strict';



/**

 * PE.2J — bridge compat payout legado ↔ PayoutStorePort / PayoutRecoveryPort.

 *

 * Flag OFF (default): domain/payout + asaas recovery — comportamento idêntico.

 * Flag ON: core neutro + GolDeOuroPayoutAdapter (delega ao mesmo legado).

 */



const {

  createLedgerEntry,

  rollbackWithdraw,

  processPendingWithdrawals,

  payoutCounters,

  approveWithdrawManualAdmin,

  approveAndSendWithdrawAdmin,

  cancelWithdrawManualAdmin,

  rollbackWithdrawManualAdmin

} = require('../../domain/payout/processPendingWithdrawals');

const {

  reconcileAsaasPendingPayouts,

  isAsaasPayoutRecoveryEnabled

} = require('../../finance/reconciliation/asaasPayoutRecovery');

const { isPayoutBoundaryEnabled } = require('../boundary/payout-boundary-config');

const { createGolDeOuroPayoutAdapter } = require('../adapters/goldeouro/GolDeOuroPayoutAdapter');

const {

  processPendingPayouts,

  createPayoutLedgerEntry,

  rollbackPayout,

  reconcilePayouts

} = require('../core/payout');



function resolveAdapter(deps = {}) {

  if (deps.payoutStore) return deps.payoutStore;

  return createGolDeOuroPayoutAdapter(deps);

}



async function processPendingWithdrawalsCompat(input = {}, deps = {}) {

  if (!isPayoutBoundaryEnabled()) {

    return processPendingWithdrawals(input);

  }

  const adapter = resolveAdapter({ ...deps, supabase: input.supabase || deps.supabase });

  return processPendingPayouts(input, { payoutStore: adapter });

}



async function createLedgerEntryCompat(input = {}, deps = {}) {

  if (!isPayoutBoundaryEnabled()) {

    return createLedgerEntry(input);

  }

  const adapter = resolveAdapter(deps);

  return createPayoutLedgerEntry(input, { payoutStore: adapter });

}



async function rollbackWithdrawCompat(input = {}, deps = {}) {

  if (!isPayoutBoundaryEnabled()) {

    return rollbackWithdraw(input);

  }

  const adapter = resolveAdapter(deps);

  return rollbackPayout(input, { payoutStore: adapter });

}



function payoutCountersCompat() {

  if (!isPayoutBoundaryEnabled()) {

    return payoutCounters;

  }

  const adapter = createGolDeOuroPayoutAdapter();

  return adapter.counters;

}



async function reconcileAsaasPendingPayoutsCompat(input = {}, deps = {}) {

  if (!isPayoutBoundaryEnabled()) {

    return reconcileAsaasPendingPayouts(input);

  }

  const adapter = resolveAdapter(deps);

  return reconcilePayouts(input, { payoutRecovery: adapter.recovery });

}



function isAsaasPayoutRecoveryEnabledCompat() {

  if (!isPayoutBoundaryEnabled()) {

    return isAsaasPayoutRecoveryEnabled();

  }

  return createGolDeOuroPayoutAdapter().recovery.isEnabled();

}



async function approveWithdrawManualAdminCompat(input = {}, deps = {}) {

  if (!isPayoutBoundaryEnabled()) {

    return approveWithdrawManualAdmin(input);

  }

  return resolveAdapter(deps).approveManualAdmin(input);

}



async function approveAndSendWithdrawAdminCompat(input = {}, deps = {}) {

  if (!isPayoutBoundaryEnabled()) {

    return approveAndSendWithdrawAdmin(input);

  }

  return resolveAdapter(deps).approveAndSendAdmin(input);

}



async function cancelWithdrawManualAdminCompat(input = {}, deps = {}) {

  if (!isPayoutBoundaryEnabled()) {

    return cancelWithdrawManualAdmin(input);

  }

  return resolveAdapter(deps).cancelManualAdmin(input);

}



async function rollbackWithdrawManualAdminCompat(input = {}, deps = {}) {

  if (!isPayoutBoundaryEnabled()) {

    return rollbackWithdrawManualAdmin(input);

  }

  return resolveAdapter(deps).rollbackManualAdmin(input);

}



module.exports = {

  processPendingWithdrawalsCompat,

  createLedgerEntryCompat,

  rollbackWithdrawCompat,

  payoutCountersCompat,

  reconcileAsaasPendingPayoutsCompat,

  isAsaasPayoutRecoveryEnabledCompat,

  approveWithdrawManualAdminCompat,

  approveAndSendWithdrawAdminCompat,

  cancelWithdrawManualAdminCompat,

  rollbackWithdrawManualAdminCompat

};

