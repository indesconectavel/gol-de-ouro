'use strict';



/**

 * PE.2H — GolDeOuroWebhookStore™

 *

 * Persistência concreta do ciclo de vida de webhook no produto Gol de Ouro™.

 *

 * Realidade auditada (sem migration neste gate):

 * - NÃO existe tabela webhook_events no schema GDO.

 * - Lifecycle sandbox = PaymentWebhookDryRunStore (in-memory homologado F4.5).

 * - Idempotência financeira de depósito = IdempotencyStore / pagamentos_pix (PE.2G).

 *

 * Este adapter concentra o store concreto e traduz para WebhookStorePort.

 * Flag: PE_WEBHOOK_STORE_PORT_ENABLED=true.

 */



const {

  PaymentWebhookDryRunStore,

  defaultStore

} = require('../../../finance/webhooks/paymentWebhookDryRunStore');

const {

  normalizeWebhookStoreInput,

  normalizeWebhookStoreRecord

} = require('../../types/WebhookStoreRecord');



const STATUS_RANK = { received: 1, processing: 2, processed: 3, failed: 3 };



/**

 * @param {object} [deps]

 * @param {PaymentWebhookDryRunStore} [deps.backingStore]

 * @returns {import('../../ports/WebhookStorePort').WebhookStorePort & { recordCreditDecision: Function, snapshot: Function }}

 */

