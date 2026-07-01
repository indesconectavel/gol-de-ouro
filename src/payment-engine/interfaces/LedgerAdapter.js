/**
 * Contrato de adapter de ledger — P2.2.
 *
 * @typedef {Object} LedgerAdapter
 * @property {string} productId
 * @property {(input: { supabase: object, tipo: string, usuarioId: string, valor: number, referencia: string, correlationId: string }) => Promise<{ success: boolean, id?: string, deduped?: boolean, error?: object }>} createEntry
 */

module.exports = {};
