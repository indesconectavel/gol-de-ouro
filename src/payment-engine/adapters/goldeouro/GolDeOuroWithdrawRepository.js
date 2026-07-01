'use strict';

/** @implements {import('../../interfaces/WithdrawRepository').WithdrawRepository} */
const GolDeOuroWithdrawRepository = {
  productId: 'gol-de-ouro',
  tableName: 'saques',

  async findById(supabase, id) {
    if (!supabase || !id) {
      return { data: null, error: new Error('INVALID_INPUT') };
    }
    return supabase.from('saques').select('*').eq('id', id).maybeSingle();
  },

  async listByUser(supabase, userId, limit = 50) {
    if (!supabase || !userId) {
      return { data: null, error: new Error('INVALID_INPUT') };
    }
    return supabase
      .from('saques')
      .select('*')
      .eq('usuario_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
  }
};

module.exports = GolDeOuroWithdrawRepository;
