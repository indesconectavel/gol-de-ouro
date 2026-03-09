/**
 * AUDITORIA READ-ONLY: Schema real em produção (Supabase).
 * Usa SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY do .env — NUNCA loga URL/KEY.
 * Apenas SELECT / information_schema. Salva docs/relatorios/auditoria-schema-prod-YYYY-MM-DD.json
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.join(__dirname, '..', 'docs', 'relatorios');
const TS = new Date().toISOString().slice(0, 10);

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error(JSON.stringify({ error: 'SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes' }));
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
  db: { schema: 'public' }
});

const report = {
  timestamp: new Date().toISOString(),
  credentials_ok: !!(url && key),
  tables: {},
  constraints: [],
  erros: []
};

async function run() {
  const tables = ['usuarios', 'saques', 'pagamentos_pix', 'ledger_financeiro', 'transacoes'];
  for (const table of tables) {
    report.tables[table] = { columns: [], sample_keys: [], has_saldo: false, has_balance: false };
    const { data: sample, error: eSample } = await supabase
      .from(table)
      .select('*')
      .limit(1)
      .maybeSingle();
    if (eSample) {
      report.erros.push({ table, step: 'sample', msg: eSample.message });
      continue;
    }
    const keys = sample ? Object.keys(sample) : [];
    report.tables[table].sample_keys = keys;
    report.tables[table].columns = keys.map(k => ({
      name: k,
      type: sample && sample[k] !== null ? typeof sample[k] : 'unknown'
    }));
    report.tables[table].has_saldo = keys.includes('saldo');
    report.tables[table].has_balance = keys.includes('balance');
  }

  const { data: ledgerSample } = await supabase
    .from('ledger_financeiro')
    .select('*')
    .limit(1)
    .maybeSingle();
  const ledgerColNames = ledgerSample ? Object.keys(ledgerSample) : [];
  report.ledger_user_column = ledgerColNames.includes('user_id') ? 'user_id' : (ledgerColNames.includes('usuario_id') ? 'usuario_id' : null);
  report.constraints = [];

  const outPath = path.join(OUT_DIR, `auditoria-schema-prod-${TS}.json`);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');
  console.log('OK schema prod -> ' + outPath);
  if (process.env.CICLO1 === '1') {
    const ciclo1Path = path.join(OUT_DIR, 'ciclo1-schema-snapshot.json');
    fs.writeFileSync(ciclo1Path, JSON.stringify(report, null, 2), 'utf8');
    console.log('OK ciclo1 -> ' + ciclo1Path);
  }
}

run().catch(err => {
  report.erros.push({ step: 'run', msg: err.message });
  const outPath = path.join(OUT_DIR, `auditoria-schema-prod-${TS}.json`);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');
  if (process.env.CICLO1 === '1') {
    const ciclo1Path = path.join(OUT_DIR, 'ciclo1-schema-snapshot.json');
    fs.writeFileSync(ciclo1Path, JSON.stringify(report, null, 2), 'utf8');
  }
  console.log('OK schema prod (com erros) -> ' + outPath);
  process.exit(1);
});
