// test-supabase-credentials.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testSupabaseCredentials() {
  console.log('🔍 [TESTE] Testando credenciais Supabase...');
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.log('❌ [TESTE] Credenciais não configuradas');
    console.log('SUPABASE_URL:', supabaseUrl ? '✅ Configurado' : '❌ Não configurado');
    console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceRoleKey ? '✅ Configurado' : '❌ Não configurado');
    return false;
  }
  
  console.log('✅ [TESTE] Credenciais encontradas');
  console.log('SUPABASE_URL:', supabaseUrl.substring(0, 30) + '...');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceRoleKey.substring(0, 30) + '...');
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    // Teste 1: Conexão básica
    console.log('🔄 [TESTE] Testando conexão básica...');
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      console.log('❌ [TESTE] Erro na conexão:', error.message);
      console.log('❌ [TESTE] Código do erro:', error.code);
      return false;
    }
    
    console.log('✅ [TESTE] Conexão bem-sucedida!');
    console.log('✅ [TESTE] Dados retornados:', data);
    
    // Teste 2: Verificar tabelas
    console.log('🔄 [TESTE] Verificando tabelas...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (tablesError) {
      console.log('⚠️ [TESTE] Não foi possível listar tabelas:', tablesError.message);
    } else {
      console.log('✅ [TESTE] Tabelas encontradas:', tables?.map(t => t.table_name));
    }
    
    return true;
    
  } catch (error) {
    console.log('❌ [TESTE] Erro inesperado:', error.message);
    return false;
  }
}

// Executar teste
testSupabaseCredentials()
  .then(success => {
    if (success) {
      console.log('🎉 [TESTE] Credenciais Supabase funcionando!');
    } else {
      console.log('🚨 [TESTE] Credenciais Supabase com problemas!');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.log('💥 [TESTE] Erro fatal:', error);
    process.exit(1);
  });



