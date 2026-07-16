'use strict';



/**

 * PE.2J — PayoutStorePort™ (neutro; sem Supabase / schema GDO / domain/payout).

 *

 * Orquestra fila/lote de saque, ledger de withdraw e rollback via adapter de produto.

 * WithdrawalPort permanece o port de leitura (find/list). Este port cobre efeitos de payout.

 *

 * @typedef {Object} PayoutProcessInput

 * @property {object} [runtime] — deps opacas (supabase injetado só no adapter; core não lê schema)

 * @property {boolean} [payoutEnabled]

 * @property {boolean} [isDbConnected]

 * @property {Record<string, unknown>} [metadata]

 *

 * @typedef {Object} PayoutProcessResult

 * @property {boolean} [success]

 * @property {boolean} [processed]

 * @property {number} [processedCount]

 * @property {object} [error]

 * @property {Record<string, unknown>} [raw]

 *

 * @typedef {Object} LedgerEntryInput

 * @property {string} correlationId

 * @property {string} tipo

 * @property {string|number} usuarioId

 * @property {number|string} valor

 * @property {string} referencia

 * @property {object} [supabase] — presente só no path legado/adapter; core não monta queries

 *

 * @typedef {Object} PayoutStorePort

 * @property {string} productId

 * @property {(input: PayoutProcessInput) => Promise<PayoutProcessResult>} processPending

 * @property {(input: object) => Promise<object>} [processSingle]

 * @property {(input: LedgerEntryInput) => Promise<{ success: boolean, id?: *, deduped?: boolean, error?: object }>} createLedgerEntry

 * @property {(input: object) => Promise<object>} rollback

 * @property {(input: object) => Promise<object>} [approveManualAdmin]

 * @property {(input: object) => Promise<object>} [approveAndSendAdmin]

 * @property {(input: object) => Promise<object>} [cancelManualAdmin]

 * @property {(input: object) => Promise<object>} [rollbackManualAdmin]

 * @property {{ success: number, fail: number }} [counters]

 */



module.exports = {};

