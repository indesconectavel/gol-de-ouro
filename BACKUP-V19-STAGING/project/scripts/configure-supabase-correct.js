#!/usr/bin/env node
/**
 * Script para configurar Supabase corretamente
 */

const { execSync } = require('child_process');

async function configureSupabase() {
  console.log('🔧 CONFIGURANDO SUPABASE CORRETAMENTE');
  console.log('====================================\n');

  // Credenciais corretas fornecidas pelo usuário
  const supabaseUrl = 'https://gayopagjdrkcmkirmfvy.supabase.co';
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdheW9wYWdqZHJrY21raXJtZnZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMjA2NjksImV4cCI6MjA3NTU5NjY2OX0.iiCn8Ygm98bR9HzNgVucafON0KzUQDN2lHNiX_rVhvI';
  const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdheW9wYWdqZHJrY21raXJtZnZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDAyMDY2OTksImV4cCI6MjA3NTU5NjY2OTl9.BjmwUSoKDksHybO9pta71F4E5RyILNeuK_FRzxkPnqU';

  console.log('📋 Configurando credenciais no Fly.io...');
  
  try {
    // Configurar URL
    console.log('1. Configurando SUPABASE_URL...');
    execSync(`fly secrets set SUPABASE_URL="${supabaseUrl}" --app goldeouro-backend`, { stdio: 'inherit' });
    
    // Configurar Anon Key
    console.log('2. Configurando SUPABASE_ANON_KEY...');
    execSync(`fly secrets set SUPABASE_ANON_KEY="${supabaseAnonKey}" --app goldeouro-backend`, { stdio: 'inherit' });
    
    // Configurar Service Key
    console.log('3. Configurando SUPABASE_SERVICE_ROLE_KEY...');
    execSync(`fly secrets set SUPABASE_SERVICE_ROLE_KEY="${supabaseServiceKey}" --app goldeouro-backend`, { stdio: 'inherit' });
    
    console.log('\n✅ Credenciais configuradas com sucesso!');
    console.log('⏳ Aguardando deploy automático...');
    
    // Aguardar deploy
    console.log('4. Aguardando 30 segundos para deploy...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    // Testar conexão
    console.log('5. Testando conexão...');
    const { createClient } = require('@supabase/supabase-js');
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { data, error } = await supabaseAdmin
      .from('usuarios')
      .select('count')
      .limit(1);

    if (error) {
      console.log('❌ Erro na conexão:', error.message);
      console.log('🔍 Possíveis causas:');
      console.log('   - Credenciais incorretas');
      console.log('   - Projeto Supabase não existe');
      console.log('   - Tabela usuarios não existe');
      console.log('   - Permissões incorretas');
    } else {
      console.log('✅ Conexão com Supabase estabelecida!');
      console.log('🎉 Sistema pronto para uso real!');
    }

  } catch (error) {
    console.error('❌ Erro ao configurar:', error.message);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  configureSupabase().catch(console.error);
}

module.exports = configureSupabase;
