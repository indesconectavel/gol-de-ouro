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

const ONLY_DIGITS = (v) => String(v == null ? '' : v).replace(/\D/g, '');

const USUARIO_DOC_CANDIDATE_COLS = String(
  process.env.PAYOUT_USUARIOS_CPF_CANDIDATES || 'cpf_cnpj,cpf,documento,docuimento_fiscal,nu_cpf,cnpj'
)
  .split(/[\s,]+/)
  .map((s) => s.trim())
  .filter(Boolean);

/**
 * true quando o PostgREST indica coluna inexistente / não exposta.
 */
const isUsuariosColumnMissingError = (err) => {
  if (!err) return false;
  const m = String(err.message || err.details || err.hint || '');
  const c = String(err.code || '');
  if (/PGRST204|42703|column .* does not exist|Could not find the .* column/i.test(m + c)) return true;
  if (/schema cache/i.test(m) && /column/i.test(m)) return true;
  return false;
};

/**
 * Tenta a primeira coluna de documento existente em `public.usuarios` (não supõe `cpf`).
 */
const fetchUsuarioFiscalDocument = async (supabase, userId) => {
  const extra = (process.env.PAYOUT_USUARIOS_CPF_COLUMN || '').trim();
  const ordered = extra ? [extra, ...USUARIO_DOC_CANDIDATE_COLS] : USUARIO_DOC_CANDIDATE_COLS;
  const seen = new Set();
  for (const col of ordered) {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(col)) continue;
    if (seen.has(col)) continue;
    seen.add(col);
    const { data, error } = await supabase.from('usuarios').select(col).eq('id', userId).maybeSingle();
    if (error) {
      if (isUsuariosColumnMissingError(error)) continue;
      return { success: false, error: error.message || 'Erro ao buscar documento do titular' };
    }
    const raw = data?.[col];
    if (raw == null || String(raw).trim() === '') continue;
    return { success: true, value: String(raw) };
  }
  return { success: true, value: null };
};

const buildOwnerFromDigits = (digits) => {
  if (digits.length === 11) return { success: true, owner: { type: 'CPF', number: digits } };
  if (digits.length === 14) return { success: true, owner: { type: 'CNPJ', number: digits } };
  return {
    success: false,
    error: 'Documento do titular inválido (esperado CPF com 11 ou CNPJ com 14 dígitos numéricos)'
  };
};

const buildOwnerIdentification = async ({ supabase, userId, pixKey, pixType }) => {
  const tipo = String(pixType || '').toLowerCase();
  const normalizedTipo = tipo === 'telefone' ? 'phone' : tipo === 'aleatoria' ? 'random' : tipo;

  if (normalizedTipo === 'cpf') {
    const n = ONLY_DIGITS(pixKey);
    if (n.length !== 11) {
      return { success: false, error: 'Chave Pix CPF inválida (esperado 11 dígitos)' };
    }
    return { success: true, owner: { type: 'CPF', number: n } };
  }
  if (normalizedTipo === 'cnpj') {
    const n = ONLY_DIGITS(pixKey);
    if (n.length !== 14) {
      return { success: false, error: 'Chave Pix CNPJ inválida (esperado 14 dígitos)' };
    }
    return { success: true, owner: { type: 'CNPJ', number: n } };
  }

  const doc = await fetchUsuarioFiscalDocument(supabase, userId);
  if (!doc.success) {
    return { success: false, error: doc.error || 'Documento do titular ausente' };
  }
  if (doc.value == null) {
    return {
      success: false,
      error:
        'Documento do titular ausente — obrigatório para Pix com chave email, telefone ou chave aleatória'
    };
  }
  const digits = ONLY_DIGITS(doc.value);
  return buildOwnerFromDigits(digits);
};

const ROLLBACK_STATUS_TRIES = String(process.env.SAQUE_ROLLBACK_STATUS_LIST || 'cancelado,falhou')
  .split(/[\s,]+/)
  .map((s) => s.trim())
  .filter(Boolean);

const TERMINAL_FALLBACK_STATUSES = ['falhou', 'cancelado', 'rejeitado'];

async function setSaqueTerminalStatus(supabase, saqueId, motivo) {
  const tryStatuses = Array.from(new Set([...ROLLBACK_STATUS_TRIES, ...TERMINAL_FALLBACK_STATUSES]));
  let lastStatusError = null;
  let finalStatus = null;
  for (const st of tryStatuses) {
    const patch = {
      status: st,
      motivo_rejeicao: String(motivo || 'payout_rollback'),
      processed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      mp_payout_status: 'failed'
    };
    const { data: upd, error: stErr } = await supabase
      .from('saques')
      .update(patch)
      .eq('id', saqueId)
      .select('id, status')
      .single();

    if (stErr) {
      lastStatusError = stErr;
      continue;
    }
    if (upd?.id) {
      finalStatus = upd.status || st;
      break;
    }
  }
  return { success: !!finalStatus, finalStatus, error: lastStatusError };
}

