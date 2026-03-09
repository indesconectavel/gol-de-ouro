// READ-ONLY probe: ledger_financeiro existence and schema (no insert/update/delete)
// Run: node /tmp/ledger_probe.js (exit 0 always)

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const out = (key, value) => console.log(key + ' ' + String(value));
out('SUPABASE_URL_PRESENT', !!SUPABASE_URL);
out('SUPABASE_URL_LEN', SUPABASE_URL ? SUPABASE_URL.length : 0);
out('SERVICE_ROLE_PRESENT', !!SERVICE_ROLE_KEY);
out('SERVICE_ROLE_LEN', SERVICE_ROLE_KEY ? SERVICE_ROLE_KEY.length : 0);

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.log('LEDGER_PROBE_SKIP', 'missing_env');
  process.exit(0);
}

let supabase;
try {
  const { createClient } = require('@supabase/supabase-js');
  supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
} catch (e) {
  console.log('LEDGER_PROBE_ERROR', 'require_failed', e.message || String(e));
  process.exit(0);
}

async function run() {
  // (i) Table existence: select id limit 1
  const r1 = await supabase.from('ledger_financeiro').select('id').limit(1);
  if (r1.error) {
    console.log('TABLE_EXISTS', false);
    console.log('TABLE_ERROR_MESSAGE', (r1.error.message || '').slice(0, 500));
    console.log('TABLE_ERROR_DETAILS', (r1.error.details || '').slice(0, 300));
    console.log('TABLE_ERROR_CODE', r1.error.code || '');
  } else {
    console.log('TABLE_EXISTS', true);
    console.log('TABLE_ROW_COUNT', (r1.data && r1.data.length) ? r1.data.length : 0);
  }

  // (ii) Schema: select expected columns
  const cols = 'id, correlation_id, tipo, usuario_id, valor, referencia, created_at';
  const r2 = await supabase.from('ledger_financeiro').select(cols).limit(1);
  if (r2.error) {
    console.log('SCHEMA_SELECT_OK', false);
    console.log('SCHEMA_ERROR_MESSAGE', (r2.error.message || '').slice(0, 500));
    console.log('SCHEMA_ERROR_DETAILS', (r2.error.details || '').slice(0, 300));
  } else {
    console.log('SCHEMA_SELECT_OK', true);
  }

  // (iii) distinct tipo (read-only)
  const r3 = await supabase.from('ledger_financeiro').select('tipo').limit(50);
  if (r3.error) {
    console.log('TIPO_SELECT_OK', false);
    console.log('TIPO_ERROR_MESSAGE', (r3.error.message || '').slice(0, 500));
  } else {
    console.log('TIPO_SELECT_OK', true);
    const tipoSet = new Set((r3.data || []).map(r => r.tipo).filter(Boolean));
    console.log('TIPO_DISTINCT_VALUES', Array.from(tipoSet).join(',') || '(nenhum)');
  }

  console.log('LEDGER_PROBE_DONE', 'ok');
}

run().then(() => process.exit(0)).catch(err => {
  console.log('LEDGER_PROBE_ERROR', err.message || String(err));
  process.exit(0);
});
