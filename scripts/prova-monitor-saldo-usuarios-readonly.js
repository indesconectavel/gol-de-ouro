/**
 * READ-ONLY: Monitor de saldo por polling no banco (3 min, a cada 10s).
 * Não imprime SUPABASE_URL nem SERVICE_ROLE_KEY.
 * USER_ID: PROVA_USER_ID ou usuário com maior |saldo_atual - soma_pix_approved|.
 * Saída: docs/relatorios/prova-monitor-saldo-output-YYYY-MM-DD.json
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PROVA_USER_ID = process.env.PROVA_USER_ID ? String(process.env.PROVA_USER_ID).trim() : null;
const INTERVAL_MS = 10 * 1000;
const DURATION_MS = 3 * 60 * 1000;
const NUM_SAMPLES = Math.floor(DURATION_MS / INTERVAL_MS);

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.log(JSON.stringify({ error: 'SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes', timestamp: new Date().toISOString() }));
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

function getOutputPath() {
  const d = new Date();
  const Y = d.getFullYear();
  const M = String(d.getMonth() + 1).padStart(2, '0');
  const D = String(d.getDate()).padStart(2, '0');
  const base = path.join(process.cwd(), 'docs', 'relatorios');
  if (!fs.existsSync(base)) fs.mkdirSync(base, { recursive: true });
  return path.join(base, `prova-monitor-saldo-output-${Y}-${M}-${D}.json`);
}

async function getCandidateUserId() {
  if (PROVA_USER_ID) return PROVA_USER_ID;
  const { data: allApproved } = await supabase
    .from('pagamentos_pix')
    .select('usuario_id, valor, amount')
    .eq('status', 'approved');
  const { data: users } = await supabase.from('usuarios').select('id, saldo');
  if (!users || !users.length) return null;
  const pixByUser = {};
  (allApproved || []).forEach(row => {
    const uid = row.usuario_id;
    const v = Number(row.amount ?? row.valor ?? 0);
    pixByUser[uid] = (pixByUser[uid] || 0) + v;
  });
  const diffs = users.map(u => ({
    usuario_id: u.id,
    saldo_atual: Number(u.saldo || 0),
    soma_pix: pixByUser[u.id] || 0,
    diferenca: Number(u.saldo || 0) - (pixByUser[u.id] || 0)
  })).filter(d => true);
  diffs.sort((a, b) => Math.abs(b.diferenca) - Math.abs(a.diferenca));
  return diffs.length ? diffs[0].usuario_id : (users[0] && users[0].id) || null;
}

async function sampleSaldo(userId) {
  const { data, error } = await supabase
    .from('usuarios')
    .select('id, saldo, updated_at')
    .eq('id', userId)
    .maybeSingle();
  if (error) return { error: error.message, saldo: null, updated_at: null };
  const row = data || {};
  return {
    saldo: row.saldo != null ? Number(row.saldo) : null,
    updated_at: row.updated_at || null,
    error: null
  };
}

async function run() {
  const startedAt = new Date().toISOString();
  const userId = await getCandidateUserId();
  if (!userId) {
    const out = { timestamp: startedAt, user_id: null, amostras: [], SALDO_MUDOU: false, delta_total: null, timestamps_mudanca: [], erros: ['nenhum usuario candidato'] };
    const outPath = getOutputPath();
    fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
    console.log('Written:', outPath);
    process.exit(0);
    return;
  }

  const amostras = [];
  for (let i = 0; i < NUM_SAMPLES; i++) {
    const t = new Date().toISOString();
    const s = await sampleSaldo(userId);
    amostras.push({ ts: t, saldo: s.saldo, updated_at: s.updated_at, error: s.error });
    if (i < NUM_SAMPLES - 1) await new Promise(r => setTimeout(r, INTERVAL_MS));
  }

  const saldos = amostras.map(a => a.saldo).filter(v => v != null);
  const primeiro = saldos.length ? saldos[0] : null;
  const ultimo = saldos.length ? saldos[saldos.length - 1] : null;
  const delta_total = (primeiro != null && ultimo != null) ? Math.round((ultimo - primeiro) * 100) / 100 : null;
  const SALDO_MUDOU = delta_total != null && Math.abs(delta_total) > 0.001;

  const timestamps_mudanca = [];
  for (let i = 1; i < amostras.length; i++) {
    const prev = amostras[i - 1].saldo;
    const cur = amostras[i].saldo;
    if (prev != null && cur != null && Math.abs(cur - prev) > 0.001) {
      timestamps_mudanca.push({ from: amostras[i - 1].ts, to: amostras[i].ts, delta: Math.round((cur - prev) * 100) / 100 });
    }
  }

  const out = {
    timestamp: startedAt,
    user_id: userId,
    janela_minutos: 3,
    intervalo_segundos: 10,
    num_amostras: amostras.length,
    amostras,
    primeiro_saldo: primeiro,
    ultimo_saldo: ultimo,
    delta_total,
    SALDO_MUDOU,
    timestamps_mudanca
  };

  const outPath = getOutputPath();
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
  console.log('Written:', outPath);
}

run().catch(err => {
  console.log(JSON.stringify({ error: err?.message || String(err), timestamp: new Date().toISOString() }));
  process.exit(1);
});
