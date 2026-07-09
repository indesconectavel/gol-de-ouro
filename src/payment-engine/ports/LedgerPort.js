'use strict';

/**
 * PE.2B — port de ledger desacoplado (sem Supabase na assinatura pública).
 *
 * @typedef {Object} LedgerEntry
 * @property {string} accountId
 * @property {string} type
 * @property {number} amount
 * @property {string} reference
 * @property {string} correlationId
 * @property {Record<string, unknown>} [metadata]
 */

/**
 * @typedef {Object} LedgerPort
 * @property {string} productId
 * @property {(entry: LedgerEntry) => Promise<{ success: boolean, id?: string, duplicate?: boolean, error?: object }>} append
 * @property {(correlationId: string) => Promise<LedgerEntry[]>} findByCorrelation
 */

module.exports = {};
