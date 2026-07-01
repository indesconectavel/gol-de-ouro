/**
 * Contrato de adapter de wallet — P2.2.
 * Implementações por produto (ex.: GolDeOuroWalletAdapter).
 *
 * @typedef {Object} WalletAdapter
 * @property {string} productId
 * @property {(supabase: object, userId: string) => Promise<{ success: boolean, balance?: number, error?: object }>} getBalance
 * @property {(supabase: object, userId: string, amount: number) => Promise<{ success: boolean, balance?: number, error?: object }>} debitBalance
 */

module.exports = {};
