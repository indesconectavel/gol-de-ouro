const crypto = require('crypto');

const payoutCounters = { success: 0, fail: 0 };

/** Cache da coluna de usuário no ledger: 'user_id' | 'usuario_id' | null (ainda não descoberto). */
let ledgerUserIdColumn = null;

/**
 * Corte mínimo de `created_at` para saque automático (env obrigatória em produção).
 * @returns {{ valid: true, iso: string } | { valid: false, error: string }}
 */
function parsePayoutAutoFromAt() {
  const raw = process.env.PAYOUT_AUTO_FROM_AT;
  if (raw == null || String(raw).trim() === '') {
    return { valid: false, error: 'PAYOUT_AUTO_FROM_AT ausente ou vazia' };
  }
  const s = String(raw).trim();
  const t = Date.parse(s);
  if (Number.isNaN(t)) {
    return {
      valid: false,
      error: `PAYOUT_AUTO_FROM_AT inválida (esperada data/hora ISO-8601): ${s}`
    };
  }
  return { valid: true, iso: new Date(t).toISOString() };
}

/**
 * Insere uma linha no ledger usando a coluna de usuário existente no ambiente.
 * Tenta user_id primeiro (produção), depois usuario_id; grava em cache a que funcionar.
 * Nunca lança exceção; em falha retorna { success: false, error }.
 */
async function insertLedgerRow(supabase, payloadBase, usuarioId) {
  if (ledgerUserIdColumn) {
    const row = { ...payloadBase, [ledgerUserIdColumn]: usuarioId };
    const { data, error } = await supabase
      .from('ledger_financeiro')
      .insert(row)
      .select('id')
      .single();
    if (error) return { success: false, error };
    return { success: true, data };
  }

  const rowUser = { ...payloadBase, user_id: usuarioId };
  const res1 = await supabase.from('ledger_financeiro').insert(rowUser).select('id').single();
  if (!res1.error) {
    ledgerUserIdColumn = 'user_id';
    return { success: true, data: res1.data };
  }
  console.warn('[LEDGER] insert falhou (airbag)', { step: 'user_id', code: res1.error?.code, message: (res1.error?.message || '').slice(0, 80) });

  const rowUsuario = { ...payloadBase, usuario_id: usuarioId };
  const res2 = await supabase.from('ledger_financeiro').insert(rowUsuario).select('id').single();
  if (!res2.error) {
    ledgerUserIdColumn = 'usuario_id';
    return { success: true, data: res2.data };
  }
  console.warn('[LEDGER] insert falhou (airbag)', { step: 'usuario_id', code: res2.error?.code, message: (res2.error?.message || '').slice(0, 80) });
  return { success: false, error: res2.error };
}

const createLedgerEntry = async ({ supabase, tipo, usuarioId, valor, referencia, correlationId }) => {
  try {
    const { data: existing, error: existingError } = await supabase
      .from('ledger_financeiro')
      .select('id')
      .eq('correlation_id', correlationId)
      .eq('tipo', tipo)
      .eq('referencia', referencia)
      .maybeSingle();

    if (existingError) {
      return { success: false, error: existingError };
    }

    if (existing?.id) {
      return { success: true, id: existing.id, deduped: true };
    }

    const payloadBase = {
      tipo,
      valor: parseFloat(valor),
      referencia,
      correlation_id: correlationId,
      created_at: new Date().toISOString()
    };
    const insertResult = await insertLedgerRow(supabase, payloadBase, usuarioId);

    if (!insertResult.success) {
      return { success: false, error: insertResult.error };
    }

    return { success: true, id: insertResult.data?.id };
  } catch (error) {
    return { success: false, error };
  }
};

/**
 * Garante `payout_external_reference` curto e único (<= 64 chars) antes do POST ao MP.
 */
const ensurePayoutExternalReference = async (supabase, saqueId) => {
  const { data: row, error: selErr } = await supabase
    .from('saques')
    .select('payout_external_reference')
    .eq('id', saqueId)
    .maybeSingle();

  if (selErr) {
    return { success: false, error: selErr };
  }
  if (row?.payout_external_reference) {
    return { success: true, ref: row.payout_external_reference };
  }

  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = `wd_${crypto.randomBytes(12).toString('hex')}`;
    const { data: clash } = await supabase
      .from('saques')
      .select('id')
      .eq('payout_external_reference', candidate)
      .maybeSingle();
    if (clash?.id) continue;

    const { data: updated, error: upErr } = await supabase
      .from('saques')
      .update({ payout_external_reference: candidate, updated_at: new Date().toISOString() })
      .eq('id', saqueId)
      .is('payout_external_reference', null)
      .select('payout_external_reference')
      .maybeSingle();

    if (!upErr && updated?.payout_external_reference) {
      return { success: true, ref: updated.payout_external_reference };
    }

    const { data: again } = await supabase
      .from('saques')
      .select('payout_external_reference')
      .eq('id', saqueId)
      .maybeSingle();
    if (again?.payout_external_reference) {
      return { success: true, ref: again.payout_external_reference };
    }
  }

  return { success: false, error: new Error('Não foi possível gerar payout_external_reference único') };
};

