/**
 * Missão D1b + D3 — READ-ONLY.
 * Precheck token MP (só PRESENTE/AUSENTE). D1b: pendings x MP. D3: fechamento jogo via transacoes.
 * Sem PII; sem expor tokens/headers/URLs com segredos.
 */
require('dotenv').config();
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const TOKEN_NAMES = [
  'MERCADOPAGO_DEPOSIT_ACCESS_TOKEN',
  'MERCADOPAGO_ACCESS_TOKEN',
  'MERCADO_PAGO_ACCESS_TOKEN',
  'MP_ACCESS_TOKEN'
];

function precheckToken() {
  const status = {};
  let anyPresent = false;
  for (const name of TOKEN_NAMES) {
    const val = process.env[name];
    const present = val != null && String(val).trim() !== '';
    status[name] = present ? 'PRESENTE' : 'AUSENTE';
    if (present) anyPresent = true;
  }
  return { status, anyPresent };
}

function maskId(id) {
  if (id == null) return null;
  const s = String(id);
  if (s.length <= 6) return 'u_' + s;
  return 'u_' + s.slice(-6);
}

function ageDays(createdAt) {
  if (!createdAt) return null;
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / (24 * 60 * 60 * 1000));
}

function getMpToken() {
  for (const name of TOKEN_NAMES) {
    const val = process.env[name];
    if (val != null && String(val).trim() !== '') return String(val).trim();
  }
  return null;
}

async function getPaymentStatusMp(paymentId, token) {
  if (!token || !paymentId) return { status: null, status_detail: null, err: 'no_token_or_id' };
  const id = String(paymentId).trim();
  if (!/^\d+$/.test(id)) return { status: null, status_detail: null, err: 'invalid_id' };
  try {
    const resp = await axios.get(`https://api.mercadopago.com/v1/payments/${id}`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      timeout: 8000,
      validateStatus: () => true
    });
    if (resp.status !== 200) {
      return { status: null, status_detail: null, err: resp.status };
    }
    const d = resp.data || {};
    return { status: d.status || null, status_detail: d.status_detail || null, err: null };
  } catch (e) {
    return { status: null, status_detail: null, err: e.code || 'request_failed' };
  }
}

const TOL = 0.01;

const report = {
  timestamp: new Date().toISOString(),
  precheck: { tokens: {}, token_usable: false },
  D1b: { status: null, pendings: [], classificacao: { OK_ABANDONO: 0, BUG_RECON: 0, INDETERMINADO: 0 }, resumo: {} },
  D3: {
    volume: { total_transacoes: 0, total_aposta: 0, por_tipo_referencia_status: [] },
    top20_usuarios: [],
    ponta_a_ponta: { ok: 0, alerta: 0, detalhes: [] },
    outliers_divergencia: [],
    usuarios_sem_transacao_saldo_positivo: 0
  },
  erros: []
};

