// READ-ONLY: infer columns (usuario_id vs user_id) per table via Supabase client.
// No information_schema (REST does not expose it); infer by select attempts.
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const out = (k, v) => console.log(k + ' ' + (typeof v === 'object' ? JSON.stringify(v) : String(v)));

out('SUPABASE_URL_PRESENT', !!SUPABASE_URL);
out('SERVICE_ROLE_PRESENT', !!SERVICE_ROLE_KEY);
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  process.exit(0);
}

let supabase;
try {
  const { createClient } = require('@supabase/supabase-js');
  supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
} catch (e) {
  out('REQUIRE_ERROR', e.message);
  process.exit(0);
}

const TABLES = ['usuarios', 'saques', 'ledger_financeiro', 'tentativas_chute', 'transacoes', 'pagamentos_pix', 'withdrawals', 'password_reset_tokens', 'chutes'];
const COLS_TO_PROBE = ['id', 'usuario_id', 'user_id'];

async function probeColumn(table, col) {
  const { data, error } = await supabase.from(table).select(col).limit(1);
  if (error) {
    const msg = (error.message || '').toLowerCase();
    const notExist = msg.includes('does not exist') || msg.includes('column') && msg.includes('exist');
    return { exists: false, error: error.message ? error.message.slice(0, 200) : String(error) };
  }
  return { exists: true };
}

async function main() {
  const results = {};
  for (const table of TABLES) {
    const tableResult = {};
    for (const col of COLS_TO_PROBE) {
      const r = await probeColumn(table, col);
      tableResult[col] = r.exists ? 'YES' : (r.error || 'ERR');
    }
    results[table] = tableResult;
    out('TABLE_' + table, JSON.stringify(tableResult));
  }
  out('SCHEMA_PROBE_DONE', 'ok');
}

main().then(() => process.exit(0)).catch(e => {
  out('SCHEMA_PROBE_ERROR', e.message);
  process.exit(0);
});