const rollbackWithdraw = async ({ supabase, saqueId, userId, correlationId, amount, fee, motivo }) => {
  try {
    console.log(`↩️ [SAQUE][ROLLBACK] Início`, { saqueId, userId, correlationId, motivo });

    const rollbackRefMain = saqueId;
    const rollbackRefFee = `${saqueId}:fee`;
    const { data: existingRollbacks, error: existingRbErr } = await supabase
      .from('ledger_financeiro')
      .select('id, referencia')
      .eq('correlation_id', correlationId)
      .eq('tipo', 'rollback')
      .in('referencia', [rollbackRefMain, rollbackRefFee]);

    if (existingRbErr) {
      console.error('❌ [SAQUE][ROLLBACK] Erro ao verificar rollback existente:', existingRbErr);
      return { success: false, error: existingRbErr, phase: 'rollback_existing_check' };
    }

    const hasMainRollback = Array.isArray(existingRollbacks) && existingRollbacks.some((r) => r.referencia === rollbackRefMain);
    const hasFeeRollback = Array.isArray(existingRollbacks) && existingRollbacks.some((r) => r.referencia === rollbackRefFee);
    const rollbackAlreadyDone = hasMainRollback;

    if (rollbackAlreadyDone) {
      console.log('ℹ️ [SAQUE][ROLLBACK] rollback já existente para correlation_id — pulando reestorno de saldo', {
        saqueId,
        correlationId
      });
    }

    if (!rollbackAlreadyDone) {
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
    }

    if (!hasMainRollback) {
      const { success: r1, error: e1 } = await createLedgerEntry({
        supabase,
        tipo: 'rollback',
        usuarioId: userId,
        valor: parseFloat(amount),
        referencia: saqueId,
        correlationId
      });
      if (!r1) {
        console.error('❌ [SAQUE][ROLLBACK] Erro ao registrar ledger (valor bruto):', e1);
        return { success: false, error: e1, phase: 'ledger_valor' };
      }
    }

    if (parseFloat(fee) > 0 && !hasFeeRollback) {
      const { success: r2, error: e2 } = await createLedgerEntry({
        supabase,
        tipo: 'rollback',
        usuarioId: userId,
        valor: parseFloat(fee),
        referencia: `${saqueId}:fee`,
        correlationId
      });
      if (!r2) {
        console.error('❌ [SAQUE][ROLLBACK] Erro ao registrar ledger (taxa):', e2);
        return { success: false, error: e2, phase: 'ledger_taxa' };
      }
    }

    const statusUpdate = await setSaqueTerminalStatus(supabase, saqueId, motivo);
    const finalStatus = statusUpdate.finalStatus;

    if (!finalStatus) {
      console.error('❌ [SAQUE][ROLLBACK] CRÍTICO: nenhum status de rollback foi aceito pelo banco', {
        saqueId,
        lastStatusError: statusUpdate.error
      });
      return {
        success: false,
        error: statusUpdate.error || new Error('status_rollback_falhou'),
        statusUpdateFailed: true,
        phase: 'status_unresolved'
      };
    }

    const { data: checkRow, error: checkErr } = await supabase
      .from('saques')
      .select('status')
      .eq('id', saqueId)
      .single();

    if (checkErr) {
      console.error('❌ [SAQUE][ROLLBACK] CRÍTICO: não foi possível validar status pós-rollback', checkErr);
      return { success: false, error: checkErr, statusUpdateFailed: true, phase: 'status_verify' };
    }

    if (String(checkRow?.status).toLowerCase() === 'processando') {
      console.error('❌ [SAQUE][ROLLBACK] CRÍTICO: saque segue em processando após rollback', { saqueId, userId });
      return { success: false, statusUpdateFailed: true, phase: 'stuck_processando' };
    }

    console.log(`✅ [SAQUE][ROLLBACK] Concluído`, { saqueId, userId, correlationId, statusFinal: checkRow?.status });
    return { success: true, statusFinal: checkRow?.status };
  } catch (error) {
    console.error('❌ [SAQUE][ROLLBACK] Erro inesperado:', error);
    return { success: false, error };
  }
};

