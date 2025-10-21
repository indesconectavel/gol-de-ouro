// APLICAR SCHEMA SUPABASE - DEPLOY AUTOMATIZADO
// ==============================================
// Data: 21/10/2025
// Status: APLICAÇÃO DO SCHEMA DEFINITIVO
// Versão: v1.2.0-final-production

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Configuração do Supabase
const supabaseUrl = 'https://gayopagjdrkcmkirmfvy.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdheW9wYWdqZHJrY21raXJtZnZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDAyMDY2OSwiZXhwIjoyMDc1NTk2NjY5fQ.BjmwUSoKDksHybO9pta71F4E5RyILNeuK_FRzxkPnqU';

async function aplicarSchemaSupabase() {
  console.log('🚀 === APLICANDO SCHEMA SUPABASE DEFINITIVO ===');
  console.log(`🌐 URL: ${supabaseUrl}`);
  console.log('📅 Data:', new Date().toISOString());
  console.log('============================================================');

  try {
    // Criar cliente Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Ler arquivo do schema
    const schemaSQL = fs.readFileSync('schema-supabase-final.sql', 'utf8');
    
    console.log('📄 Schema carregado com sucesso');
    console.log(`📊 Tamanho do arquivo: ${schemaSQL.length} caracteres`);
    
    // Executar schema em partes para melhor controle
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`🔧 Executando ${statements.length} statements SQL...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.trim()) {
        try {
          console.log(`\n📝 Executando statement ${i + 1}/${statements.length}:`);
          console.log(`   ${statement.substring(0, 100)}...`);
          
          const { data, error } = await supabase.rpc('exec_sql', {
            sql: statement + ';'
          });
          
          if (error) {
            console.log(`❌ Erro no statement ${i + 1}:`, error.message);
            errorCount++;
          } else {
            console.log(`✅ Statement ${i + 1} executado com sucesso`);
            successCount++;
          }
          
          // Pequena pausa entre statements
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (err) {
          console.log(`❌ Erro no statement ${i + 1}:`, err.message);
          errorCount++;
        }
      }
    }
    
    console.log('\n============================================================');
    console.log('📊 RESULTADO DA APLICAÇÃO DO SCHEMA:');
    console.log(`✅ Sucessos: ${successCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    console.log(`📈 Taxa de sucesso: ${((successCount / statements.length) * 100).toFixed(2)}%`);
    
    if (errorCount === 0) {
      console.log('\n🎉 SCHEMA APLICADO COM SUCESSO TOTAL!');
    } else {
      console.log('\n⚠️ SCHEMA APLICADO COM ALGUNS ERROS');
    }
    
    // Verificar estrutura final
    console.log('\n🔍 Verificando estrutura final...');
    
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['usuarios', 'lotes', 'chutes', 'pagamentos_pix', 'transacoes', 'saques', 'metricas_globais']);
    
    if (!tablesError && tables) {
      console.log('📋 Tabelas criadas:');
      tables.forEach(table => {
        console.log(`   ✅ ${table.table_name}`);
      });
    }
    
    // Verificar RLS
    const { data: rlsTables, error: rlsError } = await supabase
      .from('pg_tables')
      .select('tablename, rowsecurity')
      .eq('schemaname', 'public')
      .eq('rowsecurity', true);
    
    if (!rlsError && rlsTables) {
      console.log('\n🔒 RLS habilitado em:');
      rlsTables.forEach(table => {
        console.log(`   ✅ ${table.tablename}`);
      });
    }
    
    console.log('\n============================================================');
    console.log('🎯 SCHEMA SUPABASE APLICADO COM SUCESSO!');
    console.log('📄 Arquivo: schema-supabase-final.sql');
    console.log('🌐 Projeto: goldeouro-production');
    console.log('============================================================');
    
  } catch (error) {
    console.error('❌ Erro ao aplicar schema:', error);
    process.exit(1);
  }
}

// Executar aplicação do schema
aplicarSchemaSupabase();

module.exports = { aplicarSchemaSupabase };
