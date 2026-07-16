'use strict';



/**

 * PE.2J — GolDeOuroPayoutAdapter™

 *

 * Implementação concreta: domain/payout + recovery Asaas.

 * Core NÃO importa domain/payout — só este adapter (e a compat bridge).

 */



const {

  createLedgerEntry,

  rollbackWithdraw,

  processPendingWithdrawals,

  processSingleWithdrawalPayout,

  approveWithdrawManualAdmin,

  approveAndSendWithdrawAdmin,

  cancelWithdrawManualAdmin,

  rollbackWithdrawManualAdmin,

  payoutCounters

} = require('../../../domain/payout/processPendingWithdrawals');



const {

  reconcileAsaasPendingPayouts,

  reconcileSingleAsaasPayout,

  isAsaasPayoutRecoveryEnabled

} = require('../../../finance/reconciliation/asaasPayoutRecovery');



/**

 * @param {object} [deps]

 * @returns {import('../../ports/PayoutStorePort').PayoutStorePort & {

 *   recovery: import('../../ports/PayoutRecoveryPort').PayoutRecoveryPort

 * }}

 */

function createGolDeOuroPayoutAdapter(deps = {}) {

  const productId = deps.productId || 'gol-de-ouro';



  /** @type {import('../../ports/PayoutStorePort').PayoutStorePort} */

  const store = {

    productId,



    async processPending(input = {}) {

      const supabase = input.supabase || deps.supabase || input.runtime?.getSupabase?.();

      return processPendingWithdrawals({

        ...input,

        supabase,

        isDbConnected:

          input.isDbConnected != null

            ? input.isDbConnected

            : deps.isDbConnected != null

              ? deps.isDbConnected

              : !!supabase,

        payoutEnabled:

          input.payoutEnabled != null

            ? input.payoutEnabled

            : deps.payoutEnabled != null

              ? deps.payoutEnabled

              : true

      });

    },



    async processSingle(input = {}) {

      return processSingleWithdrawalPayout(input);

    },



    async createLedgerEntry(input = {}) {

      return createLedgerEntry(input);

    },



    async rollback(input = {}) {

      return rollbackWithdraw(input);

    },



    async approveManualAdmin(input = {}) {

      return approveWithdrawManualAdmin(input);

    },



    async approveAndSendAdmin(input = {}) {

      return approveAndSendWithdrawAdmin(input);

    },



    async cancelManualAdmin(input = {}) {

      return cancelWithdrawManualAdmin(input);

    },



    async rollbackManualAdmin(input = {}) {

      return rollbackWithdrawManualAdmin(input);

    },



    get counters() {

      return payoutCounters;

    }

  };



  /** @type {import('../../ports/PayoutRecoveryPort').PayoutRecoveryPort} */

  const recovery = {

    productId,

    isEnabled() {

      return isAsaasPayoutRecoveryEnabled();

    },

    async reconcilePending(input = {}) {

      return reconcileAsaasPendingPayouts(input);

    },

    async reconcileSingle(input = {}) {

      return reconcileSingleAsaasPayout(input);

    }

  };



  return Object.assign(store, { recovery });

}



module.exports = {

  createGolDeOuroPayoutAdapter

};

