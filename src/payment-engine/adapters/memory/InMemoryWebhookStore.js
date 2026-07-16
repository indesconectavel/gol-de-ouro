'use strict';



/**

 * PE.2H — InMemoryWebhookStore (fakes / smoke / verify).

 */



const {

  normalizeWebhookStoreInput,

  normalizeWebhookStoreRecord

} = require('../../types/WebhookStoreRecord');



const STATUS_RANK = { received: 1, processing: 2, processed: 3, failed: 3 };



function createInMemoryWebhookStore(seed = {}) {

  /** @type {Map<string, object>} */

  const map = new Map(Object.entries(seed.entries || {}));

  const state = {

    writes: 0,

    markProcessedCalls: 0,

    map

  };



  function k(provider, eventId) {

    return `${provider}:${eventId}`;

  }



  function canTransition(from, to) {

    if (!from) return true;

    if (from === 'processed' && to !== 'processed') return false;

    return true;

  }



  const store = {

    productId: 'in-memory',



    async registerReceived(raw) {

      state.writes += 1;

      const input = normalizeWebhookStoreInput(raw);

      const id = k(input.provider, input.eventId);

      if (map.has(id)) {

        return normalizeWebhookStoreRecord({ ...map.get(id), duplicate: true });

      }

      const rec = normalizeWebhookStoreRecord({

        ...input,

        id,

        status: 'received',

        retryCount: 0

      });

      map.set(id, rec);

      return rec;

    },



    async findByEventId(eventId) {

      for (const rec of map.values()) {

        if (rec.eventId === String(eventId)) return normalizeWebhookStoreRecord(rec);

      }

      return null;

    },



    async findByProviderEvent(provider, providerEventId) {

      const rec = map.get(k(provider, providerEventId));

      return rec ? normalizeWebhookStoreRecord(rec) : null;

    },



    async exists(raw) {

      const input = normalizeWebhookStoreInput(raw);

      const rec = map.get(k(input.provider, input.eventId));

      return { exists: !!rec, record: rec ? normalizeWebhookStoreRecord(rec) : null };

    },



    async markProcessing(raw) {

      state.writes += 1;

      const input = normalizeWebhookStoreInput(raw);

      const id = k(input.provider, input.eventId);

      const prev = map.get(id);

      if (prev && !canTransition(prev.status, 'processing')) {

        return normalizeWebhookStoreRecord({ ...prev, duplicate: true, metadata: { invalidTransition: true } });

      }

      const rec = normalizeWebhookStoreRecord({

        ...(prev || input),

        id,

        status: 'processing',

        receivedAt: prev?.receivedAt || input.receivedAt

      });

      map.set(id, rec);

      return rec;

    },



    async markProcessed(raw) {

      state.writes += 1;

      state.markProcessedCalls += 1;

      const input = normalizeWebhookStoreInput(raw);

      const id = k(input.provider, input.eventId);

      const prev = map.get(id);

      if (prev?.status === 'processed' || prev?._claiming) {

        return normalizeWebhookStoreRecord({

          ...(prev || input),

          id,

          status: prev?.status || 'processed',

          duplicate: true

        });

      }

      if (prev && !canTransition(prev.status, 'processed')) {

        return normalizeWebhookStoreRecord({ ...prev, duplicate: true, metadata: { invalidTransition: true } });

      }

      if (prev) prev._claiming = true;

      const rec = normalizeWebhookStoreRecord({

        ...(prev || input),

        id,

        status: 'processed',

        processedAt: new Date().toISOString(),

        receivedAt: prev?.receivedAt || input.receivedAt,

        metadata: { ...(prev?.metadata || {}), ...(input.metadata || {}) }

      });

      map.set(id, rec);

      return rec;

    },



    async markFailed(raw) {

      state.writes += 1;

      const input = normalizeWebhookStoreInput(raw);

      const id = k(input.provider, input.eventId);

      const prev = map.get(id);

      if (prev?.status === 'processed') {

        return normalizeWebhookStoreRecord({ ...prev, duplicate: true });

      }

      // PE.2H.1 Opção B: status=failed; timeout via lastErrorCode=TIMEOUT

      const errorCode = input.errorCode || raw.errorCode || 'WEBHOOK_FAILED';

      const rec = normalizeWebhookStoreRecord({

        ...(prev || input),

        id,

        status: 'failed',

        failedAt: new Date().toISOString(),

        lastErrorCode: String(errorCode),

        receivedAt: prev?.receivedAt || input.receivedAt,

        metadata: {

          ...(prev?.metadata || {}),

          ...(input.metadata || {}),

          ...(String(errorCode) === 'TIMEOUT' ? { reason: 'TIMEOUT' } : {})

        }

      });

      map.set(id, rec);

      return rec;

    },



    async recordRetry(raw) {

      state.writes += 1;

      const input = normalizeWebhookStoreInput(raw);

      const id = k(input.provider, input.eventId);

      let prev = map.get(id);

      if (!prev) {

        prev = await store.registerReceived(input);

      }

      if (prev.status === 'processed') {

        return normalizeWebhookStoreRecord({ ...prev, duplicate: true });

      }

      const rec = normalizeWebhookStoreRecord({

        ...prev,

        retryCount: (prev.retryCount || 0) + 1,

        status: prev.status === 'failed' ? 'received' : prev.status

      });

      map.set(id, rec);

      return rec;

    }

  };



  return { store, state };

}



module.exports = {

  createInMemoryWebhookStore,

  STATUS_RANK

};

