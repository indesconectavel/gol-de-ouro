/**
 * Missão D1+D2 — READ-ONLY.
 * D1: Pendings antigos x status real no Mercado Pago (GET).
 * D2: Onde o jogo registra histórico (introspecção tabelas + transacoes).
 * Sem PII; usuario_id ofuscado; não imprimir tokens/URLs com segredos.
 */
require('dotenv').config();
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MP_TOKEN = process.env.MERCADOPAGO_DEPOSIT_ACCESS_TOKEN || process.env.MERCADO_PAGO_ACCESS_TOKEN;

function maskId(id) {
  if (id == null) return null;
  const s = String(id);
  if (s.length <= 6) return 'u_' + s;
  return 'u_' + s.slice(-6);
}
function maskPixId(id) {
  if (id == null) return null;
  const s = String(id);
  if (s.length <= 8) return s;
  return s.slice(0, 4) + '…' + s.slice(-4);
}

function ageDays(createdAt) {
  if (!createdAt) return null;
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / (24 * 60 * 60 * 1000));
}

async function getPaymentStatusMp(paymentId) {
  if (!MP_TOKEN || !paymentId) return { status: null, status_detail: null, err: 'no_token_or_id' };
  const id = String(paymentId).trim();
  if (!/^\d+$/.test(id)) return { status: null, status_detail: null, err: 'invalid_id' };
  try {
    const resp = await axios.get(`https://api.mercadopago.com/v1/payments/${id}`, {
      headers: { Authorization: `Bearer ${MP_TOKEN}`, 'Content-Type': 'application/json' },
      timeout: 8000,
      validateStatus: () => true
    });
    if (resp.status !== 200) {
      return { status: null, status_detail: null, err: resp.status, status_detail_mp: resp.data?.message || resp.data?.error };
    }
    const d = resp.data || {};
    return { status: d.status || null, status_detail: d.status_detail || null, err: null };
  } catch (e) {
    return { status: null, status_detail: null, err: e.code || 'request_failed', message: e.message };
  }
}

const report = {
  timestamp: new Date().toISOString(),
  D1: { pendings: [], classificacao: { OK_ABANDONO: 0, BUG_RECON: 0, INDETERMINADO: 0 }, resumo: [] },
  D2: { tabelas: {}, chutes_diagnostico: {}, transacoes_por_tipo: [], transacoes_amostra: [], conclusao_origem_jogo: null },
  erros: []
};

