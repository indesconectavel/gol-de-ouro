'use strict';

/** @implements {import('../../interfaces/UserRepository').UserRepository} */
const GolDeOuroUserRepository = {
  productId: 'gol-de-ouro',
  tableName: 'usuarios',

  async findById(supabase, userId) {
    if (!supabase || !userId) {
      return { data: null, error: new Error('INVALID_INPUT') };
    }
    return supabase.from('usuarios').select('*').eq('id', userId).maybeSingle();
  },

  async getBalanceRow(supabase, userId) {
    if (!supabase || !userId) {
      return { data: null, error: new Error('INVALID_INPUT') };
    }
    return supabase.from('usuarios').select('id, saldo').eq('id', userId).maybeSingle();
  }
};

module.exports = GolDeOuroUserRepository;
