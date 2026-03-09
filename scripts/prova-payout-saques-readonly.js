/**
 * AUDITORIA READ-ONLY: Saques PIX e payout_worker — contagem por status, presos > X min,
 * últimas 50 mascaradas, compatibilidade CHECK. Logs Fly (read-only) para padrões do worker.
 * Salva docs/relatorios/prova-payout-saques-readonly-YYYY-MM-DD.json
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.join(__dirname, '..', 'docs', 'relatorios');
const TS = new Date().toISOString().slice(0, 10);
const APP = 'goldeouro-backend-v2';
const PRESO_MIN = 30;

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error(JSON.stringify({ error: 'SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes' }));
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

function maskId(id) {
  if (id == null) return null;
  const s = String(id);
  return s.length <= 4 ? '***' : '***' + s.slice(-4);
}

function runFlyLogs() {
  try {
    const out = execSync(`flyctl logs -a ${APP} --no-tail 2>&1`, { encoding: 'utf8', timeout: 15000, maxBuffer: 1024 * 1024 });
    const lines = (out || '').split(/\r?\n/).slice(-200);
    const patterns = {
      PAYOUT_WORKER: lines.filter(l => /\[PAYOUT\]|\[WORKER\]/i.test(l)).length,
      updateSaqueStatus_indisponivel: lines.filter(l => /updateSaqueStatus|indisponível/i.test(l)).length,
      Erro_registrar_saque: lines.filter(l => /Erro ao registrar saque/i.test(l)).length,
      LEDGER_insert_falhou: lines.filter(l => /\[LEDGER\].*insert|insert falhou/i.test(l)).length
    };
    return { lines_count: lines.length, patterns, sample: lines.slice(-5) };
  } catch (e) {
    return { error: e.message || String(e), patterns: {}, sample: [] };
  }
}

async function run() {
  const report = {
    timestamp: new Date().toISOString(),
    saques_por_status: [],
    processando_mais_de_x_min: { min: PRESO_MIN, total: 0, amostra: [] },
    ultimos_50_mascarados: [],
    status_vs_check: { permitidos: ['pendente', 'processando', 'concluido', 'rejeitado', 'cancelado'], encontrados: [] },
    fly_logs: null,
    erros: []
  };

  const { data: saques, error: e1 } = await supabase
    .from('saques')
    .select('id, usuario_id, status, valor, amount, created_at, processed_at, transacao_id')
    .order('created_at', { ascending: false });
  if (e1) {
    report.erros.push({ step: 'saques', msg: e1.message });
  } else {
    const byStatus = {};
    (saques || []).forEach(r => { byStatus[r.status] = (byStatus[r.status] || 0) + 1; });
    report.saques_por_status = Object.entries(byStatus).map(([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count);
    report.status_vs_check.encontrados = [...new Set((saques || []).map(r => r.status))];

    const now = Date.now();
    const presos = (saques || []).filter(s => {
      const status = String(s.status || '').toLowerCase();
      if (status !== 'processando' && status !== 'processing') return false;
      const created = new Date(s.created_at).getTime();
      return (now - created) > PRESO_MIN * 60 * 1000;
    });
    report.processando_mais_de_x_min.total = presos.length;
    report.processando_mais_de_x_min.amostra = presos.slice(0, 10).map(s => ({
      id: s.id,
      status: s.status,
      created_at: s.created_at,
      usuario_id: maskId(s.usuario_id),
      amount: s.amount ?? s.valor
    }));

    report.ultimos_50_mascarados = (saques || []).slice(0, 50).map(s => ({
      id: s.id,
      status: s.status,
      created_at: s.created_at,
      processed_at: s.processed_at ?? null,
      transacao_id: s.transacao_id ?? null,
      usuario_id: maskId(s.usuario_id),
      amount: s.amount ?? s.valor
    }));
  }

  report.fly_logs = runFlyLogs();

  const outPath = path.join(OUT_DIR, `prova-payout-saques-readonly-${TS}.json`);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');
  console.log('OK prova payout saques -> ' + outPath);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
