/**
 * AUDITORIA READ-ONLY: Schema real — colunas saldo/balance, ledger user_id/usuario_id,
 * processed_at, transacao_id, CHECK/UNIQUE documentados.
 * Salva docs/relatorios/final-schema-check.json
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.join(__dirname, '..', 'docs', 'relatorios');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error(JSON.stringify({ error: 'SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes' }));
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false }, db: { schema: 'public' } });

const report = {
  timestamp: new Date().toISOString(),
  credentials_ok: true,
  tables: {},
  ledger_user_column: null,
  coluna_oficial_saldo: null,
  saques_has_processed_at: false,
  saques_has_transacao_id: false,
  transacoes_has_processed_at: false,
  transacoes_has_transacao_id: false,
  check_saques_status: 'documentado_no_schema_sql',
  unique_pagamentos_pix: 'nao_verificado_via_api_rest',
  erros: []
};

async function run() {
  const tables = ['usuarios', 'saques', 'pagamentos_pix', 'ledger_financeiro', 'transacoes'];
  for (const table of tables) {
    report.tables[table] = { columns: [], sample_keys: [], has_saldo: false, has_balance: false };
    const { data: sample, error: eSample } = await supabase.from(table).select('*').limit(1).maybeSingle();
    if (eSample) {
      report.erros.push({ table, step: 'sample', msg: eSample.message });
      continue;
    }
    const keys = sample ? Object.keys(sample) : [];
    report.tables[table].sample_keys = keys;
    report.tables[table].columns = keys.map(k => ({ name: k, type: sample && sample[k] !== null ? typeof sample[k] : 'unknown' }));
    report.tables[table].has_saldo = keys.includes('saldo');
    report.tables[table].has_balance = keys.includes('balance');
  }

  if (report.tables.usuarios) {
    report.coluna_oficial_saldo = report.tables.usuarios.has_saldo ? 'saldo' : (report.tables.usuarios.has_balance ? 'balance' : null);
  }
  if (report.tables.saques) {
    report.saques_has_processed_at = report.tables.saques.sample_keys.includes('processed_at');
    report.saques_has_transacao_id = report.tables.saques.sample_keys.includes('transacao_id');
  }
  if (report.tables.transacoes) {
    report.transacoes_has_processed_at = report.tables.transacoes.sample_keys.includes('processed_at');
    report.transacoes_has_transacao_id = report.tables.transacoes.sample_keys.includes('transacao_id');
  }

  const { data: ledgerSample } = await supabase.from('ledger_financeiro').select('*').limit(1).maybeSingle();
  const ledgerColNames = ledgerSample ? Object.keys(ledgerSample) : [];
  report.ledger_user_column = ledgerColNames.includes('user_id') ? 'user_id' : (ledgerColNames.includes('usuario_id') ? 'usuario_id' : null);

  const outPath = path.join(OUT_DIR, 'final-schema-check.json');
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');
  console.log('OK final schema -> ' + outPath);
}

run().catch(err => {
  report.erros.push({ step: 'run', msg: err.message });
  const outPath = path.join(OUT_DIR, 'final-schema-check.json');
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');
  console.log('OK final schema (com erros) -> ' + outPath);
  process.exit(1);
});
