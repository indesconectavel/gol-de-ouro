// Script para criar tabelas no Supabase
const { createClient } = require('@supabase/supabase-js');

// Credenciais do Supabase
const supabaseUrl = 'https://uatszaqzdqcwnfbipoxg.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhdHN6YXF6ZHFjd25mYmlwb3hnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY2NDcyMSwiZXhwIjoyMDY5MjQwNzIxfQ.g3nkaT7-eFCnUc66hLwPUx2sCgiUXfsvCZw1ncHHeIY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTables() {
  console.log('🔧 CRIANDO TABELAS NO SUPABASE...');
  
  try {
    // 1. Criar tabela de usuários
    console.log('1. Criando tabela users...');
    const { error: usersError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS users (
          id BIGSERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          balance DECIMAL(10,2) DEFAULT 0.00,
          account_status VARCHAR(50) DEFAULT 'active',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (usersError) {
      console.log('❌ Erro ao criar tabela users:', usersError.message);
    } else {
      console.log('✅ Tabela users criada com sucesso');
    }

    // 2. Criar tabela de jogos
    console.log('2. Criando tabela games...');
    const { error: gamesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS games (
          id BIGSERIAL PRIMARY KEY,
          user_id BIGINT REFERENCES users(id),
          amount DECIMAL(10,2) NOT NULL,
          direction VARCHAR(50) NOT NULL,
          is_goal BOOLEAN DEFAULT FALSE,
          prize DECIMAL(10,2) DEFAULT 0.00,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (gamesError) {
      console.log('❌ Erro ao criar tabela games:', gamesError.message);
    } else {
      console.log('✅ Tabela games criada com sucesso');
    }

    // 3. Criar tabela de transações
    console.log('3. Criando tabela transactions...');
    const { error: transactionsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS transactions (
          id BIGSERIAL PRIMARY KEY,
          user_id BIGINT REFERENCES users(id),
          type VARCHAR(50) NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          status VARCHAR(50) DEFAULT 'pending',
          external_id VARCHAR(255),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (transactionsError) {
      console.log('❌ Erro ao criar tabela transactions:', transactionsError.message);
    } else {
      console.log('✅ Tabela transactions criada com sucesso');
    }

    // 4. Criar índices
    console.log('4. Criando índices...');
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_games_user_id ON games(user_id);
        CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
        CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
      `
    });
    
    if (indexError) {
      console.log('❌ Erro ao criar índices:', indexError.message);
    } else {
      console.log('✅ Índices criados com sucesso');
    }

    // 5. Testar conexão
    console.log('5. Testando conexão...');
    const { data, error: testError } = await supabase.from('users').select('count').limit(1);
    
    if (testError) {
      console.log('❌ Erro no teste:', testError.message);
    } else {
      console.log('✅ Conexão testada com sucesso!');
      console.log('📊 Dados retornados:', data);
    }

    console.log('\n🎉 CONFIGURAÇÃO CONCLUÍDA!');
    console.log('O backend agora deve conectar com o Supabase real.');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

createTables();
