'use strict';



/**

 * PE.2G — IdempotencyStore in-memory (testes / smoke; sem banco).

 */



const { normalizeIdempotencyKey, normalizeIdempotencyRecord } = require('../../types/IdempotencyKey');



function createInMemoryIdempotencyStore(seed = {}) {

  /** @type {Map<string, { state: string, status?: string, metadata?: object }>} */

  const map = new Map();



  for (const [k, v] of Object.entries(seed.entries || {})) {

    map.set(k, v);

  }



  const state = {

    reserveCalls: 0,

    commitCalls: 0,

    rollbackCalls: 0,

    map

  };



  function id(input) {

    return `${input.scope}:${input.key}`;

  }



  const store = {

    productId: 'in-memory',



    async exists(raw) {

      const input = normalizeIdempotencyKey(raw);

      const row = map.get(id(input));

      if (!row) {

        return normalizeIdempotencyRecord({

          scope: input.scope,

          key: input.key,

          state: 'none',

          exists: false

        });

      }

      return normalizeIdempotencyRecord({

        scope: input.scope,

        key: input.key,

        state: row.state,

        exists: true,

        reserved: row.state === 'reserved',

        duplicate: row.state === 'processed',

        status: row.status || (row.state === 'processed' ? 'approved' : null),

        metadata: row.metadata || {}

      });

    },



    async find(raw) {

      const rec = await store.exists(raw);

      return rec.exists ? rec : null;

    },



    async reserve(raw) {

      state.reserveCalls += 1;

      const input = normalizeIdempotencyKey(raw);

      const k = id(input);

      const row = map.get(k);

      if (row && (row.state === 'processed' || row.state === 'reserved')) {

        return normalizeIdempotencyRecord({

          scope: input.scope,

          key: input.key,

          state: row.state,

          exists: true,

          reserved: false,

          duplicate: true,

          status: row.status || null,

          metadata: { reason: 'RESERVE_DUPLICATE' }

        });

      }

      map.set(k, { state: 'reserved', status: 'pending', metadata: input.metadata || {} });

      return normalizeIdempotencyRecord({

        scope: input.scope,

        key: input.key,

        state: 'reserved',

        exists: true,

        reserved: true,

        duplicate: false,

        status: 'pending'

      });

    },



    async commit(raw) {

      state.commitCalls += 1;

      const input = normalizeIdempotencyKey(raw);

      const k = id(input);

      const row = map.get(k);

      if (row && row.state === 'processed') {

        return normalizeIdempotencyRecord({

          scope: input.scope,

          key: input.key,

          state: 'processed',

          exists: true,

          duplicate: true,

          status: 'approved',

          metadata: { reason: 'COMMIT_DUPLICATE' }

        });

      }

      map.set(k, { state: 'processed', status: 'approved', metadata: input.metadata || {} });

      return normalizeIdempotencyRecord({

        scope: input.scope,

        key: input.key,

        state: 'processed',

        exists: true,

        reserved: false,

        duplicate: false,

        status: 'approved'

      });

    },



    async markProcessed(raw) {

      return store.commit(raw);

    },



    async rollback(raw) {

      state.rollbackCalls += 1;

      const input = normalizeIdempotencyKey(raw);

      const k = id(input);

      const row = map.get(k);

      if (!row) {

        return normalizeIdempotencyRecord({

          scope: input.scope,

          key: input.key,

          state: 'none',

          exists: false,

          metadata: { reason: 'NOTHING_TO_ROLLBACK' }

        });

      }

      if (row.state === 'processed') {

        return normalizeIdempotencyRecord({

          scope: input.scope,

          key: input.key,

          state: 'processed',

          exists: true,

          duplicate: true,

          status: 'approved',

          metadata: { reason: 'ROLLBACK_ON_PROCESSED_NOOP' }

        });

      }

      map.delete(k);

      return normalizeIdempotencyRecord({

        scope: input.scope,

        key: input.key,

        state: 'none',

        exists: false,

        metadata: { rolledBack: true }

      });

    },



    async release(raw) {

      return store.rollback(raw);

    },



    async markFailed(raw) {

      const input = normalizeIdempotencyKey(raw);

      map.set(id(input), {

        state: 'failed',

        status: 'failed',

        metadata: { reason: raw?.reason || 'MARK_FAILED' }

      });

      return normalizeIdempotencyRecord({

        scope: input.scope,

        key: input.key,

        state: 'failed',

        exists: true,

        status: 'failed',

        metadata: { reason: raw?.reason || 'MARK_FAILED' }

      });

    }

  };



  return { store, state };

}



module.exports = {

  createInMemoryIdempotencyStore

};

