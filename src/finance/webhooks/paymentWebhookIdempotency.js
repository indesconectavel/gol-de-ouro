'use strict';

/**
 * Idempotência de webhook depósito — Supabase (MP legado) + store sandbox (F4.5).
 */

async function checkSupabaseDepositIdempotency(supabase, paymentId) {
  if (!supabase || !paymentId) {
    return { alreadyProcessed: false, existingStatus: null };
  }

  let existingPayment = null;

  const byExternal = await supabase
    .from('pagamentos_pix')
    .select('id, status')
    .eq('external_id', String(paymentId))
    .maybeSingle();

  if (!byExternal.error && byExternal.data) {
    existingPayment = byExternal.data;
  }

  if (!existingPayment) {
    const byPayment = await supabase
      .from('pagamentos_pix')
      .select('id, status')
      .eq('payment_id', String(paymentId))
      .maybeSingle();
    if (!byPayment.error && byPayment.data) {
      existingPayment = byPayment.data;
    }
  }

  if (existingPayment && String(existingPayment.status).toLowerCase() === 'approved') {
    return { alreadyProcessed: true, existingStatus: existingPayment.status };
  }

  return { alreadyProcessed: false, existingStatus: existingPayment?.status ?? null };
}

module.exports = {
  checkSupabaseDepositIdempotency
};
