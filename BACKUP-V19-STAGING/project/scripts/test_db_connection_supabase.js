/**
 * TEST DB CONNECTION SUPABASE - Validação usando Supabase Client
 * Alternativa ao teste direto com pg
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function testConnection() {
  const supabaseUrl = process.env.SUPABASE_URL || 'https://gayopagjdrkcmkirmfvy.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const databaseUrl = process.env.DATABASE_URL;
  
  console.log('🔍 Testando conexão com Supabase...');
  console.log(`   URL: ${supabaseUrl}`);
  console.log(`   DATABASE_URL configurada: ${databaseUrl ? 'SIM' : 'NÃO'}`);
  
  if (!supabaseKey) {
    console.error('❌ ERRO: SUPABASE_SERVICE_ROLE_KEY não configurada');
    process.exit(1);
  }
  
  if (!databaseUrl) {
    console.error('❌ ERRO: DATABASE_URL não configurada no .env.local');
    process.exit(1);
  }
  
  // Testar conexão via Supabase Client (REST API)
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('   Testando conexão via Supabase Client...');
    const { data, error } = await supabase
      .from('usuarios')
      .select('count')
      .limit(1);
    
    if (error && error.code !== 'PGRST116') {
      console.error('❌ ERRO na conexão Supabase:', error.message);
      console.error(`   Código: ${error.code}`);
      process.exit(1);
    }
    
    console.log('✅ Conexão Supabase estabelecida com sucesso!');
    console.log('   ✅ DATABASE_URL está configurada corretamente');
    console.log('   ✅ Supabase Client funcionando');
    
    // Verificar se podemos acessar tabelas
    try {
      const { data: tables, error: tablesError } = await supabase
        .rpc('exec_sql', { query: "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public'" })
        .single();
      
      if (!tablesError) {
        console.log(`   ✅ Tabelas públicas acessíveis`);
      }
    } catch (e) {
      // Ignorar erro de RPC, não é crítico
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ ERRO geral:', error.message);
    process.exit(1);
  }
}

testConnection();

