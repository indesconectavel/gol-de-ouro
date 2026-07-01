/**
 * Contrato de repositório de saques — P2.2.
 *
 * @typedef {Object} WithdrawRepository
 * @property {string} productId
 * @property {string} tableName
 * @property {(supabase: object, id: string) => Promise<{ data: object | null, error: object | null }>} findById
 */

module.exports = {};
