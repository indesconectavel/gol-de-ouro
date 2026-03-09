/**
 * READ-ONLY: Snapshot lógico das tabelas financeiras críticas (substitui pg_dump para deploy seguro V1.1).
 * Usa SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY. NÃO usa DATABASE_URL nem pg_dump.
 * Escreve docs/relatorios/payout-v1_1-financial-snapshot-before.json
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'docs', 'relatorios');
const OUT_FILE = path.join(OUT, 'payout-v1_1-financial-snapshot-before.json');

function mask(id) {
  if (id == null) return null;
  const s = String(id);
  return s.length <= 4 ? '***' : s.slice(0, 4) + '***' + s.slice(-4);
}

async function run() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    const err = { timestamp_utc: new Date().toISOString(), success: false, error: 'SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausente', metadata: {} };
    fs.mkdirSync(OUT, { recursive: true });
    fs.writeFileSync(OUT_FILE, JSON.stringify(err, null, 2), 'utf8');
    process.exit(1);
  }

  const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const meta = { timestamp_utc: new Date().toISOString(), success: true, error: null };

  try {
    // 1) Saques: últimos 100 + todos processando
    const { data: saquesLast, error: e1 } = await supabase.from('saques').select('id, usuario_id, status, created_at, updated_at, processed_at, transacao_id, valor, net_amount, correlation_id').order('created_at', { ascending: false }).limit(100);
    const { data: saquesProcessando } = await supabase.from('saques').select('id, usuario_id, status, created_at, updated_at, processed_at, transacao_id, valor, net_amount, correlation_id').in('status', ['processando', 'processing']);
    const saques = {
      ultimos_100: (saquesLast || []).map(s => ({ id: s.id, usuario_id: mask(s.usuario_id), status: s.status, created_at: s.created_at, updated_at: s.updated_at, processed_at: s.processed_at, transacao_id: s.transacao_id, valor: s.valor, net_amount: s.net_amount, correlation_id: mask(s.correlation_id) })),
      processando: (saquesProcessando || []).map(s => ({ id: s.id, usuario_id: mask(s.usuario_id), status: s.status, created_at: s.created_at, updated_at: s.updated_at, processed_at: s.processed_at, transacao_id: s.transacao_id, valor: s.valor, net_amount: s.net_amount, correlation_id: mask(s.correlation_id) })),
      total_ultimos_100: (saquesLast || []).length,
      total_processando: (saquesProcessando || []).length
    };
    if (e1) saques.error = e1.message;

    // 2) Pagamentos PIX: últimos 100 (resumo)
    let pagamentosPix = { total: 0, resumo_external_ids: 0, error: null };
    try {
      const { data: pixRows, error: ePix } = await supabase.from('pagamentos_pix').select('id, external_id, payment_id, usuario_id, valor, status, created_at').order('created_at', { ascending: false }).limit(100);
      if (ePix) pagamentosPix.error = ePix.message;
      else {
        pagamentosPix.total = (pixRows || []).length;
        const ids = new Set((pixRows || []).map(r => r.external_id || r.payment_id).filter(Boolean));
        pagamentosPix.resumo_external_ids = ids.size;
        pagamentosPix.ultimos_100_redigidos = (pixRows || []).map(p => ({ id: mask(p.id), external_id: mask(p.external_id), payment_id: mask(p.payment_id), usuario_id: mask(p.usuario_id), valor: p.valor, status: p.status, created_at: p.created_at }));
      }
    } catch (e) {
      pagamentosPix.error = (e.message || String(e)).slice(0, 200);
    }

    // 3) Ledger: últimos 100 (detectar user_id vs usuario_id)
    const { data: ledgerRows, error: eLedger } = await supabase.from('ledger_financeiro').select('*').order('created_at', { ascending: false }).limit(100);
    const sample = (ledgerRows || [])[0];
    const hasUserId = sample && 'user_id' in sample;
    const hasUsuarioId = sample && 'usuario_id' in sample;
    const ledger = {
      total: (ledgerRows || []).length,
      campos_detectados: hasUserId ? 'user_id' : (hasUsuarioId ? 'usuario_id' : 'nenhum'),
      ultimos_100_redigidos: (ledgerRows || []).map(l => ({ id: l.id, tipo: l.tipo, valor: l.valor, referencia: mask(l.referencia), created_at: l.created_at, user_id: l.user_id, usuario_id: l.usuario_id }))
    };
    if (eLedger) ledger.error = eLedger.message;

    // 4) Transações: últimas 100
    let transacoes = { total: 0, error: null };
    try {
      const { data: txRows, error: eTx } = await supabase.from('transacoes').select('id, usuario_id, tipo, valor, created_at, referencia').order('created_at', { ascending: false }).limit(100);
      if (eTx) transacoes.error = eTx.message;
      else {
        transacoes.total = (txRows || []).length;
        transacoes.ultimos_100_redigidos = (txRows || []).map(t => ({ id: mask(t.id), usuario_id: mask(t.usuario_id), tipo: t.tipo, valor: t.valor, created_at: t.created_at, referencia: mask(t.referencia) }));
      }
    } catch (e) {
      transacoes.error = (e.message || String(e)).slice(0, 200);
    }

    // 5) Usuários afetados (dos saques processando)
    const userIds = [...new Set((saquesProcessando || []).map(s => s.usuario_id).filter(Boolean))];
    let usuarios = { total: 0, ids: userIds.map(mask), saldos: [] };
    if (userIds.length > 0) {
      const { data: users } = await supabase.from('usuarios').select('id, saldo').in('id', userIds);
      usuarios.total = (users || []).length;
      usuarios.saldos = (users || []).map(u => ({ id: mask(u.id), saldo: u.saldo }));
    }

    // 6) Metadata
    meta.metadata = {
      saques,
      pagamentos_pix: pagamentosPix,
      ledger_financeiro: ledger,
      transacoes,
      usuarios_afetados: usuarios,
      ids_criticos_saques_processando: (saquesProcessando || []).map(s => s.id),
      totais: {
        saques_ultimos_100: saques.total_ultimos_100,
        saques_processando: saques.total_processando,
        ledger_ultimos_100: ledger.total,
        transacoes_ultimos_100: transacoes.total,
        usuarios_afetados: usuarios.total
      }
    };
  } catch (e) {
    meta.success = false;
    meta.error = (e.message || String(e)).slice(0, 300);
  }

  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(meta, null, 2), 'utf8');
  if (!meta.success) process.exit(1);
}

run();
