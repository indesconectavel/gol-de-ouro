/**
 * READ-ONLY: Validação final da etapa financeira V1 (pós patch V1.2).
 * Gera: financeiro-v1-final-*.json em docs/relatorios.
 * Não imprime segredos.
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'docs', 'relatorios');
const MOTIVOS_RECONCILER = ['timeout_reconciliacao', 'valor_invalido_reconcile', 'pix_invalido_reconcile', 'erro_provedor_reconcile'];

function maskId(id) {
  if (id == null) return null;
  const s = String(id);
  return s.length <= 6 ? '***' : s.slice(0, 6) + '***' + s.slice(-4);
}

function out(name, data) {
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, name), JSON.stringify(data, null, 2), 'utf8');
}

function getPatchPresentInCode() {
  const reconPath = path.join(ROOT, 'src', 'domain', 'payout', 'reconcileProcessingWithdrawals.js');
  let content = '';
  try {
    content = fs.readFileSync(reconPath, 'utf8');
  } catch (e) {
    return { present: false, error: e.message };
  }
  const hasReject = content.includes('rejectWithRollbackIfNeeded');
  const hasLog = /\[PAYOUT\]\[RECON\]/.test(content);
  const hasLedgerCheck = content.includes('ledgerHasRollback');
  return {
    present: hasReject && hasLog && hasLedgerCheck,
    rejectWithRollbackIfNeeded: hasReject,
    log_PAYOUT_RECON: hasLog,
    ledgerHasRollback: hasLedgerCheck
  };
}

function httpGet(url) {
  return new Promise((resolve) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, { timeout: 8000 }, (res) => {
      let body = '';
      res.on('data', (ch) => { body += ch; });
      res.on('end', () => resolve({ statusCode: res.statusCode, ok: res.statusCode === 200, bodyLength: body.length }));
    });
    req.on('error', (err) => resolve({ statusCode: null, ok: false, error: err.message }));
    req.on('timeout', () => { req.destroy(); resolve({ statusCode: null, ok: false, error: 'timeout' }); });
  });
}

async function main() {
  const now = new Date().toISOString();
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    const err = { timestamp_utc: now, erro: 'SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausente' };
    out('financeiro-v1-final-saques.json', err);
    out('financeiro-v1-final-ledger.json', err);
    out('financeiro-v1-final-saldos.json', err);
    out('financeiro-v1-final-logs.json', { ...err, patch_v1_2_no_codigo: getPatchPresentInCode() });
    out('financeiro-v1-final-game-check.json', { ...err, patch_v1_2_no_codigo: getPatchPresentInCode() });
    return;
  }

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    db: { schema: 'public' }
  });

  // ----- PASSO A — Saques rejeitados -----
  const cols = 'id, usuario_id, status, created_at, updated_at, processed_at, transacao_id, valor, amount, net_amount, fee, correlation_id';
  const { data: rejeitados, error: eRej } = await supabase
    .from('saques')
    .select(cols)
    .eq('status', 'rejeitado')
    .order('updated_at', { ascending: false })
    .limit(50);

  let motivoMap = {};
  if ((rejeitados || []).length > 0) {
    const { data: comMotivo } = await supabase.from('saques').select('id, motivo_rejeicao').in('id', rejeitados.map(s => s.id));
    (comMotivo || []).forEach(r => { motivoMap[r.id] = r.motivo_rejeicao ?? null; });
  }

  const saquesList = (rejeitados || []).map(s => {
    const motivo = motivoMap[s.id] ?? null;
    const reconciler = motivo && MOTIVOS_RECONCILER.includes(motivo);
    return {
      id: s.id,
      id_short: maskId(s.id),
      usuario_id: maskId(s.usuario_id),
      status: s.status,
      motivo_rejeicao: motivo,
      rejeitado_pelo_reconciler: reconciler,
      created_at: s.created_at,
      updated_at: s.updated_at,
      processed_at: s.processed_at,
      transacao_id: s.transacao_id,
      valor: s.valor,
      amount: s.amount,
      net_amount: s.net_amount,
      fee: s.fee
    };
  });

  const rollbackPorSaque = {};
  for (const s of rejeitados || []) {
    const ref = String(s.id);
    const { data: rollbackRows } = await supabase
      .from('ledger_financeiro')
      .select('id, tipo, valor, created_at')
      .eq('referencia', ref)
      .eq('tipo', 'rollback');
    const { data: feeRows } = await supabase
      .from('ledger_financeiro')
      .select('id, tipo, valor')
      .eq('referencia', `${ref}:fee`)
      .eq('tipo', 'rollback');
    const rollbackPresent = ((rollbackRows || []).length + (feeRows || []).length) > 0;
    rollbackPorSaque[ref] = {
      rollback_presente: rollbackPresent,
      linhas_count: (rollbackRows || []).length + (feeRows || []).length
    };
  }

  const saquesComConsistencia = saquesList.map(s => ({
    ...s,
    rollback_presente: rollbackPorSaque[s.id]?.rollback_presente ?? false,
    consistencia_final: rollbackPorSaque[s.id]?.rollback_presente
      ? 'rollback_registrado'
      : (s.rejeitado_pelo_reconciler ? 'rollback_ausente_pre_v1_2' : 'inconclusivo')
  }));

  const saquesOut = {
    timestamp_utc: now,
    total_rejeitados: saquesComConsistencia.length,
    saques: saquesComConsistencia,
    resumo: {
      com_rollback: saquesComConsistencia.filter(s => s.rollback_presente).length,
      sem_rollback: saquesComConsistencia.filter(s => !s.rollback_presente).length,
      rejeitados_pelo_reconciler: saquesComConsistencia.filter(s => s.rejeitado_pelo_reconciler).length
    }
  };
  out('financeiro-v1-final-saques.json', saquesOut);

  // ----- PASSO B — Saldos -----
  const userIds = [...new Set((rejeitados || []).map(s => s.usuario_id).filter(Boolean))];
  const saldosPorUser = {};
  for (const uid of userIds) {
    const { data: u } = await supabase.from('usuarios').select('id, saldo').eq('id', uid).single();
    saldosPorUser[maskId(uid)] = { saldo_atual: u?.saldo ?? null };
  }
  const comRollback = saquesComConsistencia.filter(s => s.rollback_presente).length;
  const semRollback = saquesComConsistencia.filter(s => !s.rollback_presente).length;
  const conclusaoRollback = semRollback === 0 ? 'rollback_ok' : (comRollback > 0 ? 'rollback_parcial' : 'rollback_ausente');
  const saldosOut = {
    timestamp_utc: now,
    usuarios_afetados_count: userIds.length,
    saldos_por_usuario: saldosPorUser,
    conclusao_rollback: conclusaoRollback,
    saques_com_rollback: comRollback,
    saques_sem_rollback: semRollback
  };
  out('financeiro-v1-final-saldos.json', saldosOut);

  // ----- PASSO C — Ledger -----
  const { data: ledgerRows } = await supabase
    .from('ledger_financeiro')
    .select('id, tipo, valor, referencia, created_at')
    .order('created_at', { ascending: false })
    .limit(500);

  const byTipo = {};
  (ledgerRows || []).forEach(r => {
    const t = r.tipo || 'null';
    byTipo[t] = (byTipo[t] || 0) + 1;
  });
  const temWithdrawRequest = (ledgerRows || []).some(r => r.tipo === 'withdraw_request');
  const temFalhaPayout = (ledgerRows || []).some(r => r.tipo === 'falha_payout');
  const temRollback = (ledgerRows || []).some(r => r.tipo === 'rollback');
  const ledgerOut = {
    timestamp_utc: now,
    total_amostra: (ledgerRows || []).length,
    contagem_por_tipo: byTipo,
    tipos_esperados_presentes: {
      withdraw_request: temWithdrawRequest,
      falha_payout: temFalhaPayout,
      rollback: temRollback
    },
    conclusao_ledger: temRollback && (temFalhaPayout || temWithdrawRequest) ? 'ledger_ok' : (temRollback ? 'ledger_ok' : 'ledger_sem_rollback_na_amostra')
  };
  out('financeiro-v1-final-ledger.json', ledgerOut);

  // ----- PASSO D — Logs (código + instruções) -----
  const patchCode = getPatchPresentInCode();
  const logsOut = {
    timestamp_utc: now,
    patch_v1_2_no_codigo: patchCode,
    padroes_buscar_fly: ['[PAYOUT][RECON]', 'rollback=true', 'rollback=already_done', 'motivo=timeout_reconciliacao', 'RECONCILE'],
    instrucao: 'fly logs -a <app> | grep -E "PAYOUT\\]\\[RECON|RECONCILE"',
    duplicidade_rollback: 'createLedgerEntry deduplica por (correlation_id, tipo, referencia); ledgerHasRollback evita segunda execução de rollbackWithdraw.'
  };
  out('financeiro-v1-final-logs.json', logsOut);

  // ----- PASSO E — Game / dashboard (opcional) -----
  const baseUrl = process.env.VALIDATION_BASE_URL || '';
  const gameCheck = {
    timestamp_utc: now,
    patch_v1_2_no_codigo: patchCode,
    base_url_configurada: !!baseUrl
  };
  if (baseUrl) {
    const gameRes = await httpGet(baseUrl.replace(/\/$/, '') + '/game');
    const dashRes = await httpGet(baseUrl.replace(/\/$/, '') + '/dashboard');
    gameCheck.game = { url: baseUrl + '/game', statusCode: gameRes.statusCode, ok: gameRes.ok, error: gameRes.error };
    gameCheck.dashboard = { url: baseUrl + '/dashboard', statusCode: dashRes.statusCode, ok: dashRes.ok, error: dashRes.error };
    gameCheck.fingerprint_estavel = gameRes.ok && dashRes.ok ? 'ambos_200' : 'verificar';
  } else {
    gameCheck.game = { nota: 'VALIDATION_BASE_URL nao definido; GET /game e /dashboard nao executados.' };
    gameCheck.dashboard = { nota: 'Definir VALIDATION_BASE_URL para validar endpoints.' };
    gameCheck.fingerprint_estavel = 'nao_validado_sem_url';
  }
  out('financeiro-v1-final-game-check.json', gameCheck);
}

main().catch(err => {
  const outDir = path.join(__dirname, '..', 'docs', 'relatorios');
  fs.mkdirSync(outDir, { recursive: true });
  const payload = { timestamp_utc: new Date().toISOString(), erro: err.message };
  fs.writeFileSync(path.join(outDir, 'financeiro-v1-final-saques.json'), JSON.stringify(payload, null, 2), 'utf8');
  process.exit(1);
});
