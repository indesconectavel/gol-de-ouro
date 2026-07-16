'use strict';



/**

 * PE.2H — normalização de entrada/registro WebhookStore (neutro).

 */



const crypto = require('crypto');



/**

 * @param {object} raw

 * @returns {import('../ports/WebhookStorePort').WebhookStoreInput}

 */

function normalizeWebhookStoreInput(raw = {}) {

  const provider = String(raw.provider || 'unknown');

  const eventId = String(raw.eventId || raw.providerEventId || '').trim();

  const resourceId =

    raw.resourceId != null

      ? String(raw.resourceId)

      : raw.paymentId != null

        ? String(raw.paymentId)

        : null;

  const correlationId = String(raw.correlationId || eventId || resourceId || '').trim();

  return {

    provider,

    eventId,

    eventType: raw.eventType != null ? String(raw.eventType) : null,

    resourceId,

    correlationId,

    receivedAt: raw.receivedAt != null ? String(raw.receivedAt) : new Date().toISOString(),

    payloadHash: raw.payloadHash != null ? String(raw.payloadHash) : null,

    status: raw.status != null ? String(raw.status) : 'received',

    // PE.2H.1 — errorCode preservado (TIMEOUT não é status)

    errorCode:

      raw.errorCode != null

        ? String(raw.errorCode)

        : raw.metadata?.errorCode != null

          ? String(raw.metadata.errorCode)

          : undefined,

    metadata: sanitizeMetadata(raw.metadata || {})

  };

}



/**

 * Remove tokens / secrets óbvios de metadata.

 * @param {Record<string, unknown>} meta

 */

function sanitizeMetadata(meta) {

  const out = {};

  const blocked = /token|secret|password|authorization|access[_-]?key|api[_-]?key/i;

  for (const [k, v] of Object.entries(meta || {})) {

    if (blocked.test(k)) continue;

    if (typeof v === 'string' && v.length > 500) {

      out[k] = `${v.slice(0, 64)}…`;

      continue;

    }

    out[k] = v;

  }

  return out;

}



/**

 * @param {Partial<import('../ports/WebhookStorePort').WebhookStoreRecord>} partial

 * @returns {import('../ports/WebhookStorePort').WebhookStoreRecord}

 */

function normalizeWebhookStoreRecord(partial = {}) {

  const provider = String(partial.provider || 'unknown');

  const eventId = String(partial.eventId || '');

  return {

    id: String(partial.id || `${provider}:${eventId}` || crypto.randomUUID()),

    provider,

    eventId,

    eventType: partial.eventType != null ? String(partial.eventType) : null,

    resourceId: partial.resourceId != null ? String(partial.resourceId) : null,

    correlationId: String(partial.correlationId || eventId || ''),

    status: partial.status || 'received',

    retryCount: Number.isFinite(Number(partial.retryCount)) ? Number(partial.retryCount) : 0,

    receivedAt: String(partial.receivedAt || new Date().toISOString()),

    processedAt: partial.processedAt != null ? String(partial.processedAt) : null,

    failedAt: partial.failedAt != null ? String(partial.failedAt) : null,

    lastErrorCode: partial.lastErrorCode != null ? String(partial.lastErrorCode) : null,

    duplicate: !!partial.duplicate,

    metadata: sanitizeMetadata(partial.metadata || {}),

    error: partial.error

  };

}



/**

 * Evento de webhook finance → input neutro do store.

 */

function inputFromNormalizedEvent(event = {}, meta = {}) {

  return normalizeWebhookStoreInput({

    provider: event.provider,

    eventId: event.eventId,

    eventType: event.eventType || event.rawStatus || null,

    resourceId: event.paymentId || event.resourceId || null,

    correlationId: event.correlationId || event.eventId || event.paymentId,

    metadata: {

      shouldCreditWallet: event.shouldCreditWallet === true,

      status: event.status,

      amount: event.amount,

      ...meta

    }

  });

}



module.exports = {

  normalizeWebhookStoreInput,

  normalizeWebhookStoreRecord,

  sanitizeMetadata,

  inputFromNormalizedEvent

};

