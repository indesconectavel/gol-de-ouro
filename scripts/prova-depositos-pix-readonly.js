/**
 * AUDITORIA READ-ONLY: Depósitos PIX — contagem por status, duplicidade external_id/payment_id,
 * external_id não numérico, amostra últimas 50 (mascarada).
 * Salva docs/relatorios/prova-depositos-pix-readonly-YYYY-MM-DD.json
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.join(__dirname, '..', 'docs', 'relatorios');
const TS = new Date().toISOString().slice(0, 10);

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
    contagem_por_status: [],
    duplicidade_external_id: [],
    duplicidade_payment_id: [],
    external_id_nao_numerico: { count: 0, amostra: [] },
    ultimas_50_mascaradas: [],
    erros: []
  };

  const { data: all, error: e1 } = await supabase.from('pagamentos_pix').select('id, status, external_id, payment_id, usuario_id, valor, amount, created_at');
  if (e1) {
    report.erros.push({ step: 'all', msg: e1.message });
    const outPath = path.join(OUT_DIR, `prova-depositos-pix-readonly-${TS}.json`);
    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');
    console.log('OK prova depositos (com erros) -> ' + outPath);
    return;
  }
  const rows = all || [];

  const byStatus = {};
  rows.forEach(r => { byStatus[r.status] = (byStatus[r.status] || 0) + 1; });
  report.contagem_por_status = Object.entries(byStatus).map(([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count);

  const byExt = {};
  rows.forEach(r => {
    const ext = r.external_id != null ? String(r.external_id) : null;
    if (ext == null) return;
    if (!byExt[ext]) byExt[ext] = 0;
    byExt[ext]++;
  });
  report.duplicidade_external_id = Object.entries(byExt).filter(([, c]) => c > 1).map(([k, c]) => ({ external_id: maskId(k), count: c }));

  const byPid = {};
  rows.forEach(r => {
    const pid = r.payment_id != null ? String(r.payment_id) : null;
    if (pid == null) return;
    if (!byPid[pid]) byPid[pid] = 0;
    byPid[pid]++;
  });
  report.duplicidade_payment_id = Object.entries(byPid).filter(([, c]) => c > 1).map(([k, c]) => ({ payment_id: maskId(k), count: c }));

  const naoNumerico = rows.filter(r => {
    const ext = r.external_id != null ? String(r.external_id) : '';
    return ext && !/^\d+$/.test(ext.trim());
  });
  report.external_id_nao_numerico.count = naoNumerico.length;
  report.external_id_nao_numerico.amostra = naoNumerico.slice(0, 10).map(r => ({
    id: r.id,
    status: r.status,
    external_id_kind: 'string',
    created_at: r.created_at
  }));

  const ordenados = [...rows].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 50);
  report.ultimas_50_mascaradas = ordenados.map(r => ({
    id: r.id,
    status: r.status,
    created_at: r.created_at,
    external_id_kind: /^\d+$/.test(String(r.external_id || '')) ? 'numeric' : 'string',
    usuario_id: typeof r.usuario_id === 'string' ? maskId(r.usuario_id) : r.usuario_id,
    amount: r.amount ?? r.valor
  }));

  const outPath = path.join(OUT_DIR, `prova-depositos-pix-readonly-${TS}.json`);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');
  console.log('OK prova depositos -> ' + outPath);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
