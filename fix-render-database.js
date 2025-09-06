#!/usr/bin/env node
// Script para corrigir problema de banco de dados no Render
// Executa: node fix-render-database.js

const { Pool } = require('pg');
require('dotenv').config();

console.log('🔧 Iniciando correção do banco de dados...');

// Configuração da conexão
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

const fixDatabase = async () => {
  try {
    console.log('📊 Conectando ao banco...');
    
    // 1. Verificar se as tabelas existem
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'games', 'payments', 'shots', 'notifications', 'metrics', 'sessions')
    `);
    
    console.log(`📋 Tabelas encontradas: ${tablesResult.rows.length}`);
    
    // 2. Se não existem todas as tabelas, criar
    if (tablesResult.rows.length < 7) {
      console.log('🏗️ Criando tabelas...');
      
      // Dropar tabelas existentes se houver conflito
      await pool.query('DROP TABLE IF EXISTS sessions CASCADE');
      await pool.query('DROP TABLE IF EXISTS metrics CASCADE');
      await pool.query('DROP TABLE IF EXISTS notifications CASCADE');
      await pool.query('DROP TABLE IF EXISTS shots CASCADE');
      await pool.query('DROP TABLE IF EXISTS payments CASCADE');
      await pool.query('DROP TABLE IF EXISTS games CASCADE');
      await pool.query('DROP TABLE IF EXISTS users CASCADE');
      
      // Criar tabelas na ordem correta
      await pool.query(`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          balance DECIMAL(10,2) DEFAULT 0.00,
          account_status VARCHAR(50) DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      await pool.query(`
        CREATE TABLE games (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          bet_amount DECIMAL(10,2) NOT NULL,
          total_shots INTEGER DEFAULT 5,
          shots_taken INTEGER DEFAULT 0,
          status VARCHAR(50) DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      await pool.query(`
        CREATE TABLE payments (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          amount DECIMAL(10,2) NOT NULL,
          description TEXT,
          status VARCHAR(50) DEFAULT 'pending',
          qr_code TEXT,
          pix_code TEXT,
          mercadopago_id VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          expires_at TIMESTAMP,
          approved_at TIMESTAMP
        )
      `);
      
      await pool.query(`
        CREATE TABLE shots (
          id SERIAL PRIMARY KEY,
          game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          zone VARCHAR(10) NOT NULL,
          goalie_direction VARCHAR(10) NOT NULL,
          result VARCHAR(10) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      await pool.query(`
        CREATE TABLE notifications (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          type VARCHAR(50) DEFAULT 'info',
          read_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      await pool.query(`
        CREATE TABLE metrics (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          metric_type VARCHAR(100) NOT NULL,
          metric_value DECIMAL(15,2) NOT NULL,
          metadata JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      await pool.query(`
        CREATE TABLE sessions (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          token_hash VARCHAR(255) NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Criar índices
      await pool.query('CREATE INDEX idx_users_email ON users(email)');
      await pool.query('CREATE INDEX idx_games_user_id ON games(user_id)');
      await pool.query('CREATE INDEX idx_games_status ON games(status)');
      await pool.query('CREATE INDEX idx_payments_user_id ON payments(user_id)');
      await pool.query('CREATE INDEX idx_payments_status ON payments(status)');
      await pool.query('CREATE INDEX idx_shots_game_id ON shots(game_id)');
      await pool.query('CREATE INDEX idx_notifications_user_id ON notifications(user_id)');
      await pool.query('CREATE INDEX idx_metrics_user_id ON metrics(user_id)');
      await pool.query('CREATE INDEX idx_sessions_user_id ON sessions(user_id)');
      await pool.query('CREATE INDEX idx_sessions_token_hash ON sessions(token_hash)');
      
      // Inserir usuário admin
      await pool.query(`
        INSERT INTO users (name, email, password_hash, balance, account_status) 
        VALUES ('Admin', 'admin@goldeouro.lol', '$2b$10$rQZ8K9L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6A7B8C9D0E1F2G3H4I5J6K', 1000.00, 'active')
        ON CONFLICT (email) DO NOTHING
      `);
      
      console.log('✅ Banco de dados corrigido com sucesso!');
    } else {
      console.log('✅ Banco de dados já está correto');
    }
    
    // 3. Testar conexão
    const testResult = await pool.query('SELECT COUNT(*) as count FROM users');
    console.log(`📊 Usuários no banco: ${testResult.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Erro ao corrigir banco:', error);
    throw error;
  } finally {
    await pool.end();
  }
};

fixDatabase()
  .then(() => {
    console.log('🎉 Correção concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Falha na correção:', error);
    process.exit(1);
  });
