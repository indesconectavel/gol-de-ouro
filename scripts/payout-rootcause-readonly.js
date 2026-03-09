/**
 * READ-ONLY: Root cause dos 5 saques presos — correlaciona saques com ledger e transacoes.
 * Salva docs/relatorios/payout-rootcause-saques-presos.json
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.join(__dirname, '..', 'docs', 'relatorios');
const PRESO_MIN = 30;

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
    presos_mais_30_min: [],
    ledger_por_saque: {},
    transacoes_por_saque: {},
    erros: []
  };

  const since = new Date(Date.now() - PRESO_MIN * 60 * 1000).toISOString();
  const { data: saques, error: eSaques } = await supabase
    .from('saques')
    .select('id, usuario_id, status, created_at, updated_at, processed_at, transacao_id, valor, amount, net_amount, fee, correlation_id, pix_key, pix_type, chave_pix, tipo_chave')
    .in('status', ['processando', 'processing'])
    .lt('created_at', since)
    .order('created_at', { ascending: true });

  if (eSaques) {
    report.erros.push({ step: 'saques', msg: eSaques.message });
    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(path.join(OUT_DIR, 'payout-rootcause-saques-presos.json'), JSON.stringify(report, null, 2), 'utf8');
    console.log('OK payout rootcause saques (erro)');
    return;
  }

  const list = saques || [];
  for (const s of list) {
    report.presos_mais_30_min.push({
      id: s.id,
      usuario_id: maskId(s.usuario_id),
      status: s.status,
      created_at: s.created_at,
      updated_at: s.updated_at,
      processed_at: s.processed_at,
      transacao_id: s.transacao_id,
      valor: s.valor,
      amount: s.amount,
      net_amount: s.net_amount,
      fee: s.fee,
      correlation_id: s.correlation_id ? maskId(String(s.correlation_id)) : null,
      pix_key_preview: s.pix_key ? String(s.pix_key).slice(0, 4) + '***' : null,
      pix_type: s.pix_type || s.tipo_chave
    });

    const ref = String(s.id);
    const { data: ledgerRows } = await supabase
      .from('ledger_financeiro')
      .select('id, tipo, valor, referencia, correlation_id, created_at')
      .eq('referencia', ref);
    report.ledger_por_saque[ref] = (ledgerRows || []).map(r => ({
      id: r.id,
      tipo: r.tipo,
      valor: r.valor,
      referencia: r.referencia,
      created_at: r.created_at
    }));

    const { data: transRows } = await supabase
      .from('transacoes')
      .select('id, tipo, valor, referencia, status, created_at')
      .or(`referencia.eq.${ref},referencia_id.eq.${ref}`);
    report.transacoes_por_saque[ref] = (transRows || []).map(t => ({
      id: t.id,
      tipo: t.tipo,
      valor: t.valor,
      referencia: t.referencia,
      status: t.status,
      created_at: t.created_at
    }));
  }

  const outPath = path.join(OUT_DIR, 'payout-rootcause-saques-presos.json');
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');
  console.log('OK payout rootcause saques -> ' + outPath);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
