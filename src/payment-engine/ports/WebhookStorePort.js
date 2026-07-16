'use strict';



/**

 * PE.2H / PE.2H.1 — WebhookStorePort™ (rastreabilidade / ciclo de vida do webhook).

 *

 * Separado de IdempotencyStore (PE.2G):

 * - IdempotencyStore → reserva / duplicidade financeira

 * - WebhookStorePort → registro / status / retry / auditoria do evento

 *

 * Semântica de timeout (PE.2H.1 — Opção B, oficial):

 *   status = 'failed'

 *   lastErrorCode = 'TIMEOUT'

 * NÃO existe status 'TIMEOUT' no enum.

 *

 * Sem Supabase, sem tabelas, sem Express, sem SDK PSP.

 *

 * @typedef {Object} WebhookStoreInput

 * @property {string} provider

 * @property {string} eventId

 * @property {string | null} [eventType]

 * @property {string | null} [resourceId]

 * @property {string} [correlationId]

 * @property {string} [receivedAt]

 * @property {string | null} [payloadHash]

 * @property {string} [status]

 * @property {string} [errorCode] — ex.: TIMEOUT (nunca confundir com status)

 * @property {Record<string, unknown>} [metadata]

 */



/**

 * @typedef {'received'|'processing'|'processed'|'failed'} WebhookStoreStatus

 */



/**

 * @typedef {'TIMEOUT'|'WEBHOOK_FAILED'|'INVALID_EVENT_ID'|'PERSISTENCE_ERROR'|string} WebhookStoreErrorCode

 */



/**

 * @typedef {Object} WebhookStoreRecord

 * @property {string} id

 * @property {string} provider

 * @property {string} eventId

 * @property {string | null} eventType

 * @property {string | null} resourceId

 * @property {string} correlationId

 * @property {WebhookStoreStatus} status

 * @property {number} retryCount

 * @property {string} receivedAt

 * @property {string | null} processedAt

 * @property {string | null} failedAt

 * @property {string | null} lastErrorCode

 * @property {boolean} [duplicate]

 * @property {Record<string, unknown>} [metadata]

 * @property {object} [error]

 */



/**

 * @typedef {Object} WebhookStorePort

 * @property {string} productId

 * @property {(input: WebhookStoreInput) => Promise<WebhookStoreRecord>} registerReceived

 * @property {(eventId: string) => Promise<WebhookStoreRecord | null>} findByEventId

 * @property {(provider: string, providerEventId: string) => Promise<WebhookStoreRecord | null>} findByProviderEvent

 * @property {(input: WebhookStoreInput) => Promise<{ exists: boolean, record: WebhookStoreRecord | null }>} exists

 * @property {(input: WebhookStoreInput) => Promise<WebhookStoreRecord>} markProcessing

 * @property {(input: WebhookStoreInput) => Promise<WebhookStoreRecord>} markProcessed

 * @property {(input: WebhookStoreInput & { errorCode?: string }) => Promise<WebhookStoreRecord>} markFailed

 * @property {(input: WebhookStoreInput) => Promise<WebhookStoreRecord>} recordRetry

 */



/** Constantes oficiais PE.2H.1 */

const WEBHOOK_STORE_STATUSES = Object.freeze(['received', 'processing', 'processed', 'failed']);

const WEBHOOK_STORE_ERROR_TIMEOUT = 'TIMEOUT';



module.exports = {

  WEBHOOK_STORE_STATUSES,

  WEBHOOK_STORE_ERROR_TIMEOUT

};

