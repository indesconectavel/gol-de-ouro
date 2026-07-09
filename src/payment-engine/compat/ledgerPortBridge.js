'use strict';

/**
 * PE.2B — bridge LedgerPort ↔ LedgerAdapter P2.2 (shadow; supabase injetado no closure).
 *
 * @param {import('../interfaces/LedgerAdapter').LedgerAdapter} legacyAdapter
 * @param {object} deps
 * @param {object} deps.supabase
 * @returns {import('../ports/LedgerPort').LedgerPort}
 */
function createLedgerPortFromAdapter(legacyAdapter, deps = {}) {
  const { supabase } = deps;
  const productId = legacyAdapter?.productId || 'unknown';

  return {
    productId,

    async append(entry) {
      if (!legacyAdapter?.createEntry) {
        return { success: false, error: new Error('LEDGER_ADAPTER_UNAVAILABLE') };
      }
      const result = await legacyAdapter.createEntry({
        supabase,
        tipo: entry.type,
        usuarioId: entry.accountId,
        valor: entry.amount,
        referencia: entry.reference,
        correlationId: entry.correlationId,
        metadata: entry.metadata
      });
      return {
        success: !!result?.success,
        id: result?.id,
        duplicate: result?.deduped === true,
        error: result?.error
      };
    },

    async findByCorrelation(correlationId) {
      if (!supabase || !correlationId || !legacyAdapter?.tableName) {
        return [];
      }
      const { data, error } = await supabase
        .from(legacyAdapter.tableName)
        .select('*')
        .eq('correlation_id', String(correlationId));
      if (error || !Array.isArray(data)) {
        return [];
      }
      return data.map((row) => ({
        accountId: String(row.usuario_id || ''),
        type: String(row.tipo || ''),
        amount: parseFloat(row.valor ?? 0),
        reference: String(row.referencia || ''),
        correlationId: String(row.correlation_id || correlationId),
        metadata: row
      }));
    }
  };
}

module.exports = {
  createLedgerPortFromAdapter
};
