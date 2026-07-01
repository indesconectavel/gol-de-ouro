/**
 * Contrato de repositório de depósitos PIX — P2.2.
 *
 * @typedef {Object} DepositRepository
 * @property {string} productId
 * @property {string} tableName
 * @property {(supabase: object, filters: object) => Promise<{ data: object[] | null, error: object | null }>} listPending
 */

module.exports = {};
