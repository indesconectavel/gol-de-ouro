/**
 * Reconciliação automática: detecta movimentos com saldo já atualizado mas sem
 * contrapartida em ledger_financeiro e executa retry idempotente via createLedgerEntry.
 * NÃO altera saldo; apenas recompõe ledger faltante quando a reconstrução é segura.
 *
 * Escopo do retry automático:
 * - Depósitos aprovados sem ledger deposito_aprovado
 * - Chutes miss sem ledger chute_miss
 * - Chutes goal sem ledger chute_aposta e/ou chute_premio
 *
 * Não corrige automaticamente: saldo divergente da soma do ledger, rollback inconsistente,
 * ou qualquer caso ambíguo.
 */

const { normalizePagamentoPixRead } = require('../../../utils/financialNormalization');

/**
 * Verifica se existe linha no ledger com (referencia, tipo).
 * @param {object} supabase
 * @param {string} referencia
 * @param {string} tipo
 * @returns {Promise<boolean>}
 */
async function ledgerExists(supabase, referencia, tipo) {
  const { data, error } = await supabase
    .from('ledger_financeiro')
    .select('id')
    .eq('referencia', String(referencia))
    .eq('tipo', tipo)
    .limit(1)
    .maybeSingle();
  if (error) return false;
  return !!data?.id;
}

/**
 * Executa detecção e retry de ledger faltante para depósitos aprovados e chutes.
 * @param {{ supabase: object, createLedgerEntry: function }} deps - supabase client e createLedgerEntry (processPendingWithdrawals)
 * @returns {Promise<object>} Relatório com contagens (deposits*, miss*, goal*)
 */
async function runReconcileMissingLedger({ supabase, createLedgerEntry }) {
  const report = {
    runAt: new Date().toISOString(),
    deposits: { found: 0, created: 0, deduped: 0, failed: 0 },
    miss: { found: 0, created: 0, deduped: 0, failed: 0 },
    goal: { found: 0, apostaCreated: 0, premioCreated: 0, deduped: 0, failed: 0 }
  };

  if (!supabase || typeof createLedgerEntry !== 'function') {
    console.warn('[RECONCILE-LEDGER] supabase ou createLedgerEntry ausente');
    return report;
  }

  try {
    // ---- Depósitos aprovados sem ledger deposito_aprovado ----
    const { data: approvedPayments, error: errPayments } = await supabase
      .from('pagamentos_pix')
      .select('id, usuario_id, amount, valor')
      .eq('status', 'approved');

    if (errPayments) {
      console.error('[RECONCILE-LEDGER] Erro ao listar pagamentos aprovados:', errPayments.message);
      return report;
    }

    const payments = approvedPayments || [];
    for (const p of payments) {
      const pn = normalizePagamentoPixRead(p);
      const ref = String(pn.id);
      const exists = await ledgerExists(supabase, ref, 'deposito_aprovado');
      if (exists) continue;

      report.deposits.found++;
      const valor = Number(pn.amount ?? pn.valor ?? 0);
      if (valor <= 0) continue;

      const result = await createLedgerEntry({
        supabase,
        tipo: 'deposito_aprovado',
        usuarioId: pn.usuario_id,
        valor,
        referencia: ref,
        correlationId: ref
      });

      if (result.deduped) report.deposits.deduped++;
      else if (result.success) report.deposits.created++;
      else {
        report.deposits.failed++;
        console.warn('[RECONCILE-LEDGER] deposito_aprovado falhou', { ref: ref.slice(0, 8), error: result.error?.message });
      }
    }

    // ---- Chutes MISS sem ledger chute_miss ----
    const { data: chutesMiss, error: errMiss } = await supabase
      .from('chutes')
      .select('id, usuario_id, valor_aposta')
      .eq('resultado', 'miss');

    if (errMiss) {
      console.error('[RECONCILE-LEDGER] Erro ao listar chutes miss:', errMiss.message);
    } else {
      const list = chutesMiss || [];
      for (const c of list) {
        const ref = String(c.id);
        const exists = await ledgerExists(supabase, ref, 'chute_miss');
        if (exists) continue;

        report.miss.found++;
        const amount = Number(c.valor_aposta ?? 1);
        const result = await createLedgerEntry({
          supabase,
          tipo: 'chute_miss',
          usuarioId: c.usuario_id,
          valor: -amount,
          referencia: ref,
          correlationId: ref
        });

        if (result.deduped) report.miss.deduped++;
        else if (result.success) report.miss.created++;
        else {
          report.miss.failed++;
          console.warn('[RECONCILE-LEDGER] chute_miss falhou', { ref: ref.slice(0, 8), error: result.error?.message });
        }
      }
    }

    // ---- Chutes GOAL sem ledger chute_aposta e/ou chute_premio ----
    const { data: chutesGoal, error: errGoal } = await supabase
      .from('chutes')
      .select('id, usuario_id, valor_aposta, premio, premio_gol_de_ouro')
      .eq('resultado', 'goal');

    if (errGoal) {
      console.error('[RECONCILE-LEDGER] Erro ao listar chutes goal:', errGoal.message);
    } else {
      const list = chutesGoal || [];
      for (const c of list) {
        const ref = String(c.id);
        const amount = Number(c.valor_aposta ?? 1);
        const premioTotal = Number(c.premio ?? 0) + Number(c.premio_gol_de_ouro ?? 0);

        const hasAposta = await ledgerExists(supabase, ref, 'chute_aposta');
        const hasPremio = await ledgerExists(supabase, ref, 'chute_premio');

        if (hasAposta && hasPremio) continue;

        report.goal.found++;

        if (!hasAposta) {
          const resultA = await createLedgerEntry({
            supabase,
            tipo: 'chute_aposta',
            usuarioId: c.usuario_id,
            valor: -amount,
            referencia: ref,
            correlationId: ref
          });
          if (resultA.deduped) report.goal.deduped++;
          else if (resultA.success) report.goal.apostaCreated++;
          else report.goal.failed++;
        }

        if (!hasPremio) {
          const resultP = await createLedgerEntry({
            supabase,
            tipo: 'chute_premio',
            usuarioId: c.usuario_id,
            valor: premioTotal,
            referencia: ref,
            correlationId: ref
          });
          if (resultP.deduped) report.goal.deduped++;
          else if (resultP.success) report.goal.premioCreated++;
          else report.goal.failed++;
        }
      }
    }

    console.log('[RECONCILE-LEDGER] Concluído', {
      deposits: report.deposits,
      miss: report.miss,
      goal: report.goal
    });
  } catch (err) {
    console.error('[RECONCILE-LEDGER] Erro inesperado:', err);
  }

  return report;
}

module.exports = {
  runReconcileMissingLedger,
  ledgerExists
};
