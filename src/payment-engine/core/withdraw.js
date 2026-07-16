'use strict';



/**

 * PE.2J — Core withdraw.

 * ZERO domain/payout · ZERO finance/* direto.

 * Orquestração via payoutBoundaryBridge / core/payout (ports).

 */



const {

  processPendingWithdrawalsCompat,

  createLedgerEntryCompat,

  rollbackWithdrawCompat,

  payoutCountersCompat

} = require('../compat/payoutBoundaryBridge');

const payoutCore = require('./payout');



module.exports = {

  processPendingWithdrawalsCompat,

  createLedgerEntryCompat,

  rollbackWithdrawCompat,

  get payoutCounters() {

    return payoutCountersCompat();

  },

  processPendingPayouts: payoutCore.processPendingPayouts,

  createPayoutLedgerEntry: payoutCore.createPayoutLedgerEntry,

  rollbackPayout: payoutCore.rollbackPayout,

  reconcilePayouts: payoutCore.reconcilePayouts,

  __pe2j: 'payout_boundary_bridge'

};

