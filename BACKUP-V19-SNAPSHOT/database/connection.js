// Conexão com PostgreSQL - Gol de Ouro
const { Pool } = require('pg');
require('dotenv').config();

// Configuração da conexão
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Máximo de conexões no pool
  idleTimeoutMillis: 30000, // Tempo para fechar conexões inativas
  connectionTimeoutMillis: 2000, // Tempo limite para conectar
  acquireTimeoutMillis: 60000, // Tempo limite para adquirir conexão
  maxUses: 7500, // Máximo de usos por conexão
  allowExitOnIdle: true // Permitir sair quando idle
});

// Teste de conexão
pool.on('connect', () => {
  console.log('✅ Conectado ao PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Erro no PostgreSQL:', err);
  process.exit(-1);
});

// Função para executar queries
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log(`📊 Query executada em ${duration}ms: ${text.substring(0, 50)}...`);
    return res;
  } catch (error) {
    console.error('❌ Erro na query:', error);
    throw error;
  }
};

// Função para transações
const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Função para inicializar o banco
const initDatabase = async () => {
  try {
    // Verificar se as tabelas existem
    const result = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'games', 'payments', 'shots', 'notifications', 'metrics', 'sessions')
    `);
    
    if (result.rows.length < 7) {
      console.log('🔧 Inicializando banco de dados...');
      const fs = require('fs');
      const path = require('path');
      const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
      await query(schema);
      console.log('✅ Banco de dados inicializado!');
    } else {
      console.log('✅ Banco de dados já inicializado');
    }
  } catch (error) {
    console.error('❌ Erro ao inicializar banco:', error);
    throw error;
  }
};

module.exports = {
  query,
  transaction,
  initDatabase,
  pool
};