async function healStuckProcessingWithRollback(supabase) {
  const { data: stuck, error: listErr } = await supabase
    .from('saques')
    .select('id, usuario_id, correlation_id, amount, valor, fee, status')
    .eq('status', 'processando')
    .order('updated_at', { ascending: true })
    .limit(10);

  if (listErr || !Array.isArray(stuck) || stuck.length === 0) {
    return { checked: 0, fixed: 0, error: listErr || null };
  }

  let fixed = 0;
  for (const row of stuck) {
    const saqueId = row.id;
    const correlationId = row.correlation_id;
    if (!saqueId || !correlationId) continue;

    const { data: ledgerRows, error: ledErr } = await supabase
      .from('ledger_financeiro')
      .select('tipo, referencia')
      .eq('correlation_id', correlationId)
      .in('tipo', ['rollback', 'payout_confirmado']);
    if (ledErr || !Array.isArray(ledgerRows)) continue;

    const hasPayoutConfirmed = ledgerRows.some((l) => l.tipo === 'payout_confirmado' && l.referencia === saqueId);
    if (hasPayoutConfirmed) continue;
    const hasRollback = ledgerRows.some((l) => l.tipo === 'rollback' && l.referencia === saqueId);
    if (!hasRollback) continue;

    const amount = parseFloat(row.amount ?? row.valor ?? 0);
    const fee = parseFloat(row.fee ?? 0);
    const rb = await rollbackWithdraw({
      supabase,
      saqueId,
      userId: row.usuario_id,
      correlationId,
      amount: Number.isFinite(amount) ? amount : 0,
      fee: Number.isFinite(fee) ? fee : 0,
      motivo: 'auto_heal_stuck_processando_pos_rollback'
    });
    if (rb.success) fixed++;
  }

  return { checked: stuck.length, fixed };
}

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

    const heal = await healStuckProcessingWithRollback(supabase);
    if (heal?.fixed > 0) {
      console.warn('⚠️ [PAYOUT][WORKER] Auto-heal de saques presos em processando aplicado', heal);
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

    if (!Number.isFinite(amount) || !Number.isFinite(fee) || !Number.isFinite(netAmount) || amount <= 0 || netAmount <= 0) {
      console.error('❌ [PAYOUT][WORKER] Valores financeiros inválidos no saque', {
        saqueId,
        userId,
        correlationId,
        amount,
        fee,
        netAmount
      });
      await rollbackWithdraw({
        supabase,
        saqueId,
        userId,
        correlationId: correlationId || 'invalid_amount',
        amount: Number.isFinite(amount) ? amount : 0,
        fee: Number.isFinite(fee) ? fee : 0,
        motivo: 'valores_financeiros_invalidos'
      });
      payoutCounters.fail++;
      return { success: false, error: 'valores financeiros inválidos no saque' };
    }

    if (!correlationId) {
      console.error('❌ [SAQUE][WORKER] correlation_id ausente', { saqueId, userId });
      await rollbackWithdraw({ supabase, saqueId, userId, correlationId: 'missing', amount, fee, motivo: 'correlation_id ausente' });
      console.log('🟦 [PAYOUT][WORKER] Resumo', {
        payouts_sucesso: payoutCounters.success,
        payouts_falha: payoutCounters.fail
      });
      return { success: false, error: 'correlation_id ausente' };
    }

    const ownerRes = await buildOwnerIdentification({ supabase, userId, pixKey, pixType });
    if (!ownerRes.success) {
      console.error('❌ [PAYOUT] Titular Pix (pré-bloqueio):', ownerRes.error);
      payoutCounters.fail++;
      console.log('🟦 [PAYOUT][WORKER] Resumo', {
        payouts_sucesso: payoutCounters.success,
        payouts_falha: payoutCounters.fail
      });
      return { success: false, error: ownerRes.error, processed: false, titularBloqueado: true };
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
      const rb = await rollbackWithdraw({ supabase, saqueId, userId, correlationId, amount, fee, motivo: 'payout_external_reference' });
      payoutCounters.fail++;
      if (!rb.success) {
        console.error('❌ [PAYOUT] Rollback pós-falha de payout_external_reference não concluiu com sucesso', rb);
        return { success: false, error: refRes.error, rollbackResult: rb };
      }
      return { success: false, error: refRes.error };
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
      const rb = await rollbackWithdraw({
        supabase,
        saqueId,
        userId,
        correlationId,
        amount,
        fee,
        motivo: payoutResult?.success === false ? 'payout_mp_erro' : `payout_mp_${mpSt}`
      });
      payoutCounters.fail++;
      if (!rb.success) {
        console.error('❌ [PAYOUT][FALHOU] rollback financeiro/ledger executado, mas conclusão do rollback falhou', rb);
      }
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
