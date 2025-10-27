// Teste das tabelas do Supabase
const { supabaseAdmin } = require('./database/supabase-unified-config');

async function checkTables() {
  try {
    console.log('🔍 Verificando tabelas disponíveis...');
    
    // Tentar diferentes nomes de tabelas
    const tables = ['users', 'usuarios', 'user', 'usuario'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabaseAdmin
          .from(table)
          .select('count')
          .limit(1);
        
        if (!error) {
          console.log(`✅ Tabela '${table}' encontrada:`, data);
        } else {
          console.log(`❌ Tabela '${table}' não encontrada:`, error.message);
        }
      } catch (err) {
        console.log(`❌ Erro ao verificar tabela '${table}':`, err.message);
      }
    }
    
    // Tentar listar todas as tabelas usando SQL
    console.log('\n🔍 Tentando listar todas as tabelas...');
    const { data: tablesData, error: tablesError } = await supabaseAdmin
      .rpc('get_tables');
    
    if (tablesError) {
      console.log('❌ Não foi possível listar tabelas:', tablesError.message);
    } else {
      console.log('✅ Tabelas encontradas:', tablesData);
    }
    
  } catch (err) {
    console.log('❌ EXCEPTION:', err.message);
  }
}

checkTables();
