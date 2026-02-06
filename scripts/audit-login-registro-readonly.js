/**
 * Missão L1 — Auditoria Login & Registro (READ-ONLY).
 * FASE 1: Modelo de dados — somente SELECT.
 * Sem PII nos outputs; usuario_id ofuscado quando necessário.
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function maskId(id) {
  if (id == null) return null;
  const s = String(id);
  return s.length <= 6 ? 'u_' + s : 'u_' + s.slice(-6);
}

const report = {
  timestamp: new Date().toISOString(),
  FASE1: {
    total_usuarios: null,
    usuarios_sem_perfil: null,
    perfis_sem_auth: null,
    duplicados_email: { total_chaves_duplicadas: 0, amostra: [] },
    duplicados_telefone: { total_chaves_duplicadas: 0, amostra: [] },
    por_tipo: [],
    por_ativo: [],
    saldo_zero_count: null,
    erros: []
  }
};

async function run() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    report.FASE1.erros.push('SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes');
    console.log(JSON.stringify(report, null, 2));
    return;
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { count: total, error: e0 } = await supabase.from('usuarios').select('*', { count: 'exact', head: true });
  report.FASE1.total_usuarios = e0 ? null : total;

  const { data: allUsers, error: e1 } = await supabase.from('usuarios').select('id, email, telefone, tipo, ativo, saldo');
  if (e1) report.FASE1.erros.push({ total: e1.message });
  const users = allUsers || [];

  const byEmail = {};
  users.forEach(u => {
    const e = (u.email || '').toString().trim().toLowerCase();
    if (!e) return;
    if (!byEmail[e]) byEmail[e] = [];
    byEmail[e].push(u.id);
  });
  const dupEmail = Object.entries(byEmail).filter(([, ids]) => ids.length > 1);
  report.FASE1.duplicados_email.total_chaves_duplicadas = dupEmail.length;
  report.FASE1.duplicados_email.amostra = dupEmail.slice(0, 5).map(([email, ids]) => ({
    email: email.slice(0, 3) + '***@***',
    quantidade: ids.length
  }));

  const byTel = {};
  users.forEach(u => {
    const t = (u.telefone || '').toString().trim();
    if (!t) return;
    if (!byTel[t]) byTel[t] = [];
    byTel[t].push(u.id);
  });
  const dupTel = Object.entries(byTel).filter(([, ids]) => ids.length > 1);
  report.FASE1.duplicados_telefone.total_chaves_duplicadas = dupTel.length;
  report.FASE1.duplicados_telefone.amostra = dupTel.slice(0, 5).map(([, ids]) => ({ quantidade: ids.length }));

  const byTipo = {};
  users.forEach(u => { byTipo[u.tipo || 'null'] = (byTipo[u.tipo || 'null'] || 0) + 1; });
  report.FASE1.por_tipo = Object.entries(byTipo).map(([tipo, count]) => ({ tipo, count }));

  const byAtivo = {};
  users.forEach(u => { byAtivo[String(!!u.ativo)] = (byAtivo[String(!!u.ativo)] || 0) + 1; });
  report.FASE1.por_ativo = Object.entries(byAtivo).map(([ativo, count]) => ({ ativo, count }));

  const saldoZero = users.filter(u => u.saldo == null || Number(u.saldo) === 0).length;
  report.FASE1.saldo_zero_count = saldoZero;

  report.FASE1.usuarios_sem_perfil = 'N/A (perfil = tabela usuarios)';
  report.FASE1.perfis_sem_auth = 'N/A (auth = tabela usuarios, sem Supabase Auth)';

  console.log(JSON.stringify(report, null, 2));
}

run().catch(err => {
  report.FASE1.erros.push(err.message);
  console.log(JSON.stringify(report, null, 2));
});
