// Script de teste para verificar conexão Supabase
const { createClient } = require('@supabase/supabase-js');

async function testSupabaseConnection() {
  try {
    console.log('🔍 Testando conexão Supabase...');
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('URL:', supabaseUrl);
    console.log('Key:', supabaseKey ? 'Configurada' : 'Não configurada');
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('❌ Credenciais não configuradas');
      return false;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Testar conexão simples
    const { data, error } = await supabase
      .from('usuarios')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('❌ Erro na conexão:', error.message);
      return false;
    }
    
    console.log('✅ Conexão Supabase funcionando!');
    return true;
    
  } catch (error) {
    console.log('❌ Erro geral:', error.message);
    return false;
  }
}

// Executar teste
testSupabaseConnection().then(success => {
  process.exit(success ? 0 : 1);
});