function createGolDeOuroWebhookStore(deps = {}) {

  const backing = deps.backingStore || defaultStore;

  /** @type {Map<string, import('../../ports/WebhookStorePort').WebhookStoreRecord>} */

  const records = new Map();



  function keyOf(provider, eventId) {

    return `${provider}:${eventId}`;

  }



  function getOrNull(provider, eventId) {

    return records.get(keyOf(provider, eventId)) || null;

  }



  function canTransition(from, to) {

    if (!from) return true;

    if (from === 'processed' && to !== 'processed') return false;

    return (STATUS_RANK[to] || 0) >= (STATUS_RANK[from] || 0) || to === from;

  }



  return {

    productId: 'gol-de-ouro',



    async registerReceived(raw) {

      const input = normalizeWebhookStoreInput(raw);

      const k = keyOf(input.provider, input.eventId);

      const existing = records.get(k);

      if (existing) {

        return normalizeWebhookStoreRecord({ ...existing, duplicate: true });

      }

      const record = normalizeWebhookStoreRecord({

        ...input,

        id: k,

        status: 'received',

        retryCount: 0,

        processedAt: null,

        failedAt: null,

        lastErrorCode: null,

        duplicate: false

      });

      records.set(k, record);

      return record;

    },



    async findByEventId(eventId) {

      const id = String(eventId || '');

      for (const rec of records.values()) {

        if (rec.eventId === id) return normalizeWebhookStoreRecord(rec);

      }

      return null;

    },



    async findByProviderEvent(provider, providerEventId) {

      const rec = getOrNull(String(provider || ''), String(providerEventId || ''));

      return rec ? normalizeWebhookStoreRecord(rec) : null;

    },



    async exists(raw) {

      const input = normalizeWebhookStoreInput(raw);

      // Alinha com DryRun.hasProcessed

      const dry = typeof backing.hasProcessed === 'function'

        ? backing.hasProcessed(input.provider, input.eventId)

        : false;

      const rec = getOrNull(input.provider, input.eventId);

      if (rec || dry) {

        return {

          exists: true,

          record: rec

            ? normalizeWebhookStoreRecord(rec)

            : normalizeWebhookStoreRecord({

                ...input,

                id: keyOf(input.provider, input.eventId),

                status: 'processed',

                duplicate: true

              })

        };

      }

      return { exists: false, record: null };

    },



    async markProcessing(raw) {

      const input = normalizeWebhookStoreInput(raw);

      const k = keyOf(input.provider, input.eventId);

      const prev = records.get(k);

      if (prev && !canTransition(prev.status, 'processing')) {

        return normalizeWebhookStoreRecord({

          ...prev,

          duplicate: true,

          metadata: { ...(prev.metadata || {}), invalidTransition: true }

        });

      }

      const record = normalizeWebhookStoreRecord({

        ...(prev || input),

        id: k,

        status: 'processing',

        retryCount: prev?.retryCount || 0,

        receivedAt: prev?.receivedAt || input.receivedAt,

        metadata: { ...(prev?.metadata || {}), ...(input.metadata || {}) }

      });

      records.set(k, record);

      return record;

    },



    async markProcessed(raw) {

      const input = normalizeWebhookStoreInput(raw);

      // Delega ao DryRun homologado (mesma chave provider:eventId)

      const legacyEvent = {

        provider: input.provider,

        eventId: input.eventId,

        paymentId: input.resourceId,

        status: input.metadata?.status,

        amount: input.metadata?.amount,

        shouldCreditWallet: input.metadata?.shouldCreditWallet === true,

        eventType: input.eventType

      };

      const mark = backing.markProcessed(legacyEvent, {

        ...(input.metadata || {}),

        pe2h: true

      });



      const k = keyOf(input.provider, input.eventId);

      const prev = records.get(k);

      if (prev && prev.status === 'processed') {

        return normalizeWebhookStoreRecord({

          ...prev,

          duplicate: true

        });

      }

      if (prev && !canTransition(prev.status, 'processed') && prev.status === 'processed') {

        return normalizeWebhookStoreRecord({ ...prev, duplicate: true });

      }



      const record = normalizeWebhookStoreRecord({

        ...(prev || input),

        id: k,

        status: 'processed',

        duplicate: mark.duplicate === true,

        processedAt: new Date().toISOString(),

        failedAt: null,

        retryCount: prev?.retryCount || 0,

        receivedAt: prev?.receivedAt || input.receivedAt,

        metadata: {

          ...(prev?.metadata || {}),

          ...(input.metadata || {}),

          dryRunLegacy: true

        }

      });

      records.set(k, record);

      return record;

    },



    async markFailed(raw) {

      const input = normalizeWebhookStoreInput(raw);

      const k = keyOf(input.provider, input.eventId);

      const prev = records.get(k);

      if (prev?.status === 'processed') {

        return normalizeWebhookStoreRecord({

          ...prev,

          duplicate: true,

          metadata: { ...(prev.metadata || {}), failedAfterProcessed: false }

        });

      }

      // PE.2H.1 Opção B: status=failed; timeout = lastErrorCode TIMEOUT (nunca status TIMEOUT)

      const errorCode = input.errorCode || raw.errorCode || raw?.metadata?.errorCode || 'WEBHOOK_FAILED';

      const record = normalizeWebhookStoreRecord({

        ...(prev || input),

        id: k,

        status: 'failed',

        failedAt: new Date().toISOString(),

        lastErrorCode: String(errorCode),

        retryCount: prev?.retryCount || 0,

        receivedAt: prev?.receivedAt || input.receivedAt,

        metadata: {

          ...(prev?.metadata || {}),

          ...(input.metadata || {}),

          ...(String(errorCode) === 'TIMEOUT' ? { reason: 'TIMEOUT' } : {})

        }

      });

      records.set(k, record);

      return record;

    },



    async recordRetry(raw) {

      const input = normalizeWebhookStoreInput(raw);

      const k = keyOf(input.provider, input.eventId);

      const prev = records.get(k) || (await this.registerReceived(input));

      if (prev.status === 'processed') {

        return normalizeWebhookStoreRecord({ ...prev, duplicate: true });

      }

      const record = normalizeWebhookStoreRecord({

        ...prev,

        retryCount: (prev.retryCount || 0) + 1,

        status: prev.status === 'failed' ? 'received' : prev.status,

        metadata: {

          ...(prev.metadata || {}),

          lastRetryAt: new Date().toISOString()

        }

      });

      records.set(k, record);

      return record;

    },



    recordCreditDecision(event, decision) {

      if (typeof backing.recordCreditDecision === 'function') {

        return backing.recordCreditDecision(event, decision);

      }

      return decision;

    },



    snapshot() {

      const base = typeof backing.snapshot === 'function' ? backing.snapshot() : {};

      return {

        ...base,

        pe2hRecords: records.size,

        productId: 'gol-de-ouro'

      };

    }

  };

}



module.exports = {

  createGolDeOuroWebhookStore,

  PaymentWebhookDryRunStore

};

