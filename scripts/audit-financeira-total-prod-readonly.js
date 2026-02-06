/**
 * Auditoria financeira total PRODUÇÃO — SOMENTE LEITURA (SELECT).
 * Sem PII: usuario_id ofuscado (prefixo + últimos 6 caracteres).
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

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(JSON.stringify({ error: 'SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes' }));
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const report = {
  timestamp: new Date().toISOString(),
  q1_pagamentos_pix_por_status: [],
  q2_pending_antigos: [],
  q3_external_id_duplicado: [],
  q4_payment_id_duplicado: [],
  q5_valores_estranhos: [],
  q6_saques_por_status: [],
  q7_saques_antigos_nao_final: [],
  q8_ledger_por_tipo: [],
  q9_ledger_duplicidade: [],
  q10_saldos_negativos: [],
  q11_top_saldos: [],
  q12_transacoes_por_tipo: [],
  erros: []
};

async function run() {
  try {
    // (1) pagamentos_pix por status
    const { data: pixAll, error: e1 } = await supabase.from('pagamentos_pix').select('status');
    if (e1) report.erros.push({ q: 1, msg: e1.message });
    else {
      const byStatus = {};
      (pixAll || []).forEach(r => { byStatus[r.status] = (byStatus[r.status] || 0) + 1; });
      report.q1_pagamentos_pix_por_status = Object.entries(byStatus).map(([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count);
    }

    // (2) pending antigos — top 20
    const { data: pending, error: e2 } = await supabase
      .from('pagamentos_pix')
      .select('id, usuario_id, status, valor, amount, created_at, updated_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(20);
    if (e2) report.erros.push({ q: 2, msg: e2.message });
    else report.q2_pending_antigos = (pending || []).map(r => ({
      id: r.id,
      usuario_id: maskId(r.usuario_id),
      status: r.status,
      v: r.valor ?? r.amount,
      created_at: r.created_at,
      updated_at: r.updated_at
    }));

    // (3) external_id duplicado
    const { data: pixRows, error: e3 } = await supabase.from('pagamentos_pix').select('external_id, payment_id, status');
    if (e3) report.erros.push({ q: 3, msg: e3.message });
    else if (pixRows && pixRows.length) {
      const byExt = {};
      pixRows.forEach(r => {
        const ext = r.external_id != null ? String(r.external_id) : null;
        if (ext == null) return;
        if (!byExt[ext]) byExt[ext] = { total: 0, approved: 0 };
        byExt[ext].total++;
        if (r.status === 'approved') byExt[ext].approved++;
      });
      report.q3_external_id_duplicado = Object.entries(byExt)
        .filter(([, o]) => o.total > 1 || o.approved > 1)
        .map(([external_id, o]) => ({ external_id, c: o.total, a: o.approved }))
        .sort((a, b) => b.c - a.c);
    }

    // (4) payment_id duplicado
    if (pixRows && pixRows.length) {
      const byPid = {};
      pixRows.forEach(r => {
        const pid = r.payment_id != null ? String(r.payment_id) : null;
        if (pid == null) return;
        if (!byPid[pid]) byPid[pid] = { total: 0, approved: 0 };
        byPid[pid].total++;
        if (r.status === 'approved') byPid[pid].approved++;
      });
      report.q4_payment_id_duplicado = Object.entries(byPid)
        .filter(([, o]) => o.total > 1 || o.approved > 1)
        .map(([payment_id, o]) => ({ payment_id, c: o.total, a: o.approved }))
        .sort((a, b) => b.c - a.c);
    }

    // (5) valores estranhos
    const { data: estranhos, error: e5 } = await supabase
      .from('pagamentos_pix')
      .select('id, usuario_id, status, valor, amount, created_at');
    if (e5) report.erros.push({ q: 5, msg: e5.message });
    else report.q5_valores_estranhos = (estranhos || [])
      .filter(r => {
        const v = r.valor ?? r.amount;
        return v == null || Number(v) <= 0 || Number(v) > 10000;
      })
      .slice(0, 50)
      .map(r => ({ id: r.id, usuario_id: maskId(r.usuario_id), status: r.status, v: r.valor ?? r.amount, created_at: r.created_at }));

    // (6) saques por status
    const { data: saquesAll, error: e6 } = await supabase.from('saques').select('status');
    if (e6) report.erros.push({ q: 6, msg: e6.message });
    else {
      const bySt = {};
      (saquesAll || []).forEach(r => { bySt[r.status] = (bySt[r.status] || 0) + 1; });
      report.q6_saques_por_status = Object.entries(bySt).map(([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count);
    }

    // (7) saques antigos não-final
    const finalStatuses = ['processado', 'concluido', 'cancelado', 'rejeitado'];
    const { data: saquesList, error: e7 } = await supabase.from('saques').select('id, usuario_id, status, valor, created_at, updated_at').order('created_at', { ascending: true }).limit(500);
    if (e7) report.erros.push({ q: 7, msg: e7.message });
    else {
      const nonFinal = (saquesList || []).filter(s => !finalStatuses.includes(String(s.status).toLowerCase()));
      report.q7_saques_antigos_nao_final = nonFinal.slice(0, 20).map(r => ({ id: r.id, usuario_id: maskId(r.usuario_id), status: r.status, valor: r.valor, created_at: r.created_at, updated_at: r.updated_at }));
    }

    // (8) ledger por tipo
    const { data: ledgerAll, error: e8 } = await supabase.from('ledger_financeiro').select('tipo');
    if (e8) report.erros.push({ q: 8, msg: e8.message });
    else {
      const byTipo = {};
      (ledgerAll || []).forEach(r => { byTipo[r.tipo] = (byTipo[r.tipo] || 0) + 1; });
      report.q8_ledger_por_tipo = Object.entries(byTipo).map(([tipo, count]) => ({ tipo, count })).sort((a, b) => b.count - a.count);
    }

    // (9) ledger duplicidade (correlation_id, referencia, tipo)
    const { data: ledgerRows, error: e9 } = await supabase.from('ledger_financeiro').select('correlation_id, referencia, tipo');
    if (e9) report.erros.push({ q: 9, msg: e9.message });
    else if (ledgerRows && ledgerRows.length) {
      const keyCount = {};
      ledgerRows.forEach(r => {
        if (r.correlation_id == null || r.referencia == null || r.tipo == null) return;
        const key = `${r.correlation_id}|${r.referencia}|${r.tipo}`;
        keyCount[key] = (keyCount[key] || 0) + 1;
      });
      report.q9_ledger_duplicidade = Object.entries(keyCount)
        .filter(([, c]) => c > 1)
        .map(([key, c]) => ({ correlation_id_referencia_tipo: key, c }))
        .sort((a, b) => b.c - a.c);
    }

    // (10) saldos negativos
    const { data: neg, error: e10 } = await supabase.from('usuarios').select('id, saldo').lt('saldo', 0).order('saldo', { ascending: true }).limit(50);
    if (e10) report.erros.push({ q: 10, msg: e10.message });
    else report.q10_saldos_negativos = (neg || []).map(r => ({ id: maskId(r.id), saldo: r.saldo }));

    // (11) top saldos
    const { data: topSaldo, error: e11 } = await supabase.from('usuarios').select('id, saldo').order('saldo', { ascending: false }).limit(20);
    if (e11) report.erros.push({ q: 11, msg: e11.message });
    else report.q11_top_saldos = (topSaldo || []).map(r => ({ id: maskId(r.id), saldo: r.saldo }));

    // (12) transacoes por tipo
    const { data: transAll, error: e12 } = await supabase.from('transacoes').select('tipo');
    if (e12) report.erros.push({ q: 12, msg: e12.message });
    else {
      const byTipo = {};
      (transAll || []).forEach(r => { byTipo[r.tipo] = (byTipo[r.tipo] || 0) + 1; });
      report.q12_transacoes_por_tipo = Object.entries(byTipo).map(([tipo, count]) => ({ tipo, count })).sort((a, b) => b.count - a.count);
    }
  } catch (err) {
    report.erros.push({ step: 'run', msg: err?.message || String(err) });
  }
  console.log(JSON.stringify(report, null, 2));
}

run();
