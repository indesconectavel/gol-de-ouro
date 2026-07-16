'use strict';



/**

 * PE.2B — port de wallet desacoplado (sem Supabase na assinatura pública).

 *

 * @typedef {Object} WalletMeta

 * @property {string} [correlationId]

 * @property {string} [reference]

 * @property {string} [reason]

 */



/**

 * @typedef {Object} WalletResult

 * @property {boolean} success

 * @property {number} [balance]

 * @property {object} [error]

 */



/**

 * @typedef {Object} WalletPort

 * @property {string} productId

 * @property {(accountId: string) => Promise<WalletResult>} getBalance

 * @property {(accountId: string, amount: number, meta?: WalletMeta) => Promise<WalletResult>} debit

 * @property {(accountId: string, amount: number, meta?: WalletMeta) => Promise<WalletResult>} credit

 *

 * PE.2F — credit neutro (conceitual): credit({ accountId, amount, correlationId, metadata }).

 * Assinatura PE.2B preservada: credit(accountId, amount, meta) onde meta.correlationId.

 */



module.exports = {};

