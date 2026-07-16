'use strict';



/**

 * PE.2G — IdempotencyStore™ (port neutro).

 *

 * Sem persistência concreta, sem nomes de tabela, sem cliente DB, sem Express.

 *

 * @typedef {Object} IdempotencyKey

 * @property {string} scope — ex.: 'deposit_pix' | 'webhook_event' | 'ledger' | 'payout'

 * @property {string} key — identificador único no escopo (paymentId, eventId, correlationId)

 * @property {string} [provider]

 * @property {string} [correlationId]

 * @property {Record<string, unknown>} [metadata]

 */



/**

 * @typedef {'none'|'reserved'|'processed'|'failed'} IdempotencyState

 */



/**

 * @typedef {Object} IdempotencyRecord

 * @property {string} scope

 * @property {string} key

 * @property {IdempotencyState} state

 * @property {boolean} exists

 * @property {boolean} reserved

 * @property {boolean} duplicate

 * @property {string | null} [status]

 * @property {Record<string, unknown>} [metadata]

 * @property {object} [error]

 */



/**

 * @typedef {Object} IdempotencyStore

 * @property {string} productId

 * @property {(input: IdempotencyKey) => Promise<IdempotencyRecord>} exists

 * @property {(input: IdempotencyKey) => Promise<IdempotencyRecord | null>} find

 * @property {(input: IdempotencyKey) => Promise<IdempotencyRecord>} reserve

 * @property {(input: IdempotencyKey) => Promise<IdempotencyRecord>} commit

 * @property {(input: IdempotencyKey) => Promise<IdempotencyRecord>} rollback

 * @property {(input: IdempotencyKey) => Promise<IdempotencyRecord>} release

 * @property {(input: IdempotencyKey) => Promise<IdempotencyRecord>} markProcessed

 * @property {(input: IdempotencyKey & { reason?: string }) => Promise<IdempotencyRecord>} markFailed

 */



module.exports = {};

