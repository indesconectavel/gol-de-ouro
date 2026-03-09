/**
 * READ-ONLY: Root cause dos saques que estavam processando e apareceram como rejeitado.
 * Gera: payout-rejeitados-*.json em docs/relatorios.
 * Não imprime segredos.
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'docs', 'relatorios');

function maskId(id) {
  if (id == null) return null;
  const s = String(id);
  return s.length <= 6 ? '***' : s.slice(0, 6) + '***' + s.slice(-4);
}

function out(name, data) {
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, name), JSON.stringify(data, null, 2), 'utf8');
}

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    const err = { timestamp_utc: new Date().toISOString(), erro: 'SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausente' };
    out('payout-rejeitados-status-transition.json', err);
    out('payout-rejeitados-saldo-rollback.json', err);
    out('payout-rejeitados-ledger-check.json', err);
    out('payout-rejeitados-logs.json', err);
    out('payout-rejeitados-consistencia.json', err);
    return;
  }

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    db: { schema: 'public' }
  });

  const now = new Date().toISOString();

  // PASSO A — Saques rejeitados recentes (campos disponíveis; motivo_rejeicao pode não existir em todos os ambientes)
  let saquesRejeitados = [];
  const cols = 'id, usuario_id, status, created_at, updated_at, processed_at, transacao_id, valor, amount, net_amount, fee, correlation_id';
  const { data: rejeitados, error: eRej } = await supabase
    .from('saques')
    .select(cols)
    .eq('status', 'rejeitado')
    .order('updated_at', { ascending: false })
    .limit(50);

  if (eRej) {
    out('payout-rejeitados-status-transition.json', { timestamp_utc: now, erro: eRej.message, saques: [] });
  } else {
    saquesRejeitados = rejeitados || [];
  }

  // Tentar buscar motivo_rejeicao se existir (query separada para não falhar em schemas antigos)
  let motivoMap = {};
  if (saquesRejeitados.length > 0) {
    const ids = saquesRejeitados.map(s => s.id);
    const { data: comMotivo } = await supabase
      .from('saques')
      .select('id, motivo_rejeicao')
      .in('id', ids);
    if (comMotivo) {
      comMotivo.forEach(r => { motivoMap[r.id] = r.motivo_rejeicao ?? null; });
    }
  }

  const MOTIVOS_RECONCILER = ['timeout_reconciliacao', 'valor_invalido_reconcile', 'pix_invalido_reconcile', 'erro_provedor_reconcile'];
  const MOTIVOS_WORKER = ['payout falhou', 'correlation_id ausente', 'correlation_id ausente'];

  const statusTransition = {
    timestamp_utc: now,
    total_rejeitados: saquesRejeitados.length,
    transicao_inferida: 'processando -> rejeitado (updated_at indica momento da mudança)',
    saques: saquesRejeitados.map(s => {
      const motivo = motivoMap[s.id] ?? null;
      const quem = motivo && MOTIVOS_RECONCILER.includes(motivo) ? 'reconciler' : (motivo ? 'worker_ou_webhook' : 'indeterminado');
      return {
        id: s.id,
        id_short: maskId(s.id),
        usuario_id: maskId(s.usuario_id),
        status: s.status,
        created_at: s.created_at,
        updated_at: s.updated_at,
        processed_at: s.processed_at,
        transacao_id: s.transacao_id,
        valor: s.valor,
        amount: s.amount,
        net_amount: s.net_amount,
        fee: s.fee,
        correlation_id: maskId(s.correlation_id),
        motivo_rejeicao: motivo,
        quem_rejeitou_inferido: quem,
        timestamp_mudanca_proxy: s.updated_at || s.processed_at
      };
    })
  };
  out('payout-rejeitados-status-transition.json', statusTransition);

  // PASSO C e D — Ledger por saque + saldo usuário
  const ledgerCheck = { timestamp_utc: now, por_saque: {}, erros: [] };
  const saldoRollback = { timestamp_utc: now, por_usuario: {}, resumo: { rollback_ok: 0, rollback_ausente: 0, inconclusivo: 0 } };
  const userIds = [...new Set(saquesRejeitados.map(s => s.usuario_id).filter(Boolean))];

  for (const s of saquesRejeitados) {
    const ref = String(s.id);
    const { data: ledgerRows, error: eL } = await supabase
      .from('ledger_financeiro')
      .select('id, tipo, valor, referencia, correlation_id, created_at')
      .eq('referencia', ref);

    const ledgerTambemFee = await supabase
      .from('ledger_financeiro')
      .select('id, tipo, valor, referencia, created_at')
      .eq('referencia', `${ref}:fee`);

    const todosLedger = [...(ledgerRows || []), ...(ledgerTambemFee.data || [])];
    const temRollback = todosLedger.some(l => l.tipo === 'rollback');
    const temWithdrawRequest = todosLedger.some(l => l.tipo === 'withdraw_request');
    const temFalhaPayout = todosLedger.some(l => l.tipo === 'falha_payout');

    ledgerCheck.por_saque[ref] = {
      id_short: maskId(s.id),
      usuario_id: maskId(s.usuario_id),
      motivo_rejeicao: motivoMap[s.id] ?? null,
      linhas: todosLedger.map(l => ({ tipo: l.tipo, valor: l.valor, referencia: l.referencia ? maskId(l.referencia) : null, created_at: l.created_at })),
      tem_withdraw_request: temWithdrawRequest,
      tem_falha_payout: temFalhaPayout,
      tem_rollback: temRollback,
      ledger_esperado_worker: 'withdraw_request + falha_payout + rollback',
      ledger_esperado_reconciler: 'apenas withdraw_request (reconciler não chama rollback)'
    };
  }

  for (const uid of userIds) {
    const { data: user, error: eU } = await supabase.from('usuarios').select('id, saldo').eq('id', uid).single();
    saldoRollback.por_usuario[maskId(uid)] = {
      saldo_atual: user?.saldo ?? null,
      erro: eU?.message ?? null
    };
  }

  for (const s of saquesRejeitados) {
    const ref = String(s.id);
    const info = ledgerCheck.por_saque[ref];
    if (!info) continue;
    if (info.tem_rollback) saldoRollback.resumo.rollback_ok++;
    else if (info.motivo_rejeicao && MOTIVOS_RECONCILER.includes(info.motivo_rejeicao)) saldoRollback.resumo.rollback_ausente++;
    else saldoRollback.resumo.inconclusivo++;
  }

  out('payout-rejeitados-ledger-check.json', ledgerCheck);
  out('payout-rejeitados-saldo-rollback.json', saldoRollback);

  // PASSO E — Logs: não temos acesso a Fly; gerar padrões para busca manual
  const logPatterns = {
    timestamp_utc: now,
    nota: 'Logs reais devem ser buscados no Fly Dashboard (payout_worker e app). Este arquivo lista padrões a buscar.',
    padroes: [
      'rejeitado',
      'ROLLBACK',
      'payout falhou',
      'motivo_rejeicao',
      'timeout_reconciliacao',
      '[RECONCILE]',
      '[PAYOUT][FALHOU]',
      '[SAQUE][ROLLBACK]',
      'PAYOUT_ROLLBACK_FAIL'
    ],
    ids_para_buscar: saquesRejeitados.slice(0, 10).map(s => ({ id_8: String(s.id).slice(0, 8), correlation_8: s.correlation_id ? String(s.correlation_id).slice(0, 8) : null })),
    instrucao: 'fly logs -a <app> | grep -E "rejeitado|ROLLBACK|RECONCILE|PAYOUT"'
  };
  out('payout-rejeitados-logs.json', logPatterns);

  // PASSO F — Consistência
  const inconsistentes = [];
  for (const s of saquesRejeitados) {
    const ref = String(s.id);
    const info = ledgerCheck.por_saque[ref];
    if (!info) continue;
    const motivo = info.motivo_rejeicao;
    const reconcilerRejeitou = motivo && MOTIVOS_RECONCILER.includes(motivo);
    if (reconcilerRejeitou && !info.tem_rollback && info.tem_withdraw_request) {
      inconsistentes.push({
        saque_id_short: maskId(s.id),
        usuario_id: maskId(s.usuario_id),
        motivo_rejeicao: motivo,
        problema: 'Reconciler rejeitou mas não há rollback; saldo foi debitado na criação e não foi devolvido.'
      });
    }
  }

  const consistencia = {
    timestamp_utc: now,
    total_rejeitados: saquesRejeitados.length,
    com_rollback_ledger: saldoRollback.resumo.rollback_ok,
    sem_rollback_reconciler: saldoRollback.resumo.rollback_ausente,
    inconclusivo: saldoRollback.resumo.inconclusivo,
    inconsistencia_financeira: inconsistentes.length,
    detalhe_inconsistentes: inconsistentes,
    conclusao_rollback: saldoRollback.resumo.rollback_ausente > 0 ? 'NÃO OK (rejeições do reconciler sem rollback)' : (saldoRollback.resumo.rollback_ok === saquesRejeitados.length ? 'OK' : 'INCONCLUSIVO'),
    conclusao_ledger: inconsistentes.length > 0 ? 'INCONSISTENTE (débito sem crédito de rollback)' : (saldoRollback.resumo.rollback_ok === saquesRejeitados.length ? 'OK' : 'VERIFICAR')
  };
  out('payout-rejeitados-consistencia.json', consistencia);
}

main().catch(err => {
  const outDir = path.join(__dirname, '..', 'docs', 'relatorios');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'payout-rejeitados-status-transition.json'), JSON.stringify({ timestamp_utc: new Date().toISOString(), erro: err.message }, null, 2), 'utf8');
  process.exit(1);
});
