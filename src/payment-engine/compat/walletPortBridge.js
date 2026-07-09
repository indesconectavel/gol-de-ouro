'use strict';

/**
 * PE.2B — bridge WalletPort ↔ WalletAdapter P2.2 (shadow; credit aditivo).
 *
 * @param {import('../interfaces/WalletAdapter').WalletAdapter} legacyAdapter
 * @param {object} deps
 * @param {object} deps.supabase
 * @returns {import('../ports/WalletPort').WalletPort}
 */
function createWalletPortFromAdapter(legacyAdapter, deps = {}) {
  const { supabase } = deps;
  const productId = legacyAdapter?.productId || 'unknown';
  const tableName = legacyAdapter?.tableName || 'usuarios';
  const balanceColumn = legacyAdapter?.balanceColumn || 'saldo';

  return {
    productId,

    async getBalance(accountId) {
      if (!legacyAdapter?.getBalance) {
        return { success: false, error: new Error('WALLET_ADAPTER_UNAVAILABLE') };
      }
      return legacyAdapter.getBalance(supabase, accountId);
    },

    async debit(accountId, amount, _meta) {
      if (!legacyAdapter?.debitBalance) {
        return { success: false, error: new Error('WALLET_ADAPTER_UNAVAILABLE') };
      }
      return legacyAdapter.debitBalance(supabase, accountId, amount);
    },

    async credit(accountId, amount, _meta) {
      if (!supabase || !accountId) {
        return { success: false, error: new Error('INVALID_INPUT') };
      }
      const { data: user, error: fetchErr } = await supabase
        .from(tableName)
        .select(balanceColumn)
        .eq('id', accountId)
        .maybeSingle();
      if (fetchErr) return { success: false, error: fetchErr };
      const current = parseFloat(user?.[balanceColumn] ?? 0);
      const next = current + parseFloat(amount);
      const { error: updateErr } = await supabase
        .from(tableName)
        .update({ [balanceColumn]: next, updated_at: new Date().toISOString() })
        .eq('id', accountId);
      if (updateErr) return { success: false, error: updateErr };
      return { success: true, balance: next };
    }
  };
}

module.exports = {
  createWalletPortFromAdapter
};
