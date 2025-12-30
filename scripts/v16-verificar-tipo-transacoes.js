/**
 * 🔍 V16 VERIFICAR TIPO DE TRANSAÇÕES
 * Verifica os valores permitidos para o campo tipo na tabela transacoes
 */

const axios = require('axios');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gayopagjdrkcmkirmfvy.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function verificarTipoPermitidos() {
  console.log('🔍 Verificando valores permitidos para tipo em transacoes...\n');
  
  if (!SERVICE_ROLE_KEY) {
    console.log('⚠️ SERVICE_ROLE_KEY não disponível.\n');
    console.log('Execute via SQL Editor:\n');
    console.log(`
-- Verificar valores de tipo existentes:
SELECT DISTINCT tipo FROM transacoes LIMIT 10;

-- Verificar constraint:
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%transacoes%tipo%';
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
    const tipoR = await axios.get(
      `${SUPABASE_URL}/rest/v1/transacoes?select=tipo&limit=100`,
      { headers }
    );
    
    const tipoValues = [...new Set(tipoR.data.map(t => t.tipo).filter(Boolean))];
    console.log('✅ Valores de tipo encontrados:', tipoValues.join(', ') || 'Nenhum');
    
    if (tipoValues.length === 0) {
      console.log('\n⚠️ Nenhuma transação encontrada. Valores possíveis baseados em schemas:');
      console.log('- deposito, deposit, credito, credit');
      console.log('\nRecomendação: Tente "deposito" primeiro.');
    } else {
      console.log('\n✅ Use um destes valores no SQL:');
      tipoValues.forEach(v => console.log(`  - '${v}'`));
    }
    
  } catch (e) {
    console.error('❌ Erro:', e.message);
    if (e.response?.status === 401) {
      console.log('\n⚠️ SERVICE_ROLE_KEY inválida. Execute via SQL Editor:');
      console.log(`
SELECT DISTINCT tipo FROM transacoes LIMIT 10;
SELECT constraint_name, check_clause FROM information_schema.check_constraints WHERE constraint_name LIKE '%transacoes%tipo%';
`);
    }
  }
}

verificarTipoPermitidos();

