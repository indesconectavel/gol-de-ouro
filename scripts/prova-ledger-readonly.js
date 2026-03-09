/**
 * AUDITORIA READ-ONLY: Ledger 24h/7d/30d — janela via PROVA_LEDGER_JANELA_HORAS (default 24).
 * Detecta coluna usuário (user_id / usuario_id). Agrega por usuário: total_creditos, total_debitos,
 * top tipos/referencias. Suspeitas: repetição (correlation_id, tipo, referencia), créditos sem referencia, microcréditos.
 * Salva docs/relatorios/prova-ledger-readonly-YYYY-MM-DD.json
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.join(__dirname, '..', 'docs', 'relatorios');
const TS = new Date().toISOString().slice(0, 10);
const JANELA_HORAS = Math.max(1, parseInt(process.env.PROVA_LEDGER_JANELA_HORAS || '24', 10));
const CICLO1 = process.env.CICLO1 === '1';

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
    janela_horas: JANELA_HORAS,
    user_column: null,
    por_usuario: [],
    top_tipos: [],
    top_referencias: [],
    suspeitas: {
      repeticao_correlation_tipo_ref: [],
      creditos_sem_referencia: 0,
      microcreditos_sequencia: 0
    },
    erros: []
  };

  const since = new Date(Date.now() - JANELA_HORAS * 60 * 60 * 1000).toISOString();

  const { error: eUser } = await supabase.from('ledger_financeiro').select('user_id').limit(1);
  if (!eUser) {
    report.user_column = 'user_id';
  } else {
    const { error: eUsuario } = await supabase.from('ledger_financeiro').select('usuario_id').limit(1);
    if (!eUsuario) {
      report.user_column = 'usuario_id';
    } else {
      report.erros.push({ step: 'detect_column', msg: eUser.message || 'user_id e usuario_id falharam' });
    }
  }
  const userCol = report.user_column || 'user_id';

  const { data: rows, error: e1 } = await supabase
    .from('ledger_financeiro')
    .select('*')
    .gte('created_at', since);
  if (e1) {
    report.erros.push({ step: 'ledger_select', msg: e1.message });
    const outPath = path.join(OUT_DIR, `prova-ledger-readonly-${TS}.json`);
    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');
    if (CICLO1) fs.writeFileSync(path.join(OUT_DIR, 'ciclo1-ledger-prova.json'), JSON.stringify(report, null, 2), 'utf8');
    console.log('OK prova ledger (com erros) -> ' + outPath);
    return;
  }
  const list = rows || [];

  const byUser = {};
  const byTipo = {};
  const byRef = {};
  const correlationSet = new Set();
  const correlationRep = [];

  list.forEach(r => {
    const uid = r[userCol] ?? r.usuario_id ?? r.user_id;
    if (uid != null) {
      if (!byUser[uid]) byUser[uid] = { creditos: 0, debitos: 0 };
      const val = Number(r.valor ?? r.amount ?? 0);
      if (val > 0) byUser[uid].creditos += val;
      else byUser[uid].debitos += Math.abs(val);
    }
    const tipo = r.tipo || 'unknown';
    byTipo[tipo] = (byTipo[tipo] || 0) + 1;
    const ref = r.referencia || 'null';
    byRef[ref] = (byRef[ref] || 0) + 1;
    const key = `${r.correlation_id || ''}|${tipo}|${ref}`;
    if (key !== '|unknown|null') {
      if (correlationSet.has(key)) correlationRep.push({ correlation_id: r.correlation_id, tipo, referencia: ref });
      else correlationSet.add(key);
    }
  });

  report.por_usuario = Object.entries(byUser).map(([uid, v]) => ({
    usuario_id: maskId(uid),
    total_creditos: v.creditos,
    total_debitos: v.debitos
  })).sort((a, b) => (b.total_creditos + b.total_debitos) - (a.total_creditos + a.total_debitos)).slice(0, 50);

  report.top_tipos = Object.entries(byTipo).map(([tipo, count]) => ({ tipo, count })).sort((a, b) => b.count - a.count).slice(0, 20);
  report.top_referencias = Object.entries(byRef).map(([ref, count]) => ({ referencia: ref, count })).sort((a, b) => b.count - a.count).slice(0, 20);
  report.suspeitas.repeticao_correlation_tipo_ref = correlationRep.slice(0, 20);
  report.suspeitas.creditos_sem_referencia = list.filter(r => (Number(r.valor ?? r.amount ?? 0) > 0) && !(r.referencia && String(r.referencia).trim())).length;
  const vals = list.map(r => Number(r.valor ?? r.amount ?? 0)).filter(v => v > 0 && v < 1);
  report.suspeitas.microcreditos_sequencia = vals.length;

  const outPath = path.join(OUT_DIR, `prova-ledger-readonly-${TS}.json`);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');
  console.log('OK prova ledger -> ' + outPath);
  if (CICLO1) {
    const ciclo1Path = path.join(OUT_DIR, 'ciclo1-ledger-prova.json');
    fs.writeFileSync(ciclo1Path, JSON.stringify(report, null, 2), 'utf8');
    console.log('OK ciclo1 -> ' + ciclo1Path);
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
