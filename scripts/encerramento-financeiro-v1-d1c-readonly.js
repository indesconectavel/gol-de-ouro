/**
 * Encerramento Financeiro V1 + D1c — READ-ONLY.
 * FASE 0: Precheck tokens MP.
 * FASE 1: D1c — 20 pendings x MP (classificação documental).
 * FASE 2: Verificações cruzadas de risco (somente SELECT).
 * Nenhuma escrita; nenhum side-effect.
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
    status[name] = (val != null && String(val).trim() !== '') ? 'PRESENTE' : 'AUSENTE';
    if (status[name] === 'PRESENTE') anyPresent = true;
  }
  return { status, anyPresent };
}

function maskId(id) {
  if (id == null) return null;
  const s = String(id);
  return s.length <= 6 ? 'u_' + s : 'u_' + s.slice(-6);
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
    if (resp.status !== 200) return { status: null, status_detail: null, err: resp.status };
    const d = resp.data || {};
    return { status: d.status || null, status_detail: d.status_detail || null, err: null };
  } catch (e) {
    return { status: null, status_detail: null, err: e.code || 'request_failed' };
  }
}

const report = {
  timestamp: new Date().toISOString(),
  FASE0_precheck: { tokens: {}, token_usable: false },
  FASE1_D1c: {
    status: null,
    pendings: [],
    classificacao: { OK_ABANDONO: 0, BUG_RECON: 0, INDETERMINADO: 0 },
    resumo: {}
  },
  FASE2_cruzamento: {
    payment_id_approved_duplicado: { encontrado: false, detalhe: null },
    external_id_mais_um_approved: { encontrado: false, detalhe: null },
    usuarios_saldo_negativo: { encontrado: false, total: 0, amostra: [] },
    saques_confirmados_sem_lastro: { encontrado: false, detalhe: [] },
    alertas: []
  },
  erros: []
};

async function run() {
  report.FASE0_precheck.tokens = precheckToken().status;
  report.FASE0_precheck.token_usable = Object.values(report.FASE0_precheck.tokens).some(v => v === 'PRESENTE');

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    report.erros.push('SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes');
    console.log(JSON.stringify(report, null, 2));
    return;
  }
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // ——— FASE 1 ——— D1c
  const token = report.FASE0_precheck.token_usable ? getMpToken() : null;
  report.FASE1_D1c.status = token ? 'EXECUTADO' : 'BLOQUEADO';

  if (token) {
    const { data: pendings, error: ep } = await supabase
      .from('pagamentos_pix')
      .select('id, usuario_id, created_at, updated_at, external_id, payment_id, valor, amount')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(20);
    if (ep) report.erros.push({ D1c: ep.message });
    const list = pendings || [];
    for (const row of list) {
      const v = row.valor ?? row.amount;
      const idBanco = row.id ? String(row.id).slice(0, 8) + '…' : null;
      const paymentId = row.payment_id != null ? String(row.payment_id).trim() : null;
      const externalId = row.external_id != null ? String(row.external_id).trim() : null;
      const mpId = /^\d+$/.test(paymentId) ? paymentId : (/^\d+$/.test(externalId) ? externalId : null);
      let statusMp = null, detailMp = null, classificacao = 'INDETERMINADO';
      if (mpId) {
        const mp = await getPaymentStatusMp(mpId, token);
        statusMp = mp.status;
        detailMp = mp.status_detail;
        if (mp.err) classificacao = 'INDETERMINADO';
        else if (statusMp === 'approved' || statusMp === 'credited') classificacao = 'BUG_RECON';
        else classificacao = 'OK_ABANDONO';
      }
      report.FASE1_D1c.pendings.push({
        id: idBanco,
        usuario_id: maskId(row.usuario_id),
        idade_dias: ageDays(row.created_at),
        v,
        status_banco: 'pending',
        status_MP: statusMp,
        detail_MP: detailMp,
        classificacao
      });
      report.FASE1_D1c.classificacao[classificacao]++;
    }
    report.FASE1_D1c.resumo = {
      total_consultados: list.length,
      OK_ABANDONO: report.FASE1_D1c.classificacao.OK_ABANDONO,
      BUG_RECON: report.FASE1_D1c.classificacao.BUG_RECON,
      INDETERMINADO: report.FASE1_D1c.classificacao.INDETERMINADO
    };
  }

  // ——— FASE 2 ——— Verificações cruzadas
  const { data: pixAll } = await supabase.from('pagamentos_pix').select('payment_id, external_id, status, usuario_id, valor, amount');
  const rows = pixAll || [];
  const byPaymentId = {};
  const byExternalId = {};
  rows.forEach(r => {
    if (r.status === 'approved') {
      const pid = r.payment_id != null ? String(r.payment_id) : null;
      const eid = r.external_id != null ? String(r.external_id) : null;
      if (pid) { byPaymentId[pid] = (byPaymentId[pid] || 0) + 1; }
      if (eid) { byExternalId[eid] = (byExternalId[eid] || 0) + 1; }
    }
  });
  const dupPaymentId = Object.entries(byPaymentId).filter(([, c]) => c > 1);
  const dupExternalId = Object.entries(byExternalId).filter(([, c]) => c > 1);
  report.FASE2_cruzamento.payment_id_approved_duplicado.encontrado = dupPaymentId.length > 0;
  report.FASE2_cruzamento.payment_id_approved_duplicado.detalhe = dupPaymentId.length ? { quantidade_chaves_duplicadas: dupPaymentId.length } : null;
  report.FASE2_cruzamento.external_id_mais_um_approved.encontrado = dupExternalId.length > 0;
  report.FASE2_cruzamento.external_id_mais_um_approved.detalhe = dupExternalId.length ? { quantidade_chaves_duplicadas: dupExternalId.length } : null;
  if (dupPaymentId.length) report.FASE2_cruzamento.alertas.push('payment_id aprovado duplicado');
  if (dupExternalId.length) report.FASE2_cruzamento.alertas.push('external_id com mais de um approved');

  const { data: negativos } = await supabase.from('usuarios').select('id, saldo').lt('saldo', 0);
  const neg = negativos || [];
  report.FASE2_cruzamento.usuarios_saldo_negativo.total = neg.length;
  report.FASE2_cruzamento.usuarios_saldo_negativo.encontrado = neg.length > 0;
  report.FASE2_cruzamento.usuarios_saldo_negativo.amostra = neg.slice(0, 10).map(u => ({ id: maskId(u.id), saldo: u.saldo }));
  if (neg.length) report.FASE2_cruzamento.alertas.push('usuarios com saldo negativo');

  const { data: saquesRows } = await supabase.from('saques').select('usuario_id, valor, amount, status');
  const statusConfirmado = ['processado', 'concluido', 'confirmado', 'pago', 'completed'];
  const saquesConfirmadosPorUser = {};
  (saquesRows || []).forEach(s => {
    const st = String(s.status || '').toLowerCase();
    if (!statusConfirmado.some(t => st.includes(t))) return;
    const uid = s.usuario_id;
    const val = Number(s.valor ?? s.amount ?? 0);
    saquesConfirmadosPorUser[uid] = (saquesConfirmadosPorUser[uid] || 0) + val;
  });
  const pixApprovedPorUser = {};
  rows.filter(r => r.status === 'approved').forEach(r => {
    const uid = r.usuario_id;
    if (!uid) return;
    const val = Number(r.valor ?? r.amount ?? 0);
    pixApprovedPorUser[uid] = (pixApprovedPorUser[uid] || 0) + val;
  });
  const semLastro = [];
  Object.entries(saquesConfirmadosPorUser).forEach(([uid, totalSaque]) => {
    const totalPix = pixApprovedPorUser[uid] || 0;
    if (totalSaque > totalPix) semLastro.push({ usuario_id: maskId(uid), total_saques_confirmados: totalSaque, total_pix_approved: totalPix });
  });
  report.FASE2_cruzamento.saques_confirmados_sem_lastro.encontrado = semLastro.length > 0;
  report.FASE2_cruzamento.saques_confirmados_sem_lastro.detalhe = semLastro.slice(0, 20);
  if (semLastro.length) report.FASE2_cruzamento.alertas.push('saque confirmado sem lastro suficiente em PIX aprovado');

  console.log(JSON.stringify(report, null, 2));
}

run().catch(err => {
  report.erros.push(err.message);
  console.log(JSON.stringify(report, null, 2));
});
