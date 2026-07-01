'use strict';

/** @implements {import('../../interfaces/WalletAdapter').WalletAdapter} */
const GolDeOuroWalletAdapter = {
  productId: 'gol-de-ouro',
  balanceColumn: 'saldo',
  tableName: 'usuarios',

  async getBalance(supabase, userId) {
    if (!supabase || !userId) {
      return { success: false, error: new Error('INVALID_INPUT') };
    }
    const { data, error } = await supabase
      .from('usuarios')
      .select('saldo')
      .eq('id', userId)
      .maybeSingle();
    if (error) return { success: false, error };
    return { success: true, balance: parseFloat(data?.saldo ?? 0) };
  },

  async debitBalance(supabase, userId, amount) {
    if (!supabase || !userId) {
      return { success: false, error: new Error('INVALID_INPUT') };
    }
    const { data: user, error: fetchErr } = await supabase
      .from('usuarios')
      .select('saldo')
      .eq('id', userId)
      .maybeSingle();
    if (fetchErr) return { success: false, error: fetchErr };
    const current = parseFloat(user?.saldo ?? 0);
    const next = current - parseFloat(amount);
    const { error: updateErr } = await supabase
      .from('usuarios')
      .update({ saldo: next, updated_at: new Date().toISOString() })
      .eq('id', userId);
    if (updateErr) return { success: false, error: updateErr };
    return { success: true, balance: next };
  }
};

module.exports = GolDeOuroWalletAdapter;
