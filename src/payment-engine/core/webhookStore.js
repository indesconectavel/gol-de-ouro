'use strict';



/**

 * PE.2H — core neutro de ciclo de vida de webhook (somente WebhookStorePort).

 * Sem cliente DB, sem schema de produto, sem Express.

 *

 * Ordem segura com IdempotencyStore (PE.2G):

 * 1) IdempotencyStore.exists / reserve (decisão de duplicidade financeira)

 * 2) WebhookStorePort.registerReceived (rastreabilidade)

 * 3) processamento provider

 * 4) markProcessed | markFailed

 */



const {

  normalizeWebhookStoreInput,

  normalizeWebhookStoreRecord,

  inputFromNormalizedEvent

} = require('../types/WebhookStoreRecord');



async function registerReceived(store, raw) {

  if (!store || typeof store.registerReceived !== 'function') {

    return normalizeWebhookStoreRecord({

      status: 'received',

      error: new Error('WEBHOOK_STORE_UNAVAILABLE')

    });

  }

  const input = normalizeWebhookStoreInput(raw);

  if (!input.eventId) {

    return normalizeWebhookStoreRecord({

      ...input,

      status: 'failed',

      lastErrorCode: 'INVALID_EVENT_ID',

      error: new Error('INVALID_EVENT_ID')

    });

  }

  return normalizeWebhookStoreRecord(await store.registerReceived(input));

}



async function exists(store, raw) {

  if (!store || typeof store.exists !== 'function') {

    return { exists: false, record: null, error: new Error('WEBHOOK_STORE_UNAVAILABLE') };

  }

  return store.exists(normalizeWebhookStoreInput(raw));

}



async function findByEventId(store, eventId) {

  if (!store || typeof store.findByEventId !== 'function') return null;

  const rec = await store.findByEventId(String(eventId || ''));

  return rec ? normalizeWebhookStoreRecord(rec) : null;

}



async function findByProviderEvent(store, provider, providerEventId) {

  if (!store || typeof store.findByProviderEvent !== 'function') return null;

  const rec = await store.findByProviderEvent(String(provider || ''), String(providerEventId || ''));

  return rec ? normalizeWebhookStoreRecord(rec) : null;

}



async function markProcessing(store, raw) {

  if (!store || typeof store.markProcessing !== 'function') {

    return normalizeWebhookStoreRecord({

      status: 'processing',

      error: new Error('WEBHOOK_STORE_UNAVAILABLE')

    });

  }

  return normalizeWebhookStoreRecord(await store.markProcessing(normalizeWebhookStoreInput(raw)));

}



async function markProcessed(store, raw) {

  if (!store || typeof store.markProcessed !== 'function') {

    return normalizeWebhookStoreRecord({

      status: 'processed',

      error: new Error('WEBHOOK_STORE_UNAVAILABLE')

    });

  }

  return normalizeWebhookStoreRecord(await store.markProcessed(normalizeWebhookStoreInput(raw)));

}



async function markFailed(store, raw) {

  if (!store || typeof store.markFailed !== 'function') {

    return normalizeWebhookStoreRecord({

      status: 'failed',

      lastErrorCode: raw?.errorCode ? String(raw.errorCode) : 'WEBHOOK_FAILED',

      error: new Error('WEBHOOK_STORE_UNAVAILABLE')

    });

  }

  // PE.2H.1 — preservar errorCode (ex.: TIMEOUT) através da normalização

  const input = normalizeWebhookStoreInput(raw);

  if (raw?.errorCode != null && input.errorCode == null) {

    input.errorCode = String(raw.errorCode);

  }

  return normalizeWebhookStoreRecord(await store.markFailed(input));

}



async function recordRetry(store, raw) {

  if (!store || typeof store.recordRetry !== 'function') {

    return normalizeWebhookStoreRecord({

      status: 'received',

      error: new Error('WEBHOOK_STORE_UNAVAILABLE')

    });

  }

  return normalizeWebhookStoreRecord(await store.recordRetry(normalizeWebhookStoreInput(raw)));

}



/**

 * Shape legado DryRun: { duplicate, record }.

 */

async function markProcessedLegacyShape(store, event, meta = {}) {

  const result = await markProcessed(store, inputFromNormalizedEvent(event, meta));

  return {

    duplicate: result.duplicate === true,

    record: result

  };

}



module.exports = {

  registerReceived,

  exists,

  findByEventId,

  findByProviderEvent,

  markProcessing,

  markProcessed,

  markFailed,

  recordRetry,

  markProcessedLegacyShape,

  inputFromNormalizedEvent

};

