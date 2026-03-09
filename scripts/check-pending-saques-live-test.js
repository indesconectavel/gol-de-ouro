/**
 * READ-ONLY: Lista saques pendentes para teste controlado do hotfix ledger.
 * Uso: node scripts/check-pending-saques-live-test.js
 * Requer: .env com SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.log(JSON.stringify({ error: 'SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes', pending: [] }));
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

async function run() {
  const { data, error } = await supabase
    .from('saques')
    .select('id, usuario_id, status, created_at')
    .in('status', ['pendente', 'pending'])
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.log(JSON.stringify({ error: error.message, code: error.code, pending: [] }));
    process.exit(1);
  }
  console.log(JSON.stringify({ pending: data || [], count: (data || []).length }));
}

run();
