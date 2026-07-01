'use strict';

const { pickMercadoPagoPaymentIdForReconcile } = require('../../shared/pickMercadoPagoPaymentIdForReconcile');

/** @implements {import('../../interfaces/DepositRepository').DepositRepository} */
const GolDeOuroDepositRepository = {
  productId: 'gol-de-ouro',
  tableName: 'pagamentos_pix',

  async listPending(supabase, { sinceIso, limit = 10 } = {}) {
    if (!supabase) {
      return { data: null, error: new Error('INVALID_INPUT') };
    }
    let query = supabase
      .from('pagamentos_pix')
      .select('id, usuario_id, external_id, payment_id, status, amount, valor, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(limit);
    if (sinceIso) {
      query = query.lt('created_at', sinceIso);
    }
    return query;
  },

  pickMercadoPagoPaymentIdForReconcile
};

module.exports = GolDeOuroDepositRepository;
