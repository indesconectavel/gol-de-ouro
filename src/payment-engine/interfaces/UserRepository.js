/**
 * Contrato de repositório de usuário/conta — P2.2.
 *
 * @typedef {Object} UserRepository
 * @property {string} productId
 * @property {(supabase: object, userId: string) => Promise<{ data: object | null, error: object | null }>} findById
 * @property {(supabase: object, userId: string) => Promise<{ data: { saldo: number } | null, error: object | null }>} getBalanceRow
 */

module.exports = {};
