// Script para testar conexão com Supabase usando credenciais reais
const { createClient } = require('@supabase/supabase-js');

// Credenciais reais do Supabase
const supabaseUrl = 'https://gayopagjdrkcmkirmfvy.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdheW9wYWdqZHJrY21raXJtZnZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDAyMDY2OSwiZXhwIjoyMDc1NTk2NjY5fQ.BjmwUSoKDksHybO9pta71F4E5RyILNeuK_FRzxkPnqU';

async function testSupabaseConnection() {
  console.log('🔍 Testando conexão com Supabase...');
  console.log('📡 URL:', supabaseUrl);
  console.log('🔑 Service Key configurada:', supabaseServiceKey ? 'Sim' : 'Não');
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Testar conexão básica
    console.log('🔄 Testando conexão básica...');
    const { data, error } = await supabase.from('usuarios').select('id').limit(1);
    
    if (error) {
      console.log('❌ Erro na conexão:', error.message);
      console.log('🔍 Código do erro:', error.code);
      console.log('🔍 Detalhes:', error.details);
      
      // Se a tabela não existe, tentar criar
      if (error.code === 'PGRST116') {
        console.log('📋 Tabela usuarios não existe. Tentando criar...');
        await createTables(supabase);
      }
    } else {
      console.log('✅ Conexão com Supabase estabelecida com sucesso!');
      console.log('📊 Dados encontrados:', data);
    }
    
  } catch (error) {
    console.log('❌ Erro geral:', error.message);
  }
}

async function createTables(supabase) {
  console.log('🔧 Criando tabelas necessárias...');
  
  try {
    // Criar tabela usuarios
    const { error: usuariosError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS usuarios (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) UNIQUE NOT NULL,
          username VARCHAR(100) NOT NULL,
          senha_hash VARCHAR(255) NOT NULL,
          saldo DECIMAL(10,2) DEFAULT 0.00,
          tipo VARCHAR(50) DEFAULT 'jogador',
          ativo BOOLEAN DEFAULT true,
          email_verificado BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (usuariosError) {
      console.log('❌ Erro ao criar tabela usuarios:', usuariosError.message);
    } else {
      console.log('✅ Tabela usuarios criada com sucesso!');
    }
    
    // Criar tabela metricas_globais
    const { error: metricasError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS metricas_globais (
          id SERIAL PRIMARY KEY,
          contador_chutes_global INTEGER DEFAULT 0 NOT NULL,
          ultimo_gol_de_ouro INTEGER DEFAULT 0 NOT NULL,
          total_usuarios INTEGER DEFAULT 0,
          total_jogos INTEGER DEFAULT 0,
          total_receita DECIMAL(10,2) DEFAULT 0.00,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (metricasError) {
      console.log('❌ Erro ao criar tabela metricas_globais:', metricasError.message);
    } else {
      console.log('✅ Tabela metricas_globais criada com sucesso!');
    }
    
  } catch (error) {
    console.log('❌ Erro ao criar tabelas:', error.message);
  }
}

// Executar teste
testSupabaseConnection();