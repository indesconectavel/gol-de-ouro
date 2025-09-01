const { Pool } = require('pg');
const env = require('../config/env');

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function createBetsTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        amount DECIMAL(10,2) NOT NULL,
        choice VARCHAR(100) NOT NULL,
        game_id INTEGER NOT NULL REFERENCES games(id),
        status VARCHAR(50) DEFAULT 'pending',
        prize DECIMAL(10,2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Tabela bets criada com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao criar tabela bets:', error.message);
  } finally {
    await pool.end();
  }
}

createBetsTable();
