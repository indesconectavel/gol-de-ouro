/**
 * Fechamento contábil mínimo PRODUÇÃO — SOMENTE LEITURA (SELECT).
 * Pendências PIX, agregação chutes, PIX approved, saques, reconciliação.
 * usuario_id ofuscado (prefixo + últimos 6). Sem PII.
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function maskId(id) {
  if (id == null) return null;
  const s = String(id);
  if (s.length <= 6) return 'u_' + s;
  return 'u_' + s.slice(-6);
}

function ageDays(createdAt) {
  if (!createdAt) return null;
  const d = (Date.now() - new Date(createdAt).getTime()) / (24 * 60 * 60 * 1000);
  return Math.floor(d);
}

function band(days) {
  if (days <= 1) return '0-1d';
  if (days <= 7) return '2-7d';
  if (days <= 30) return '8-30d';
  return '31+d';
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(JSON.stringify({ error: 'SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes' }));
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const report = {
  timestamp: new Date().toISOString(),
  A_pending_pix: { total: 0, por_faixa: {}, top20_antigos: [] },
  B_jogo_por_usuario: [],
  C_pix_approved_por_usuario: [],
  D_saques_por_usuario: [],
  E_recon: { top20_abs_diferenca: [], count_diferenca_gt_001: 0, faixas: { '0-10': 0, '10-50': 0, '50-200': 0, '200+': 0 } },
  erros: []
};
let pixByUser = {};
let byUser = {};
let saqByUser = {};

async function run() {
  try {
    // ——— A) Pendências PIX ———
    const { data: pendingRows, error: ep } = await supabase
      .from('pagamentos_pix')
      .select('id, usuario_id, status, valor, amount, created_at, updated_at, external_id, payment_id')
      .eq('status', 'pending');
    if (ep) report.erros.push({ A: ep.message });
    else if (pendingRows && pendingRows.length) {
      report.A_pending_pix.total = pendingRows.length;
      const faixa = {};
      pendingRows.forEach(r => {
        const d = ageDays(r.created_at);
        const b = band(d);
        faixa[b] = (faixa[b] || 0) + 1;
      });
      report.A_pending_pix.por_faixa = faixa;
      const sorted = [...pendingRows].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      report.A_pending_pix.top20_antigos = sorted.slice(0, 20).map(r => ({
        id: r.id,
        usuario_id: maskId(r.usuario_id),
        created_at: r.created_at,
        valor: r.valor ?? r.amount,
        external_id: r.external_id ? String(r.external_id).slice(0, 50) + (String(r.external_id).length > 50 ? '...' : '') : null,
        payment_id: r.payment_id ? String(r.payment_id).slice(0, 30) + (String(r.payment_id).length > 30 ? '...' : '') : null
      }));
    }

    // ——— Chutes (todas as colunas possíveis) ———
    const { data: chutesRows, error: ec } = await supabase.from('chutes').select('*');
    if (ec) report.erros.push({ chutes: ec.message });
    const chutes = chutesRows || [];
    const hasResultado = chutes.length === 0 || chutes[0].resultado !== undefined;
    const hasResult = chutes.length === 0 || chutes[0].result !== undefined;
    const resultField = hasResultado ? 'resultado' : (hasResult ? 'result' : null);
    const hasValorAposta = chutes.length === 0 || chutes[0].valor_aposta != null;
    const hasPremio = chutes.length === 0 || chutes[0].premio != null;
    const hasPremioGolDeOuro = chutes.length === 0 || chutes[0].premio_gol_de_ouro != null;

    byUser = {};
    chutes.forEach(c => {
      const uid = c.usuario_id;
      if (!byUser[uid]) byUser[uid] = { total_chutes: 0, total_apostas: 0, gols: 0, total_premios: 0, saldo_delta_teorico_jogo: null };
      byUser[uid].total_chutes++;
      const aposta = hasValorAposta ? Number(c.valor_aposta || 0) : 0;
      byUser[uid].total_apostas += aposta;
      const isGoal = (resultField && (c[resultField] === 'goal' || c[resultField] === 'gol'));
      if (isGoal) byUser[uid].gols++;
      const premio = hasPremio ? Number(c.premio || 0) : 0;
      const premioGo = hasPremioGolDeOuro ? Number(c.premio_gol_de_ouro || 0) : 0;
      byUser[uid].total_premios += premio + premioGo;
      if (hasValorAposta && (hasPremio || hasPremioGolDeOuro)) {
        if (byUser[uid].saldo_delta_teorico_jogo == null) byUser[uid].saldo_delta_teorico_jogo = 0;
        byUser[uid].saldo_delta_teorico_jogo += isGoal ? (-aposta + premio + premioGo) : (-aposta);
      }
    });
    report.B_jogo_por_usuario = Object.entries(byUser).map(([uid, v]) => ({
      usuario_id: maskId(uid),
      ...v
    }));

    // ——— C) PIX approved por usuario ———
    const { data: pixApproved, error: epix } = await supabase
      .from('pagamentos_pix')
      .select('usuario_id, valor, amount')
      .eq('status', 'approved');
    if (epix) report.erros.push({ pix_approved: epix.message });
    else {
      pixByUser = {};
      (pixApproved || []).forEach(r => {
        const uid = r.usuario_id;
        if (!pixByUser[uid]) pixByUser[uid] = { total_pix_approved: 0, qtd_pix_approved: 0 };
        pixByUser[uid].total_pix_approved += Number(r.valor ?? r.amount ?? 0);
        pixByUser[uid].qtd_pix_approved++;
      });
      report.C_pix_approved_por_usuario = Object.entries(pixByUser).map(([uid, v]) => ({
        usuario_id: maskId(uid),
        ...v
      }));
    }

    // ——— D) Saques por usuario e status ———
    const { data: saquesRows, error: es } = await supabase.from('saques').select('usuario_id, valor, amount, status');
    if (es) report.erros.push({ saques: es.message });
    else {
      saqByUser = {};
      (saquesRows || []).forEach(r => {
        const uid = r.usuario_id;
        const v = Number(r.valor ?? r.amount ?? 0);
        if (!saqByUser[uid]) saqByUser[uid] = { por_status: {}, total_cancelado: 0, total_confirmado: 0 };
        const st = String(r.status || '').toLowerCase();
        saqByUser[uid].por_status[st] = (saqByUser[uid].por_status[st] || 0) + v;
        if (st === 'cancelado' || st === 'cancelled' || st === 'rejeitado') saqByUser[uid].total_cancelado += v;
        else if (st === 'processado' || st === 'concluido' || st === 'confirmado' || st === 'pago') saqByUser[uid].total_confirmado += v;
      });
      report.D_saques_por_usuario = Object.entries(saqByUser).map(([uid, v]) => ({
        usuario_id: maskId(uid),
        ...v
      }));
    }

    // ——— E) Reconciliação: usar mapas por id real (pixByUser, byUser, saqByUser já têm id real) ———
    const { data: usuariosRows, error: eu } = await supabase.from('usuarios').select('id, saldo');
    if (eu) report.erros.push({ usuarios: eu.message });
    const usuarios = usuariosRows || [];
    const pixMap = {};
    Object.entries(pixByUser || {}).forEach(([uid, v]) => { pixMap[uid] = v.total_pix_approved; });
    const jogoMap = {};
    Object.entries(byUser || {}).forEach(([uid, v]) => { jogoMap[uid] = v.saldo_delta_teorico_jogo; });
    const saqMap = {};
    Object.entries(saqByUser || {}).forEach(([uid, v]) => { saqMap[uid] = v.total_confirmado || 0; });

    const reconList = [];
    usuarios.forEach(u => {
      const saldoAtual = Number(u.saldo || 0);
      const pix = pixMap[u.id] ?? 0;
      const jogoDelta = jogoMap[u.id] !== undefined && jogoMap[u.id] !== null ? jogoMap[u.id] : null;
      const saquesConfirmados = saqMap[u.id] ?? 0;
      let saldoTeoricoMin = pix - saquesConfirmados;
      if (jogoDelta != null) saldoTeoricoMin = pix + jogoDelta - saquesConfirmados;
      const diferenca = saldoAtual - saldoTeoricoMin;
      reconList.push({
        usuario_id: maskId(u.id),
        saldo_atual: saldoAtual,
        pix,
        jogo_delta: jogoDelta,
        saques_confirmados: saquesConfirmados,
        saldo_teorico_min: saldoTeoricoMin,
        diferenca
      });
    });

    const withDiff = reconList.filter(r => Math.abs(r.diferenca) > 0.01);
    report.E_recon.count_diferenca_gt_001 = withDiff.length;
    const top20 = [...reconList].sort((a, b) => Math.abs(b.diferenca) - Math.abs(a.diferenca)).slice(0, 20);
    report.E_recon.top20_abs_diferenca = top20.map(r => ({
      usuario_id: r.usuario_id,
      saldo_atual: r.saldo_atual,
      saldo_teorico_min: r.saldo_teorico_min,
      diferenca: r.diferenca,
      pix: r.pix,
      jogo_delta: r.jogo_delta,
      saques_confirmados: r.saques_confirmados
    }));
    withDiff.forEach(r => {
      const abs = Math.abs(r.diferenca);
      if (abs < 10) report.E_recon.faixas['0-10']++;
      else if (abs < 50) report.E_recon.faixas['10-50']++;
      else if (abs < 200) report.E_recon.faixas['50-200']++;
      else report.E_recon.faixas['200+']++;
    });

    report._meta_chutes = { resultField, hasValorAposta, hasPremio, hasPremioGolDeOuro, total_rows: chutes.length };
  } catch (err) {
    report.erros.push({ run: err.message });
  }
  console.log(JSON.stringify(report, null, 2));
}

run();
