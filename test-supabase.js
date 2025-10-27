// Teste rápido do Supabase
const { supabaseAdmin } = require('./database/supabase-unified-config');

async function testSupabase() {
  try {
    console.log('🔍 Testando conexão com Supabase...');
    
    const { data, error } = await supabaseAdmin
      .from('usuarios')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('❌ Supabase ERROR:', error.message);
      console.log('❌ Código:', error.code);
      console.log('❌ Detalhes:', error.details);
      return false;
    }
    
    console.log('✅ Supabase OK:', data);
    return true;
  } catch (err) {
    console.log('❌ Supabase EXCEPTION:', err.message);
    return false;
  }
}

testSupabase().then(success => {
  process.exit(success ? 0 : 1);
});