async function run() {
  const pre = precheckToken();
  report.precheck.tokens = pre.status;
  report.precheck.token_usable = pre.anyPresent;

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    report.erros.push('SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes');
    console.log(JSON.stringify(report, null, 2));
    return;
  }
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // ——— D1b ———
  if (!pre.anyPresent) {
    report.D1b.status = 'BLOQUEADO';
  } else {
    report.D1b.status = 'EXECUTADO';
    const token = getMpToken();
    const { data: pendings, error: ep } = await supabase
      .from('pagamentos_pix')
      .select('id, usuario_id, created_at, updated_at, external_id, payment_id, valor, amount')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(20);
    if (ep) report.erros.push({ D1b: ep.message });
    const list = pendings || [];
    for (const row of list) {
      const v = row.valor ?? row.amount;
      const idadeDias = ageDays(row.created_at);
      const idBanco = row.id ? String(row.id).slice(0, 8) + '…' : null;
      let statusMp = null;
      let detailMp = null;
      let classificacao = 'INDETERMINADO';
      const paymentId = row.payment_id != null ? String(row.payment_id).trim() : null;
      const externalId = row.external_id != null ? String(row.external_id).trim() : null;
      const mpId = /^\d+$/.test(paymentId) ? paymentId : (/^\d+$/.test(externalId) ? externalId : null);
      if (mpId) {
        const mp = await getPaymentStatusMp(mpId, token);
        statusMp = mp.status;
        detailMp = mp.status_detail;
        if (mp.err) classificacao = 'INDETERMINADO';
        else if (statusMp === 'approved' || statusMp === 'credited') classificacao = 'BUG_RECON';
        else classificacao = 'OK_ABANDONO';
      }
      report.D1b.pendings.push({
        id: idBanco,
        usuario_id: maskId(row.usuario_id),
        idade_dias: idadeDias,
        v,
        status_banco: 'pending',
        status_MP: statusMp,
        detail_MP: detailMp,
        classificacao
      });
      report.D1b.classificacao[classificacao]++;
    }
    report.D1b.resumo = { total_consultados: list.length, ...report.D1b.classificacao };
  }

  // ——— D3 ———
  const { count: totalTx, error: eCount } = await supabase
    .from('transacoes')
    .select('*', { count: 'exact', head: true });
  report.D3.volume.total_transacoes = eCount ? null : totalTx;

  const { data: apostaRows } = await supabase
    .from('transacoes')
    .select('id, usuario_id, tipo, referencia_tipo, status')
    .eq('referencia_tipo', 'aposta');
  const apostaList = apostaRows || [];
  report.D3.volume.total_aposta = apostaList.length;

  const { data: allTx } = await supabase.from('transacoes').select('tipo, referencia_tipo, status');
  const byGroup = {};
  (allTx || []).forEach(r => {
    const k = `${r.tipo || ''}|${r.referencia_tipo || ''}|${r.status || ''}`;
    byGroup[k] = (byGroup[k] || 0) + 1;
  });
  report.D3.volume.por_tipo_referencia_status = Object.entries(byGroup).map(([k, c]) => {
    const [tipo, ref, status] = k.split('|');
    return { tipo, referencia_tipo: ref, status, count: c };
  }).sort((a, b) => b.count - a.count);

  const byUser = {};
  apostaList.forEach(r => {
    const uid = r.usuario_id;
    if (!byUser[uid]) byUser[uid] = 0;
    byUser[uid]++;
  });
  const top20UserIds = Object.entries(byUser)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([uid]) => uid);

  for (const userId of top20UserIds) {
    const { data: txs } = await supabase
      .from('transacoes')
      .select('id, usuario_id, valor, saldo_anterior, saldo_posterior, created_at')
      .eq('usuario_id', userId)
      .eq('referencia_tipo', 'aposta')
      .order('created_at', { ascending: true })
      .limit(200);
    const arr = txs || [];
    let incSeq = 0;
    let incDelta = 0;
    for (let i = 0; i < arr.length - 1; i++) {
      const cur = arr[i];
      const next = arr[i + 1];
      const diffSeq = Math.abs(Number(next.saldo_anterior) - Number(cur.saldo_posterior));
      if (diffSeq > TOL) incSeq++;
      const delta = Number(cur.saldo_posterior) - Number(cur.saldo_anterior);
      const diffVal = Math.abs(delta - Number(cur.valor));
      if (diffVal > TOL) incDelta++;
    }
    report.D3.top20_usuarios.push({
      usuario_id: maskId(userId),
      total_apostas: arr.length,
      total_inconsistencias_sequencia: incSeq,
      total_inconsistencias_delta: incDelta,
      primeira_data: arr.length ? arr[0].created_at : null,
      ultima_data: arr.length ? arr[arr.length - 1].created_at : null
    });
  }

  const { data: usuarios } = await supabase.from('usuarios').select('id, saldo');
  const userIdsWithAposta = new Set(apostaList.map(r => r.usuario_id));
  const { data: allApostaTx } = await supabase
    .from('transacoes')
    .select('usuario_id, saldo_posterior, created_at')
    .eq('referencia_tipo', 'aposta');
  const lastMap = {};
  (allApostaTx || []).forEach(r => {
    const uid = r.usuario_id;
    if (!lastMap[uid] || (r.created_at > (lastMap[uid].created_at || ''))) lastMap[uid] = r;
  });

  let ok = 0, alerta = 0;
  const divergencias = [];
  for (const u of usuarios || []) {
    const last = lastMap[u.id];
    if (!last) continue;
    const saldoAtual = Number(u.saldo || 0);
    const saldoPost = Number(last.saldo_posterior || 0);
    const diff = Math.abs(saldoAtual - saldoPost);
    if (diff <= TOL) {
      ok++;
    } else {
      alerta++;
      report.D3.ponta_a_ponta.detalhes.push({
        usuario_id: maskId(u.id),
        resultado: 'ALERTA',
        saldo_atual: saldoAtual,
        saldo_posterior_ultima_tx: saldoPost,
        diferenca: saldoAtual - saldoPost
      });
      divergencias.push({ usuario_id: u.id, mask: maskId(u.id), diff: Math.abs(saldoAtual - saldoPost), saldo_atual: saldoAtual, saldo_posterior: saldoPost });
    }
  }
  report.D3.ponta_a_ponta.ok = ok;
  report.D3.ponta_a_ponta.alerta = alerta;

  divergencias.sort((a, b) => b.diff - a.diff);
  report.D3.outliers_divergencia = divergencias.slice(0, 20).map(d => ({
    usuario_id: d.mask,
    diferenca_abs: d.diff,
    saldo_atual: d.saldo_atual,
    saldo_posterior_ultima_tx: d.saldo_posterior
  }));

  let semTxSaldoPos = 0;
  for (const u of usuarios || []) {
    if (userIdsWithAposta.has(u.id)) continue;
    if (Number(u.saldo || 0) > 0) semTxSaldoPos++;
  }
  report.D3.usuarios_sem_transacao_saldo_positivo = semTxSaldoPos;

  console.log(JSON.stringify(report, null, 2));
}

run().catch(err => {
  report.erros.push(err.message);
  console.log(JSON.stringify(report, null, 2));
});
