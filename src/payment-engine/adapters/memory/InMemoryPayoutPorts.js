'use strict';



/**

 * PE.2J — fake in-memory PayoutStorePort + PayoutRecoveryPort (smoke only).

 */



function createInMemoryPayoutPorts(seed = {}) {

  const counters = { success: 0, fail: 0 };

  const ledger = new Map();

  const withdrawals = Array.isArray(seed.withdrawals) ? [...seed.withdrawals] : [];

  let recoveryEnabled = seed.recoveryEnabled !== false;



  /** @type {import('../../ports/PayoutStorePort').PayoutStorePort} */

  const payoutStore = {

    productId: 'memory',

    async processPending(input = {}) {

      if (input.payoutEnabled === false) {

        return { success: true, processed: false, processedCount: 0 };

      }

      if (input.isDbConnected === false) {

        return { success: false, processed: false, error: { code: 'DB_DOWN' } };

      }

      const pending = withdrawals.filter((w) => w.status === 'pending');

      for (const w of pending) {

        w.status = 'processing';

        counters.success += 1;

        w.status = 'paid';

      }

      return {

        success: true,

        processed: pending.length > 0,

        processedCount: pending.length

      };

    },

    async processSingle(input = {}) {

      const id = String(input.withdrawalId || input.saqueId || '');

      const w = withdrawals.find((x) => String(x.id) === id);

      if (!w) return { success: false, error: { code: 'NOT_FOUND' } };

      w.status = 'paid';

      counters.success += 1;

      return { success: true, id };

    },

    async createLedgerEntry(input = {}) {

      const key = `${input.correlationId}|${input.tipo}|${input.referencia}`;

      if (ledger.has(key)) {

        return { success: true, id: ledger.get(key), deduped: true };

      }

      const id = `led_${ledger.size + 1}`;

      ledger.set(key, id);

      return { success: true, id, deduped: false };

    },

    async rollback(input = {}) {

      return { success: true, rolledBack: true, motivo: input.motivo || 'TEST_ROLLBACK' };

    },

    async approveManualAdmin() {

      return { success: true };

    },

    async approveAndSendAdmin() {

      return { success: true };

    },

    async cancelManualAdmin() {

      return { success: true };

    },

    async rollbackManualAdmin() {

      return { success: true };

    },

    get counters() {

      return counters;

    }

  };



  /** @type {import('../../ports/PayoutRecoveryPort').PayoutRecoveryPort} */

  const payoutRecovery = {

    productId: 'memory',

    isEnabled() {

      return recoveryEnabled;

    },

    async reconcilePending() {

      if (!recoveryEnabled) return { success: false, skipped: true };

      return { success: true, recovered: 0 };

    },

    async reconcileSingle() {

      if (!recoveryEnabled) return { success: false, skipped: true };

      return { success: true };

    }

  };



  return {

    payoutStore,

    payoutRecovery,

    _test: {

      withdrawals,

      ledger,

      setRecoveryEnabled(v) {

        recoveryEnabled = !!v;

      }

    }

  };

}



module.exports = { createInMemoryPayoutPorts };

