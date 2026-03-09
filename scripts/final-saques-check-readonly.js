/**
 * AUDITORIA READ-ONLY: Validação final saques — total por status, presos >30min,
 * processed_at null, transacao_id null, últimos 20 (mascarados).
 * Salva docs/relatorios/final-saques-check.json
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.join(__dirname, '..', 'docs', 'relatorios');
const PRESO_MIN = 30;
const LIMITE_ULTIMOS = 20;

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

async function run() {
  const report = {
    timestamp: new Date().toISOString(),
    total_por_status: [],
    presos_mais_30_min: 0,
    saques_presos: [],
    processed_at_null: 0,
    transacao_id_null: 0,
    ultimos_20_mascarados: [],
    erros: []
  };

  const { data: all, error: eAll } = await supabase
    .from('saques')
    .select('id, usuario_id, status, created_at, updated_at, processed_at, transacao_id, amount, valor');
  if (eAll) {
    report.erros.push({ step: 'all', msg: eAll.message });
    const outPath = path.join(OUT_DIR, 'final-saques-check.json');
    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');
    console.log('OK final saques (com erros) -> ' + outPath);
    return;
  }
  const rows = all || [];

  const byStatus = {};
  rows.forEach(r => { byStatus[r.status] = (byStatus[r.status] || 0) + 1; });
  report.total_por_status = Object.entries(byStatus).map(([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count);

  report.processed_at_null = rows.filter(r => r.processed_at == null || r.processed_at === '').length;
  report.transacao_id_null = rows.filter(r => r.transacao_id == null || r.transacao_id === '').length;

  const since = new Date(Date.now() - PRESO_MIN * 60 * 1000).toISOString();
  const presos = rows.filter(r =>
    ['processando', 'processing'].includes(String(r.status || '').toLowerCase()) &&
    r.created_at && new Date(r.created_at) < new Date(since)
  );
  report.presos_mais_30_min = presos.length;
  report.saques_presos = presos.slice(0, LIMITE_ULTIMOS).map(s => ({
    id: s.id,
    usuario_id: maskId(s.usuario_id),
    status: s.status,
    created_at: s.created_at,
    processed_at: s.processed_at,
    transacao_id: s.transacao_id
  }));

  const ordenados = [...rows].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, LIMITE_ULTIMOS);
  report.ultimos_20_mascarados = ordenados.map(s => ({
    id: s.id,
    usuario_id: maskId(s.usuario_id),
    status: s.status,
    created_at: s.created_at,
    processed_at: s.processed_at,
    transacao_id: s.transacao_id,
    amount: s.amount ?? s.valor
  }));

  const outPath = path.join(OUT_DIR, 'final-saques-check.json');
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');
  console.log('OK final saques -> ' + outPath);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
