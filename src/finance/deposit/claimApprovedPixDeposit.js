'use strict';

/**
 * P1.4F — Claim idempotente de depósito PIX aprovado (MP numérico via RPC + fallback Asaas pay_*).
 */

function isAsaasProviderPaymentId(paymentId) {
  return /^pay_[a-z0-9]+$/i.test(String(paymentId || '').trim());
}

function shouldUseJsFallbackForRpcRejection(rpcResult, paymentId) {
  return (
    rpcResult &&
    rpcResult.ok === false &&
    rpcResult.error === 'invalid_mercadopago_id' &&
    isAsaasProviderPaymentId(paymentId)
  );
}

function isRpcMissingError(rpcError) {
  return /claim_and_credit_approved_pix_deposit|does not exist|PGRST202/i.test(
    String(rpcError?.message || '')
  );
}

/**
 * @param {{ supabase: object, createLedgerEntry: Function, log?: Function }} deps
 * @param {string} paymentId
 * @returns {Promise<{ ok: boolean, credited: boolean, idempotent: boolean }>}
 */
async function claimApprovedPixDepositJsFallback(deps, paymentId) {
  const { supabase, createLedgerEntry, log = () => {} } = deps;

  const { data: existingLedger, error: ledgerCheckErr } = await supabase
    .from('ledger_financeiro')
    .select('id')
    .eq('correlation_id', paymentId)
    .eq('tipo', 'deposito')
    .maybeSingle();

  if (ledgerCheckErr) {
    log('deposit_claim_ledger_check_error', {
      payment_id: paymentId,
      status: 'error',
      error: ledgerCheckErr.message
    });
    return { ok: false, credited: false, idempotent: false };
  }

  if (existingLedger?.id) {
    log('deposit_claim_idempotent_ledger', {
      payment_id: paymentId,
      status: 'idempotent',
      ledger_id: existingLedger.id
    });
    return { ok: true, credited: false, idempotent: true };
  }

  let claimed = null;
  const { data: claimByPaymentId, error: claimErr1 } = await supabase
    .from('pagamentos_pix')
    .update({
      status: 'approved',
      updated_at: new Date().toISOString(),
      approved_at: new Date().toISOString()
    })
    .eq('payment_id', paymentId)
    .neq('status', 'approved')
    .select('id, usuario_id, amount, valor, payment_id, external_id');

  if (!claimErr1 && claimByPaymentId && claimByPaymentId.length === 1) {
    claimed = claimByPaymentId[0];
  }

  if (!claimed) {
    const { data: claimByExternalId, error: claimErr2 } = await supabase
      .from('pagamentos_pix')
      .update({
        status: 'approved',
        updated_at: new Date().toISOString(),
        approved_at: new Date().toISOString()
      })
      .eq('external_id', paymentId)
      .neq('status', 'approved')
      .select('id, usuario_id, amount, valor, payment_id, external_id');
    if (!claimErr2 && claimByExternalId && claimByExternalId.length === 1) {
      claimed = claimByExternalId[0];
    }
  }

  if (!claimed) {
    log('deposit_claim_idempotent_or_missing', {
      payment_id: paymentId,
      status: 'idempotent_or_missing'
    });
    return { ok: false, credited: false, idempotent: false };
  }

  const pixRecord = claimed;
  const userId = pixRecord.usuario_id;
  const credit = Number(pixRecord.amount ?? pixRecord.valor ?? 0);

  if (!userId || !Number.isFinite(credit) || credit <= 0) {
    log('deposit_claim_invalid_pix_record', {
      payment_id: paymentId,
      status: 'error',
      user_id: userId,
      valor: credit
    });
    return { ok: false, credited: false, idempotent: false };
  }

  const ledgerRes = await createLedgerEntry({
    supabase,
    tipo: 'deposito',
    usuarioId: userId,
    valor: credit,
    referencia: String(pixRecord.id),
    correlationId: paymentId
  });

  if (!ledgerRes.success) {
    log('deposit_claim_ledger_error', {
      payment_id: paymentId,
      user_id: userId,
      status: 'error',
      error: ledgerRes.error?.message || String(ledgerRes.error)
    });
    return { ok: false, credited: false, idempotent: false };
  }

  if (ledgerRes.deduped) {
    log('deposit_claim_ledger_deduped', {
      payment_id: paymentId,
      status: 'idempotent'
    });
    return { ok: true, credited: false, idempotent: true };
  }

  const { data: user, error: userError } = await supabase
    .from('usuarios')
    .select('saldo')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    log('deposit_claim_user_error', {
      payment_id: paymentId,
      user_id: userId,
      status: 'error',
      error: userError?.message || 'user_not_found'
    });
    return { ok: false, credited: false, idempotent: false };
  }

  const saldoAnterior = Number(user.saldo || 0);
  const novoSaldo = saldoAnterior + credit;
  const { error: saldoError } = await supabase.from('usuarios').update({ saldo: novoSaldo }).eq('id', userId);

  if (saldoError) {
    log('deposit_claim_balance_error', {
      payment_id: paymentId,
      user_id: userId,
      status: 'error',
      valor: credit,
      error: saldoError.message
    });
    return { ok: false, credited: false, idempotent: false };
  }

  log('deposit_claim_credited_fallback', {
    payment_id: paymentId,
    user_id: userId,
    status: 'approved',
    valor: credit,
    ledger_id: ledgerRes.id || null
  });

  if (isAsaasProviderPaymentId(paymentId)) {
    console.log('[WALLET_CREDIT][ASAAS]', { payment_id: paymentId, user_id: userId, valor: credit });
    console.log('[LEDGER_WRITE][DEPOSITO][ASAAS]', {
      payment_id: paymentId,
      user_id: userId,
      ledger_id: ledgerRes.id || null
    });
  }

  return { ok: true, credited: true, idempotent: false };
}

