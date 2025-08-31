// db.js
const { Pool } = require('pg');
const env = require('./config/env');

// Configuração do pool PostgreSQL usando DATABASE_URL
const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  // Configurações de pool para produção
  max: 20, // máximo de conexões
  idleTimeoutMillis: 30000, // timeout de conexões ociosas
  connectionTimeoutMillis: 2000 // timeout de conexão
});

pool.on('connect', () => {
  if (env.NODE_ENV === 'development') {
    console.log('🟢 Conectado ao banco PostgreSQL com sucesso!');
  }
});

pool.on('error', (err) => {
  console.error('🔴 Erro na conexão com o banco de dados:', err);
  // Em produção, não logar detalhes sensíveis
  if (env.NODE_ENV === 'production') {
    console.error('🔴 Erro de conexão com banco (detalhes ocultos)');
  }
});

module.exports = pool;
