'use strict';



/**

 * PE.2J — Core payout (somente ports).

 * ZERO domain/payout · ZERO Supabase · ZERO schema GDO.

 */



const {

  normalizePayoutProcessInput,

  normalizePayoutProcessResult

} = require('../types/PayoutProcessInput');



/**

 * @param {object} rawInput

 * @param {{ payoutStore: import('../ports/PayoutStorePort').PayoutStorePort }} ports

 */

async function processPendingPayouts(rawInput, ports = {}) {

  const input = normalizePayoutProcessInput(rawInput);

  const store = ports.payoutStore;

  if (!store || typeof store.processPending !== 'function') {

    return normalizePayoutProcessResult({

      success: false,

      processed: false,

      error: { code: 'PAYOUT_STORE_PORT_UNAVAILABLE' }

    });

  }

  const result = await store.processPending(input);

  return normalizePayoutProcessResult(result);

}



/**

 * @param {object} input

 * @param {{ payoutStore: import('../ports/PayoutStorePort').PayoutStorePort }} ports

 */

async function createPayoutLedgerEntry(input, ports = {}) {

  const store = ports.payoutStore;

  if (!store || typeof store.createLedgerEntry !== 'function') {

    return { success: false, error: { code: 'PAYOUT_STORE_PORT_UNAVAILABLE' } };

  }

  return store.createLedgerEntry(input);

}



/**

 * @param {object} input

 * @param {{ payoutStore: import('../ports/PayoutStorePort').PayoutStorePort }} ports

 */

async function rollbackPayout(input, ports = {}) {

  const store = ports.payoutStore;

  if (!store || typeof store.rollback !== 'function') {

    return { success: false, error: { code: 'PAYOUT_STORE_PORT_UNAVAILABLE' } };

  }

  return store.rollback(input);

}



/**

 * @param {object} [input]

 * @param {{ payoutRecovery: import('../ports/PayoutRecoveryPort').PayoutRecoveryPort }} ports

 */

async function reconcilePayouts(input, ports = {}) {

  const recovery = ports.payoutRecovery;

  if (!recovery || typeof recovery.reconcilePending !== 'function') {

    return { success: false, error: { code: 'PAYOUT_RECOVERY_PORT_UNAVAILABLE' } };

  }

  if (typeof recovery.isEnabled === 'function' && !recovery.isEnabled()) {

    return { success: false, skipped: true, reason: 'RECOVERY_DISABLED' };

  }

  return recovery.reconcilePending(input || {});

}



module.exports = {

  processPendingPayouts,

  createPayoutLedgerEntry,

  rollbackPayout,

  reconcilePayouts

};