async function run() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    report.erros.push('SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes');
    console.log(JSON.stringify(report, null, 2));
    return;
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

  // ——— D1: 20 pendings mais antigos ———
  const { data: pendings, error: ep } = await supabase
    .from('pagamentos_pix')
    .select('id, usuario_id, created_at, updated_at, external_id, payment_id, valor, amount')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(20);
  if (ep) report.erros.push({ D1: ep.message });
  const list = pendings || [];

  for (const row of list) {
    const v = row.valor ?? row.amount;
    const idadeDias = ageDays(row.created_at);
    const idBanco = row.id ? String(row.id).slice(0, 8) + '…' : null;
    let statusMp = null;
    let statusDetailMp = null;
    let classificacao = 'INDETERMINADO';
    const paymentId = row.payment_id != null ? String(row.payment_id).trim() : null;
    const externalId = row.external_id != null ? String(row.external_id).trim() : null;
    const mpId = /^\d+$/.test(paymentId) ? paymentId : (/^\d+$/.test(externalId) ? externalId : null);

    if (mpId) {
      const mp = await getPaymentStatusMp(mpId);
      statusMp = mp.status;
      statusDetailMp = mp.status_detail;
      if (mp.err) classificacao = 'INDETERMINADO';
      else if (statusMp === 'approved') classificacao = 'BUG_RECON';
      else if (['expired', 'cancelled', 'rejected', 'cancelled'].includes(statusMp) || (statusMp && statusMp !== 'pending' && statusMp !== 'in_process')) classificacao = 'OK_ABANDONO';
      else if (['pending', 'in_process', 'in_mediation'].includes(statusMp)) classificacao = 'OK_ABANDONO';
      else classificacao = 'INDETERMINADO';
    }

    report.D1.pendings.push({
      id: idBanco,
      usuario_id: maskId(row.usuario_id),
      idade_dias: idadeDias,
      v,
      status_no_banco: 'pending',
      status_no_MP: statusMp,
      status_detail_no_MP: statusDetailMp,
      updated_at: row.updated_at,
      classificacao
    });
    if (classificacao === 'OK_ABANDONO') report.D1.classificacao.OK_ABANDONO++;
    else if (classificacao === 'BUG_RECON') report.D1.classificacao.BUG_RECON++;
    else report.D1.classificacao.INDETERMINADO++;
  }
  report.D1.resumo = { total_consultados: list.length, OK_ABANDONO: report.D1.classificacao.OK_ABANDONO, BUG_RECON: report.D1.classificacao.BUG_RECON, INDETERMINADO: report.D1.classificacao.INDETERMINADO };

  // ——— D2: Introspecção ———
  const tabelasTeste = ['chutes', 'transacoes', 'lotes', 'partidas'];
  for (const tabela of tabelasTeste) {
    const { count: countVal, error: ec } = await supabase.from(tabela).select('*', { count: 'exact', head: true });
    let amostra = [];
    if (!ec) {
      const { data: rows } = await supabase.from(tabela).select('*').limit(3);
      if (rows && rows.length) {
        amostra = rows.map(r => {
          const safe = {};
          for (const [k, v] of Object.entries(r)) {
            if (k === 'usuario_id' || k === 'user_id') safe[k] = maskId(v);
            else if (typeof v === 'string' && (v.includes('@') || v.length > 50)) safe[k] = '[redacted]';
            else safe[k] = v;
          }
          return safe;
        });
      }
    }
    report.D2.tabelas[tabela] = { count: ec ? null : countVal, error: ec ? ec.message : null, amostra };
  }

  report.D2.chutes_diagnostico = report.D2.tabelas.chutes || {};
  const { data: transAll } = await supabase.from('transacoes').select('tipo');
  const byTipo = {};
  (transAll || []).forEach(r => { byTipo[r.tipo] = (byTipo[r.tipo] || 0) + 1; });
  report.D2.transacoes_por_tipo = Object.entries(byTipo).map(([tipo, count]) => ({ tipo, count })).sort((a, b) => b.count - a.count);

  const { data: transSample } = await supabase.from('transacoes').select('*').order('created_at', { ascending: false }).limit(5);
  report.D2.transacoes_amostra = (transSample || []).map(r => {
    const safe = {};
    for (const [k, v] of Object.entries(r)) {
      if (k === 'usuario_id') safe[k] = maskId(v);
      else if (k === 'descricao' || k === 'referencia' || k === 'metadata') safe[k] = v;
      else safe[k] = v;
    }
    return safe;
  });

  if (report.D2.tabelas.chutes && report.D2.tabelas.chutes.count === 0 && (byTipo.debito || byTipo.aposta)) {
    report.D2.conclusao_origem_jogo = 'Em produção chutes tem 0 linhas; movimentos de jogo (débitos) aparecem em transacoes. Origem do histórico de jogo neste ambiente: tabela transacoes (tipo debito/aposta), não chutes.';
  } else if (report.D2.tabelas.chutes && report.D2.tabelas.chutes.count > 0) {
    report.D2.conclusao_origem_jogo = 'Tabela chutes possui registros; histórico de jogo pode estar em chutes e/ou transacoes.';
  } else {
    report.D2.conclusao_origem_jogo = 'Tabela chutes vazia ou inacessível; transacoes contém movimentos (tipos presentes no relatório).';
  }

  console.log(JSON.stringify(report, null, 2));
}

run().catch(err => {
  report.erros.push(err.message);
  console.log(JSON.stringify(report, null, 2));
});