/**
 * @param {{ supabase: object, createLedgerEntry: Function, log?: Function }} deps
 * @param {string} idStr
 * @returns {Promise<{ ok: boolean, credited: boolean, idempotent: boolean }>}
 */
async function claimApprovedPixDeposit(deps, idStr) {
  const { supabase, log = () => {} } = deps;
  const paymentId = String(idStr || '').trim();
  if (!supabase || !paymentId) {
    return { ok: false, credited: false, idempotent: false };
  }

  log('deposit_claim_start', { payment_id: paymentId, status: 'starting' });

  const isAsaasPayment = isAsaasProviderPaymentId(paymentId);

  const { data: rpcResult, error: rpcError } = await supabase.rpc(
    'claim_and_credit_approved_pix_deposit',
    { p_mercadopago_id: paymentId }
  );

  if (!rpcError && rpcResult && typeof rpcResult === 'object') {
    const ok = !!rpcResult.ok;
    const credited = !!rpcResult.credited;
    log('deposit_claim_sql', {
      payment_id: paymentId,
      status: ok ? (credited ? 'credited' : 'idempotent') : 'not_credited',
      payload: rpcResult
    });
    if (ok) {
      if (isAsaasPayment && credited) {
        console.log('[WALLET_CREDIT][ASAAS]', { payment_id: paymentId });
        console.log('[LEDGER_WRITE][DEPOSITO][ASAAS]', { payment_id: paymentId });
      }
      return { ok: true, credited, idempotent: !!rpcResult.idempotent };
    }
    if (!shouldUseJsFallbackForRpcRejection(rpcResult, paymentId)) {
      return { ok: false, credited: false, idempotent: !!rpcResult.idempotent };
    }
    log('deposit_claim_rpc_asaas_fallback', {
      payment_id: paymentId,
      status: 'fallback',
      rpc_error: rpcResult.error
    });
  } else if (
    rpcError &&
    !isRpcMissingError(rpcError)
  ) {
    log('deposit_claim_sql_error', {
      payment_id: paymentId,
      status: 'error',
      error: rpcError.message || String(rpcError)
    });
    return { ok: false, credited: false, idempotent: false };
  }

  return claimApprovedPixDepositJsFallback(deps, paymentId);
}

module.exports = {
  isAsaasProviderPaymentId,
  shouldUseJsFallbackForRpcRejection,
  claimApprovedPixDepositJsFallback,
  claimApprovedPixDeposit
};
