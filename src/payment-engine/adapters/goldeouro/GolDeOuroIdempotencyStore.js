'use strict';



/**

 * PE.2G — GolDeOuroIdempotencyStore™

 *

 * Concentra persistência GDO de idempotência de depósito PIX.

 * Delega a checkSupabaseDepositIdempotency (homologado) para exists/find.

 *

 * reserve/commit/rollback/release para escopo deposit_pix:

 * - leitura + estados lógicos (legado de webhook não faz lock DB separado;

 *   o claim/ledger persiste a atomicidade financeira).

 *

 * Flag: PE_IDEMPOTENCY_PORT_ENABLED=true para ativar caminhos por port.

 */



const { checkSupabaseDepositIdempotency } = require('../../../finance/webhooks/paymentWebhookIdempotency');

const { normalizeIdempotencyKey, normalizeIdempotencyRecord } = require('../../types/IdempotencyKey');



/**

 * @param {object} deps

 * @param {object} deps.supabase

 * @param {Map<string, object>} [deps.localLocks] — locks lógicos in-process (reserve)

 * @returns {import('../../ports/IdempotencyStore').IdempotencyStore}

 */

function createGolDeOuroIdempotencyStore(deps = {}) {

  const { supabase } = deps;

  const localLocks = deps.localLocks || new Map();



  function lockKey(input) {

    return `${input.scope}:${input.key}`;

  }



  async function readDepositStatus(paymentId) {

    const legacy = await checkSupabaseDepositIdempotency(supabase, paymentId);

    return legacy;

  }



  return {

    productId: 'gol-de-ouro',



    async exists(raw) {

      const input = normalizeIdempotencyKey(raw, 'deposit_pix');

      if (!input.key) {

        return normalizeIdempotencyRecord({

          scope: input.scope,

          key: '',

          state: 'none',

          exists: false,

          error: new Error('INVALID_KEY')

        });

      }



      if (input.scope === 'deposit_pix' || input.scope === 'deposit') {

        const legacy = await readDepositStatus(input.key);

        const approved = legacy.alreadyProcessed === true;

        return normalizeIdempotencyRecord({

          scope: input.scope,

          key: input.key,

          state: approved ? 'processed' : legacy.existingStatus ? 'reserved' : 'none',

          exists: legacy.existingStatus != null || approved,

          reserved: !approved && legacy.existingStatus != null,

          duplicate: approved,

          status: legacy.existingStatus,

          metadata: {

            source: 'goldeouro_idempotency_store',

            alreadyProcessed: approved

          }

        });

      }



      const lk = lockKey(input);

      const local = localLocks.get(lk);

      if (local) {

        return normalizeIdempotencyRecord({

          scope: input.scope,

          key: input.key,

          state: local.state,

          exists: true,

          reserved: local.state === 'reserved',

          duplicate: local.state === 'processed',

          status: local.status || null,

          metadata: local.metadata || {}

        });

      }

      return normalizeIdempotencyRecord({

        scope: input.scope,

        key: input.key,

        state: 'none',

        exists: false

      });

    },



    async find(raw) {

      const rec = await this.exists(raw);

      if (!rec.exists && rec.state === 'none') return null;

      return rec;

    },



    async reserve(raw) {

      const input = normalizeIdempotencyKey(raw, 'deposit_pix');

      const existing = await this.exists(input);

      if (existing.duplicate || existing.state === 'processed') {

        return normalizeIdempotencyRecord({

          ...existing,

          reserved: false,

          duplicate: true

        });

      }

      const lk = lockKey(input);

      if (localLocks.has(lk) && localLocks.get(lk).state === 'reserved') {

        return normalizeIdempotencyRecord({

          scope: input.scope,

          key: input.key,

          state: 'reserved',

          exists: true,

          reserved: false,

          duplicate: true,

          status: existing.status,

          metadata: { reason: 'RESERVE_DUPLICATE' }

        });

      }

      localLocks.set(lk, {

        state: 'reserved',

        status: existing.status,

        metadata: { ...(input.metadata || {}), reservedAt: new Date().toISOString() }

      });

      return normalizeIdempotencyRecord({

        scope: input.scope,

        key: input.key,

        state: 'reserved',

        exists: true,

        reserved: true,

        duplicate: false,

        status: existing.status,

        metadata: { source: 'goldeouro_idempotency_store' }

      });

    },



    async commit(raw) {

      const input = normalizeIdempotencyKey(raw, 'deposit_pix');

      const lk = lockKey(input);

      localLocks.set(lk, {

        state: 'processed',

        status: 'approved',

        metadata: { ...(input.metadata || {}), committedAt: new Date().toISOString() }

      });

      return normalizeIdempotencyRecord({

        scope: input.scope,

        key: input.key,

        state: 'processed',

        exists: true,

        reserved: false,

        duplicate: false,

        status: 'approved',

        metadata: { source: 'goldeouro_idempotency_store', note: 'logical_commit' }

      });

    },



    async markProcessed(raw) {

      return this.commit(raw);

    },



    async rollback(raw) {

      const input = normalizeIdempotencyKey(raw, 'deposit_pix');

      const lk = lockKey(input);

      const prev = localLocks.get(lk);

      if (!prev) {

        return normalizeIdempotencyRecord({

          scope: input.scope,

          key: input.key,

          state: 'none',

          exists: false,

          metadata: { reason: 'NOTHING_TO_ROLLBACK' }

        });

      }

      if (prev.state === 'processed') {

        return normalizeIdempotencyRecord({

          scope: input.scope,

          key: input.key,

          state: 'processed',

          exists: true,

          duplicate: true,

          status: prev.status || 'approved',

          metadata: { reason: 'ROLLBACK_ON_PROCESSED_NOOP' }

        });

      }

      localLocks.delete(lk);

      return normalizeIdempotencyRecord({

        scope: input.scope,

        key: input.key,

        state: 'none',

        exists: false,

        reserved: false,

        metadata: { rolledBack: true }

      });

    },



    async release(raw) {

      return this.rollback(raw);

    },



    async markFailed(raw) {

      const input = normalizeIdempotencyKey(raw, 'deposit_pix');

      const lk = lockKey(input);

      localLocks.set(lk, {

        state: 'failed',

        status: 'failed',

        metadata: { reason: raw?.reason || 'MARK_FAILED' }

      });

      return normalizeIdempotencyRecord({

        scope: input.scope,

        key: input.key,

        state: 'failed',

        exists: true,

        reserved: false,

        status: 'failed',

        metadata: { reason: raw?.reason || 'MARK_FAILED' }

      });

    }

  };

}



module.exports = {

  createGolDeOuroIdempotencyStore

};