const buildOwnerIdentification = async ({ supabase, userId, pixKey, pixType }) => {
  const tipo = String(pixType || '').toLowerCase();
  const normalizedTipo = tipo === 'telefone' ? 'phone' : tipo === 'aleatoria' ? 'random' : tipo;

  if (normalizedTipo === 'cpf') {
    const n = String(pixKey).replace(/\D/g, '');
    return { success: true, owner: { type: 'CPF', number: n } };
  }
  if (normalizedTipo === 'cnpj') {
    const n = String(pixKey).replace(/\D/g, '');
    return { success: true, owner: { type: 'CNPJ', number: n } };
  }

  const { data: prof, error } = await supabase.from('usuarios').select('cpf').eq('id', userId).maybeSingle();
  if (error) {
    return { success: false, error: error.message || 'Erro ao buscar CPF do usuário' };
  }
  const cpf = prof?.cpf ? String(prof.cpf).replace(/\D/g, '') : '';
  if (cpf.length === 11) {
    return { success: true, owner: { type: 'CPF', number: cpf } };
  }
  return {
    success: false,
    error: 'CPF do titular ausente no perfil — obrigatório para Pix Out com chave email/telefone/aleatória'
  };
};

const rollbackWithdraw = async ({ supabase, saqueId, userId, correlationId, amount, fee, motivo }) => {
  try {
    console.log(`↩️ [SAQUE][ROLLBACK] Início`, { saqueId, userId, correlationId, motivo });

    const { data: userRow, error: userError } = await supabase
      .from('usuarios')
      .select('saldo')
      .eq('id', userId)
      .single();

    if (userError || !userRow) {
      console.error('❌ [SAQUE][ROLLBACK] Erro ao buscar usuário:', userError);
      return { success: false, error: userError };
    }

    const saldoReconstituido = parseFloat(userRow.saldo) + parseFloat(amount);
    const { error: saldoError } = await supabase
      .from('usuarios')
      .update({ saldo: saldoReconstituido, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (saldoError) {
      console.error('❌ [SAQUE][ROLLBACK] Erro ao reconstituir saldo:', saldoError);
      return { success: false, error: saldoError };
    }

    await createLedgerEntry({
      supabase,
      tipo: 'rollback',
      usuarioId: userId,
      valor: parseFloat(amount),
      referencia: saqueId,
      correlationId
    });

    if (parseFloat(fee) > 0) {
      await createLedgerEntry({
        supabase,
        tipo: 'rollback',
        usuarioId: userId,
        valor: parseFloat(fee),
        referencia: `${saqueId}:fee`,
        correlationId
      });
    }

    await supabase
      .from('saques')
      .update({ status: 'falhou' })
      .eq('id', saqueId);

    console.log(`✅ [SAQUE][ROLLBACK] Concluído`, { saqueId, userId, correlationId });
    return { success: true };
  } catch (error) {
    console.error('❌ [SAQUE][ROLLBACK] Erro inesperado:', error);
    return { success: false, error };
  }
};

const processPendingWithdrawals = async ({
  supabase,
  isDbConnected,
  payoutEnabled,
  createPixWithdraw
} = {}) => {
  try {
    console.log('🟦 [PAYOUT][WORKER] Início do ciclo');
    if (!payoutEnabled) {
      console.log('[PAYOUT] Payout PIX desativado por configuração');
      console.log('🟦 [PAYOUT][WORKER] Resumo', {
        payouts_sucesso: payoutCounters.success,
        payouts_falha: payoutCounters.fail
      });
      return { success: false, disabled: true };
    }

    if (!isDbConnected || !supabase) {
      console.warn('⚠️ [SAQUE][WORKER] Supabase indisponível');
      console.log('🟦 [PAYOUT][WORKER] Resumo', {
        payouts_sucesso: payoutCounters.success,
        payouts_falha: payoutCounters.fail
      });
      return { success: false, message: 'Supabase indisponível' };
    }

    if (typeof createPixWithdraw !== 'function') {
      throw new Error('createPixWithdraw não fornecido');
    }

    const cut = parsePayoutAutoFromAt();
    if (!cut.valid) {
      console.error('❌ [PAYOUT] Corte PAYOUT_AUTO_FROM_AT inválido — nenhum saque será processado, Mercado Pago não será chamado:', cut.error);
      console.log('🟦 [PAYOUT][WORKER] Resumo', {
        payouts_sucesso: payoutCounters.success,
        payouts_falha: payoutCounters.fail
      });
      return { success: false, error: cut.error, payoutAutoFromAtInvalid: true };
    }
    console.log('✅ [PAYOUT] Corte mínimo created_at (PAYOUT_AUTO_FROM_AT) aplicado:', { payoutAutoFromAt: cut.iso });

    const { data: pendentes, error: listError } = await supabase
      .from('saques')
      .select(
        'id, usuario_id, amount, valor, fee, net_amount, pix_key, pix_type, chave_pix, tipo_chave, status, correlation_id, created_at, payout_external_reference, mp_transaction_intent_id, mp_payout_status'
      )
      .in('status', ['pendente', 'pending'])
      .gte('created_at', cut.iso)
      .order('created_at', { ascending: true })
      .limit(1);

    if (listError) {
      console.error('❌ [SAQUE][WORKER] Erro ao listar saques pendentes:', listError);
      console.log('🟦 [PAYOUT][WORKER] Resumo', {
        payouts_sucesso: payoutCounters.success,
        payouts_falha: payoutCounters.fail
      });
      return { success: false, error: listError };
    }

    if (!pendentes || pendentes.length === 0) {
      console.log('🟦 [PAYOUT][WORKER] Nenhum saque pendente');
      console.log('🟦 [PAYOUT][WORKER] Resumo', {
        payouts_sucesso: payoutCounters.success,
        payouts_falha: payoutCounters.fail
      });
      return { success: true, processed: false };
    }

    const saque = pendentes[0];
    const saqueId = saque.id;
    const userId = saque.usuario_id;
    const correlationId = saque.correlation_id;
    const amount = parseFloat(saque.amount ?? saque.valor ?? 0);
    const fee = parseFloat(saque.fee ?? 0);
    const netAmount = parseFloat(saque.net_amount ?? (amount - fee));
    const pixKey = saque.pix_key ?? saque.chave_pix;
    const pixType = saque.pix_type ?? saque.tipo_chave;
    const maskedPixKey = pixKey ? `${String(pixKey).slice(0, 4)}***${String(pixKey).slice(-4)}` : '***';

    console.log('🟦 [PAYOUT][WORKER] Saque selecionado', {
      saqueId,
      userId,
      correlationId,
      amount,
      netAmount,
      pixType,
      pixKey: maskedPixKey
    });

    if (!correlationId) {
      console.error('❌ [SAQUE][WORKER] correlation_id ausente', { saqueId, userId });
      await rollbackWithdraw({ supabase, saqueId, userId, correlationId: 'missing', amount, fee, motivo: 'correlation_id ausente' });
      console.log('🟦 [PAYOUT][WORKER] Resumo', {
        payouts_sucesso: payoutCounters.success,
        payouts_falha: payoutCounters.fail
      });
      return { success: false, error: 'correlation_id ausente' };
    }

    const { data: locked, error: lockError } = await supabase
      .from('saques')
      .update({ status: 'processando' })
      .eq('id', saqueId)
      .in('status', ['pendente', 'pending'])
      .select('id')
      .single();

    if (lockError || !locked) {
      console.log('ℹ️ [SAQUE][WORKER] Tentativa duplicada ignorada', { saqueId, userId, correlationId });
      console.log('🟦 [PAYOUT][WORKER] Resumo', {
        payouts_sucesso: payoutCounters.success,
        payouts_falha: payoutCounters.fail
      });
      return { success: true, processed: false, duplicate: true };
    }

    const refRes = await ensurePayoutExternalReference(supabase, saqueId);
    if (!refRes.success) {
      console.error('❌ [PAYOUT] Falha ao garantir payout_external_reference:', refRes.error);
      await createLedgerEntry({
        supabase,
        tipo: 'falha_payout',
        usuarioId: userId,
        valor: netAmount,
        referencia: saqueId,
        correlationId
      });
      await rollbackWithdraw({ supabase, saqueId, userId, correlationId, amount, fee, motivo: 'payout_external_reference' });
      payoutCounters.fail++;
      return { success: false, error: refRes.error };
    }

    const ownerRes = await buildOwnerIdentification({ supabase, userId, pixKey, pixType });
    if (!ownerRes.success) {
      console.error('❌ [PAYOUT] Titular Pix:', ownerRes.error);
      await createLedgerEntry({
        supabase,
        tipo: 'falha_payout',
        usuarioId: userId,
        valor: netAmount,
        referencia: saqueId,
        correlationId
      });
      await rollbackWithdraw({ supabase, saqueId, userId, correlationId, amount, fee, motivo: 'titular_pix' });
      payoutCounters.fail++;
      return { success: false, error: ownerRes.error };
    }

    const payoutExternalReference = refRes.ref;
    const idempotencyKey = `idem-saque-${saqueId}`;
    const notificationUrl = process.env.MP_PAYOUT_WEBHOOK_URL || null;

    console.log('🟦 [PAYOUT][WORKER] Payout iniciado', {
      saqueId,
      userId,
      correlationId,
      amount,
      netAmount,
      payoutExternalReference
    });

    const payoutResult = await createPixWithdraw(netAmount, pixKey, pixType, userId, saqueId, correlationId, {
      payoutExternalReference,
      idempotencyKey,
      notificationUrl: notificationUrl || undefined,
      ownerIdentification: ownerRes.owner
    });

    const mpSan = payoutResult?.data?.sanitized ?? null;
    const mpId = payoutResult?.data?.id ?? null;
    const mpSt = payoutResult?.data?.status ?? null;

    const mpPatch = {
      mp_payout_raw: mpSan,
      last_mp_sync_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    if (mpId) mpPatch.mp_transaction_intent_id = mpId;
    if (mpSt) mpPatch.mp_payout_status = mpSt;
    await supabase.from('saques').update(mpPatch).eq('id', saqueId);

    const terminalFail =
      payoutResult?.success === false ||
      ['rejected', 'cancelled', 'failed', 'error'].includes(String(mpSt || '').toLowerCase());

    if (terminalFail) {
      await createLedgerEntry({
        supabase,
        tipo: 'falha_payout',
        usuarioId: userId,
        valor: netAmount,
        referencia: saqueId,
        correlationId
      });
      await rollbackWithdraw({
        supabase,
        saqueId,
        userId,
        correlationId,
        amount,
        fee,
        motivo: payoutResult?.success === false ? 'payout_mp_erro' : `payout_mp_${mpSt}`
      });
      payoutCounters.fail++;
      console.error('❌ [PAYOUT][FALHOU] rollback acionado', {
        saqueId,
        userId,
        correlationId,
        amount,
        netAmount,
        mp_status: mpSt,
        erro: payoutResult?.error
      });
      console.log('🟦 [PAYOUT][WORKER] Resumo', {
        payouts_sucesso: payoutCounters.success,
        payouts_falha: payoutCounters.fail
      });
      return { success: false, error: payoutResult?.error || mpSt || 'payout falhou' };
    }

    if (payoutResult?.success === true) {
      const { error: awaitingError } = await supabase
        .from('saques')
        .update({ status: 'aguardando_confirmacao' })
        .eq('id', saqueId);

      if (awaitingError) {
        console.error('❌ [SAQUE][WORKER] Falha ao mover para aguardando_confirmacao:', awaitingError);
        console.log('🟦 [PAYOUT][WORKER] Resumo', {
          payouts_sucesso: payoutCounters.success,
          payouts_falha: payoutCounters.fail
        });
        return { success: false, error: awaitingError };
      }

      console.warn('⚠️ [PAYOUT][EM_PROCESSAMENTO] aguardando confirmação', {
        saqueId,
        userId,
        correlationId,
        amount,
        netAmount,
        status_original_do_provedor: payoutResult?.data?.status || 'unknown'
      });
      console.log('🟦 [PAYOUT][WORKER] Resumo', {
        payouts_sucesso: payoutCounters.success,
        payouts_falha: payoutCounters.fail
      });
      return { success: true, processed: false, awaiting_confirmation: true };
    }

    payoutCounters.fail++;
    console.error('❌ [PAYOUT][FALHOU] resposta inesperada do provedor', {
      saqueId,
      payoutResult
    });
    console.log('🟦 [PAYOUT][WORKER] Resumo', {
      payouts_sucesso: payoutCounters.success,
      payouts_falha: payoutCounters.fail
    });
    return { success: false, error: 'Resposta inesperada do provedor de payout' };
  } catch (error) {
    console.error('❌ [SAQUE][WORKER] Erro inesperado:', error);
    console.log('🟦 [PAYOUT][WORKER] Resumo', {
      payouts_sucesso: payoutCounters.success,
      payouts_falha: payoutCounters.fail
    });
    return { success: false, error };
  }
};

module.exports = {
  payoutCounters,
  createLedgerEntry,
  rollbackWithdraw,
  processPendingWithdrawals
};
