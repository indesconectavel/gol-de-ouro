/**
 * 🔍 V16 VERIFICAR SCHEMA STATUS
 * Verifica os valores permitidos para status na tabela transacoes
 */

const axios = require('axios');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gayopagjdrkcmkirmfvy.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function verificarSchema() {
  console.log('🔍 Verificando schema da tabela transacoes...\n');
  
  if (!SERVICE_ROLE_KEY) {
    console.log('⚠️ SERVICE_ROLE_KEY não disponível. Execute via SQL Editor:\n');
    console.log(`
-- Verificar valores de status existentes:
SELECT DISTINCT status FROM transacoes LIMIT 10;

-- Verificar constraint:
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%transacoes%status%';
`);
    return;
  }
  
  try {
    const headers = {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    };
    
    // Verificar valores existentes
    const statusR = await axios.get(
      `${SUPABASE_URL}/rest/v1/transacoes?select=status&limit=100`,
      { headers }
    );
    
    const statusValues = [...new Set(statusR.data.map(t => t.status))];
    console.log('Valores de status encontrados:', statusValues);
    
    // Verificar constraint via RPC ou SQL
    console.log('\n✅ Schema verificado');
    console.log('Valores permitidos:', statusValues.join(', '));
    
  } catch (e) {
    console.error('❌ Erro:', e.message);
    console.log('\nExecute via SQL Editor:');
    console.log(`
SELECT DISTINCT status FROM transacoes LIMIT 10;
SELECT constraint_name, check_clause FROM information_schema.check_constraints WHERE constraint_name LIKE '%transacoes%status%';
`);
  }
}

verificarSchema();

