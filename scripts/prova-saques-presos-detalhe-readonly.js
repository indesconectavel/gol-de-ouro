/**
 * CICLO 1 READ-ONLY: Saques presos (>30 min) e causa exata.
 * Busca saques processando >30 min, ledger ligado (referencia/correlation_id),
 * indícios: falha MP, falha ledger insert, CHECK, ausência processed_at/transacao_id.
 * Salva docs/relatorios/ciclo1-saques-presos.json
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.join(__dirname, '..', 'docs', 'relatorios');
const PRESO_MIN = 30;
const LIMITE = 20;

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

async function detectLedgerUserColumn() {
  const { error: e1 } = await supabase.from('ledger_financeiro').select('user_id').limit(1);
  if (!e1) return 'user_id';
  const { error: e2 } = await supabase.from('ledger_financeiro').select('usuario_id').limit(1);
  if (!e2) return 'usuario_id';
  return null;
}

async function run() {
  const report = {
    timestamp: new Date().toISOString(),
    presos_mais_de_min: PRESO_MIN,
    total_presos: 0,
    saques: [],
    ledger_por_saque: {},
    indicios: {
      falha_mp_payout: [],
      falha_ledger_insert: [],
      violacao_check_status: [],
      ausencia_processed_at: [],
      ausencia_transacao_id: []
    },
    user_column_ledger: null,
    erros: []
  };

  report.user_column_ledger = await detectLedgerUserColumn();

  const since = new Date(Date.now() - PRESO_MIN * 60 * 1000).toISOString();
  const { data: saques, error: eSaques } = await supabase
    .from('saques')
    .select('id, usuario_id, status, created_at, updated_at, processed_at, transacao_id, amount, net_amount, valor, correlation_id')
    .in('status', ['processando', 'processing'])
    .lt('created_at', since)
    .order('created_at', { ascending: false })
    .limit(LIMITE);

  if (eSaques) {
    report.erros.push({ step: 'saques', msg: eSaques.message });
    const outPath = path.join(OUT_DIR, 'ciclo1-saques-presos.json');
    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');
    console.log('OK ciclo1 saques presos (erro) -> ' + outPath);
    return;
  }

  const list = saques || [];
  report.total_presos = list.length;
  const statusPermitidos = ['pendente', 'processando', 'concluido', 'rejeitado', 'cancelado'];

  for (const s of list) {
    const row = {
      id: s.id,
      usuario_id: maskId(s.usuario_id),
      status: s.status,
      created_at: s.created_at,
      updated_at: s.updated_at,
      processed_at: s.processed_at,
      transacao_id: s.transacao_id,
      amount: s.amount ?? s.valor,
      net_amount: s.net_amount,
      correlation_id: s.correlation_id ?? null
    };
    report.saques.push(row);

    if (!statusPermitidos.includes(String(s.status || '').toLowerCase())) {
      report.indicios.violacao_check_status.push({ saque_id: s.id, status: s.status });
    }
    if (s.processed_at == null || s.processed_at === '') {
      report.indicios.ausencia_processed_at.push(s.id);
    }
    if (s.transacao_id == null || s.transacao_id === '') {
      report.indicios.ausencia_transacao_id.push(s.id);
    }
  }

  for (const s of list) {
    const ref = String(s.id);
    const { data: ledgerRows } = await supabase
      .from('ledger_financeiro')
      .select('id, tipo, valor, referencia, correlation_id, created_at')
      .eq('referencia', ref);
    const count = (ledgerRows || []).length;
    report.ledger_por_saque[ref] = count;
    if (count === 0) {
      report.indicios.falha_ledger_insert.push({
        saque_id: s.id,
        correlation_id: s.correlation_id ? maskId(s.correlation_id) : null
      });
    }
  }

  const outPath = path.join(OUT_DIR, 'ciclo1-saques-presos.json');
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');
  console.log('OK ciclo1 saques presos -> ' + outPath);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
