const payoutCounters = { success: 0, fail: 0 };

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

    const { data, error } = await supabase
      .from('ledger_financeiro')
      .insert({
        tipo,
        usuario_id: usuarioId,
        valor: parseFloat(valor),
        referencia,
        correlation_id: correlationId,
        created_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (error) {
      return { success: false, error };
    }

    return { success: true, id: data?.id };
  } catch (error) {
    return { success: false, error };
  }
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

    const { data: pendentes, error: listError } = await supabase
      .from('saques')
      .select('id, usuario_id, amount, valor, fee, net_amount, pix_key, pix_type, chave_pix, tipo_chave, status, correlation_id, created_at')
      .in('status', ['pendente', 'pending'])
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

    console.log('🟦 [PAYOUT][WORKER] Payout iniciado', { saqueId, userId, correlationId, amount, netAmount });
    const payoutResult = await createPixWithdraw(netAmount, pixKey, pixType, userId, saqueId, correlationId);
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

    await createLedgerEntry({
      supabase,
      tipo: 'falha_payout',
      usuarioId: userId,
      valor: netAmount,
      referencia: saqueId,
      correlationId
    });

    await rollbackWithdraw({ supabase, saqueId, userId, correlationId, amount, fee, motivo: 'payout falhou' });
    payoutCounters.fail++;
    console.error('❌ [PAYOUT][FALHOU] rollback acionado', {
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
    return { success: false, error: payoutResult?.error || 'payout falhou' };
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
