/**
 * READ-ONLY: Validação do Patch V1.1 payout_worker.
 * 1) Coleta logs Fly e detecta sinais [PAYOUT][CYCLE] [QUERY] [SELECT] [SKIP] [ROLLBACK_FAIL]
 * 2) Lê saques presos (processando >30 min) e ledger/transacoes
 * 3) Gera payout-v1_1-worker-logs.json, payout-v1_1-saques-status.json, payout-v1_1-diagnostico-final.json
 */
require('dotenv').config();
const { execSync } = require('child_process');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.join(__dirname, '..', 'docs', 'relatorios');
const APP = process.env.FLY_APP || 'goldeouro-backend-v2';
const PRESO_MIN = 30;

function run(cmd, opts = {}) {
  try {
    return execSync(cmd, { encoding: 'utf8', timeout: 28000, maxBuffer: 3 * 1024 * 1024, ...opts });
  } catch (e) {
    return (e.stdout || e.stderr || e.message || '') + '';
  }
}

function redact(line) {
  return (line || '')
    .replace(/\b(eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)/g, '[JWT]')
    .replace(/\bBearer\s+[^\s]+/gi, 'Bearer [REDACTED]')
    .replace(/\b(sk|pk|APP_USR)[^\s]*/gi, '[TOKEN]')
    .slice(0, 550);
}

// Sinais do Patch V1.1
const V11_SIGNALS = [
  { key: 'PAYOUT_CYCLE', re: /\[PAYOUT\]\[CYCLE\]/i },
  { key: 'PAYOUT_QUERY', re: /\[PAYOUT\]\[QUERY\]/i },
  { key: 'PAYOUT_SELECT', re: /\[PAYOUT\]\[SELECT\]/i },
  { key: 'PAYOUT_SKIP', re: /\[PAYOUT\]\[SKIP\]/i },
  { key: 'PAYOUT_ROLLBACK_FAIL', re: /\[PAYOUT\]\[ROLLBACK_FAIL\]/i }
];

const rawLogs = run(`flyctl logs -a ${APP} --no-tail 2>&1`);
const lines = rawLogs.split(/\r?\n/).filter(Boolean);
const lastLines = lines.slice(-600);

const signalCounts = {};
const signalSamples = {};
V11_SIGNALS.forEach(p => { signalCounts[p.key] = 0; signalSamples[p.key] = []; });

lastLines.forEach(l => {
  V11_SIGNALS.forEach(p => {
    if (p.re.test(l)) {
      signalCounts[p.key]++;
      if (signalSamples[p.key].length < 5) signalSamples[p.key].push(redact(l));
    }
  });
});

const workerLogsReport = {
  timestamp: new Date().toISOString(),
  app: APP,
  lines_analisadas: lastLines.length,
  patch_v1_1_sinais: signalCounts,
  amostras_por_sinal: signalSamples,
  patch_visivel: signalCounts['PAYOUT_CYCLE'] > 0 || signalCounts['PAYOUT_QUERY'] > 0
};

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, 'payout-v1_1-worker-logs.json'), JSON.stringify(workerLogsReport, null, 2), 'utf8');
console.log('OK payout-v1_1-worker-logs.json');

// Saques presos
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  const diag = { timestamp: new Date().toISOString(), erro: 'SUPABASE ausente', worker_logs: workerLogsReport };
  fs.writeFileSync(path.join(OUT_DIR, 'payout-v1_1-saques-status.json'), JSON.stringify({ timestamp: new Date().toISOString(), erro: 'SUPABASE ausente' }, null, 2), 'utf8');
  fs.writeFileSync(path.join(OUT_DIR, 'payout-v1_1-diagnostico-final.json'), JSON.stringify(diag, null, 2), 'utf8');
  console.log('OK saques/diagnostico (sem Supabase)');
  process.exit(0);
}

const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

function maskId(id) {
  if (id == null) return null;
  const s = String(id);
  return s.length <= 4 ? '***' : '***' + s.slice(-4);
}

