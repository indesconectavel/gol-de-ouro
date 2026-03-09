/**
 * AUDITORIA READ-ONLY: Prova "saldo aumentando" — persistido vs visual.
 * Modo 1: Se BEARER definido — GET /api/user/profile em T0, T+10s, T+40s; registra saldo e updated_at.
 * Modo 2: Se BEARER não existir e PROVA_USER_ID existir — polling Supabase usuarios (read-only) a cada 10s por 3 min.
 * Salva docs/relatorios/prova-saldo-persistencia-YYYY-MM-DD.json
 * NÃO imprime token/credenciais.
 */
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const OUT_DIR = path.join(__dirname, '..', 'docs', 'relatorios');
const TS = new Date().toISOString().slice(0, 10);
const BASE = process.env.AUDIT_BASE_URL || 'https://goldeouro-backend-v2.fly.dev';
const bearer = process.env.BEARER;
const provaUserId = process.env.PROVA_USER_ID;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function modoProfile() {
  const points = [];
  for (const delay of [0, 10000, 40000]) {
    if (delay > 0) await sleep(delay);
    const start = Date.now();
    const res = await fetch(BASE + '/api/user/profile', {
      method: 'GET',
      headers: { 'Accept': 'application/json', 'Authorization': bearer }
    });
    const data = await res.json().catch(() => ({}));
    points.push({
      t: delay / 1000,
      saldo: data.saldo ?? data.balance ?? null,
      updated_at: data.updated_at ?? null,
      timestamp: new Date().toISOString(),
      elapsed_ms: Date.now() - start,
      status: res.status
    });
  }
  const saldos = points.map(p => p.saldo).filter(v => v != null);
  const saldo_mudou = saldos.length >= 2 && new Set(saldos.map(Number)).size > 1;
  const delta = saldos.length >= 2 ? (Number(saldos[saldos.length - 1]) - Number(saldos[0])) : null;
  return {
    modo: 'profile_get',
    points,
    saldo_mudou,
    delta,
    provavel_origem: saldo_mudou ? 'backend_persistido' : (saldos.length ? 'visual/cache ou estavel' : 'inconclusivo')
  };
}

function maskId(id) {
  if (id == null) return null;
  const s = String(id);
  return s.length <= 4 ? '***' : '***' + s.slice(-4);
}

async function modoSupabase(userId) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || !userId) {
    return {
      modo: 'supabase_polling',
      saldo_mudou: null,
      delta: null,
      provavel_origem: 'inconclusivo',
      observacao: 'SUPABASE_URL/SERVICE_ROLE_KEY ou userId ausentes'
    };
  }
  const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const points = [];
  const maxLoops = 18;
  for (let i = 0; i < maxLoops; i++) {
    if (i > 0) await sleep(10000);
    const { data, error } = await supabase
      .from('usuarios')
      .select('saldo, updated_at')
      .eq('id', userId)
      .maybeSingle();
    if (error) {
      points.push({ t: i * 10, error: error.message });
      continue;
    }
    points.push({
      t: i * 10,
      saldo: data?.saldo ?? null,
      updated_at: data?.updated_at ?? null,
      timestamp: new Date().toISOString()
    });
  }
  const saldos = points.map(p => p.saldo).filter(v => v != null);
  const saldo_mudou = saldos.length >= 2 && new Set(saldos.map(Number)).size > 1;
  const delta = saldos.length >= 2 ? (Number(saldos[saldos.length - 1]) - Number(saldos[0])) : null;
  return {
    modo: 'supabase_polling',
    points,
    saldo_mudou,
    delta,
    provavel_origem: saldo_mudou ? 'backend_persistido' : (saldos.length ? 'visual/cache ou estavel' : 'inconclusivo')
  };
}

async function modoGapUser() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return { modo: 'gap_user', saldo_mudou: null, delta: null, provavel_origem: 'inconclusivo', observacao: 'Supabase ausente' };
  }
  const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: users, error: eU } = await supabase.from('usuarios').select('id, saldo');
  if (eU || !users?.length) {
    return { modo: 'gap_user', saldo_mudou: null, delta: null, provavel_origem: 'inconclusivo', observacao: eU?.message || 'sem usuarios' };
  }
  const { data: pix, error: eP } = await supabase.from('pagamentos_pix').select('usuario_id, valor, amount').eq('status', 'approved');
  if (eP) {
    return { modo: 'gap_user', saldo_mudou: null, delta: null, provavel_origem: 'inconclusivo', observacao: eP.message };
  }
  const somaPixByUser = {};
  (pix || []).forEach(r => {
    const uid = r.usuario_id;
    const v = Number(r.valor ?? r.amount ?? 0);
    somaPixByUser[uid] = (somaPixByUser[uid] || 0) + v;
  });
  let maxGap = -Infinity;
  let targetId = null;
  users.forEach(u => {
    const saldo = Number(u.saldo || 0);
    const pixSum = somaPixByUser[u.id] || 0;
    const gap = saldo - pixSum;
    if (gap > maxGap) {
      maxGap = gap;
      targetId = u.id;
    }
  });
  if (targetId == null) targetId = users[0]?.id;
  return await modoSupabase(targetId);
}

async function run() {
  let result;
  if (bearer) {
    result = await modoProfile();
  } else if (provaUserId) {
    result = await modoSupabase(provaUserId);
  } else {
    result = await modoGapUser();
  }
  const report = {
    timestamp: new Date().toISOString(),
    bearer_defined: !!bearer,
    prova_user_id_defined: !!provaUserId,
    ...result
  };
  const outPath = path.join(OUT_DIR, `prova-saldo-persistencia-${TS}.json`);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');
  console.log('OK prova saldo -> ' + outPath);
  if (process.env.CICLO1 === '1') {
    const ciclo1Path = path.join(OUT_DIR, 'ciclo1-saldo-prova.json');
    fs.writeFileSync(ciclo1Path, JSON.stringify(report, null, 2), 'utf8');
    console.log('OK ciclo1 -> ' + ciclo1Path);
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