(async () => {
  const since = new Date(Date.now() - PRESO_MIN * 60 * 1000).toISOString();
  const { data: saques, error: eSaques } = await supabase
    .from('saques')
    .select('id, usuario_id, status, created_at, updated_at, processed_at, transacao_id, valor, amount, net_amount, fee, correlation_id')
    .in('status', ['processando', 'processing'])
    .lt('created_at', since)
    .order('created_at', { ascending: true });

  const saquesReport = {
    timestamp: new Date().toISOString(),
    total_presos_mais_30_min: 0,
    saques: [],
    ledger_por_saque: {},
    erros: []
  };

  if (eSaques) {
    saquesReport.erros.push({ step: 'saques', msg: eSaques.message });
  } else {
    const list = saques || [];
    saquesReport.total_presos_mais_30_min = list.length;
    saquesReport.saques = list.map(s => ({
      id: s.id,
      id_8: String(s.id).slice(0, 8),
      usuario_id: maskId(s.usuario_id),
      status: s.status,
      created_at: s.created_at,
      updated_at: s.updated_at,
      processed_at: s.processed_at,
      transacao_id: s.transacao_id,
      amount: s.amount ?? s.valor,
      net_amount: s.net_amount,
      correlation_id: s.correlation_id ? maskId(String(s.correlation_id)) : null
    }));
    for (const s of list) {
      const ref = String(s.id);
      const { data: ledgerRows } = await supabase.from('ledger_financeiro').select('id, tipo, valor, referencia, created_at').eq('referencia', ref);
      saquesReport.ledger_por_saque[ref] = (ledgerRows || []).length;
    }
  }
  fs.writeFileSync(path.join(OUT_DIR, 'payout-v1_1-saques-status.json'), JSON.stringify(saquesReport, null, 2), 'utf8');
  console.log('OK payout-v1_1-saques-status.json');

  // Diagnóstico final
  const cycleEnabled = lastLines.some(l => /\[PAYOUT\]\[CYCLE\].*enabled=true/.test(l));
  const cycleDbFail = lastLines.some(l => /\[PAYOUT\]\[CYCLE\].*db=fail/.test(l));
  const cycleProviderFail = lastLines.some(l => /\[PAYOUT\]\[CYCLE\].*provider=fail/.test(l));
  const queryCount = lastLines.find(l => /\[PAYOUT\]\[QUERY\].*count=/.test(l));
  const countMatch = queryCount ? queryCount.match(/count=(-?\d+)/) : null;
  const queryCountValue = countMatch ? parseInt(countMatch[1], 10) : null;

  let causa_confirmada = 'indefinida';
  let proximo_patch = [];

  if (!workerLogsReport.patch_visivel) {
    causa_confirmada = 'patch_v1_1_nao_visivel_nos_logs';
    proximo_patch = ['1. Fazer deploy do commit 0f09038 (patch V1.1) no Fly e recolher logs'];
  } else {
    if (cycleProviderFail) {
      causa_confirmada = 'provider_nao_configured';
      proximo_patch.push('2. provider MP: configurar MERCADOPAGO_PAYOUT_ACCESS_TOKEN (formato APP_USR- ou APP_USR_) no Fly para o process group payout_worker');
    }
    if (cycleDbFail) {
      causa_confirmada = causa_confirmada === 'indefinida' ? 'db_fail' : causa_confirmada + '_e_db_fail';
      proximo_patch.push('1. env/config: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY corretos para payout_worker');
    }
    const cycleDisabled = lastLines.some(l => /\[PAYOUT\]\[CYCLE\].*enabled=false/.test(l));
  if (cycleDisabled) {
      causa_confirmada = causa_confirmada === 'indefinida' ? 'payout_disabled' : causa_confirmada + '_e_disabled';
      proximo_patch.push('1. env/config: PAYOUT_PIX_ENABLED=true no Fly para payout_worker');
    }
    if (queryCountValue !== null && queryCountValue > 0 && signalCounts['PAYOUT_SELECT'] === 0) {
      causa_confirmada = causa_confirmada === 'indefinida' ? 'query_retorna_count_mas_select_nao_aparece' : causa_confirmada;
      proximo_patch.push('2. query/status: investigar por que count=' + queryCountValue + ' mas nenhum [PAYOUT][SELECT] (RLS ou filtro)');
    }
    if (signalCounts['PAYOUT_ROLLBACK_FAIL'] > 0) {
      proximo_patch.push('3. rollback: corrigir update do saque para rejeitado (constraint, RLS ou trigger)');
    }
    if (causa_confirmada === 'indefinida' && saquesReport.total_presos_mais_30_min > 0 && signalCounts['PAYOUT_QUERY'] > 0) {
      if (queryCountValue === 0) causa_confirmada = 'query_retorna_0_em_producao';
      else causa_confirmada = 'observabilidade_ativa_causa_em_analise';
    }
  }

  const diagnostico = {
    timestamp: new Date().toISOString(),
    patch_v1_1_visivel: workerLogsReport.patch_visivel,
    sinais_presentes: signalCounts,
    total_saques_presos: saquesReport.total_presos_mais_30_min,
    cycle_enabled: cycleEnabled,
    cycle_db_fail: cycleDbFail,
    cycle_provider_fail: cycleProviderFail,
    query_count_valor: queryCountValue,
    causa_confirmada_final: causa_confirmada,
    proximo_patch_minimo: proximo_patch.length ? proximo_patch : ['Nenhum; validar se saques foram processados ou rejeitados após deploy']
  };

  fs.writeFileSync(path.join(OUT_DIR, 'payout-v1_1-diagnostico-final.json'), JSON.stringify(diagnostico, null, 2), 'utf8');
  console.log('OK payout-v1_1-diagnostico-final.json');
})();
