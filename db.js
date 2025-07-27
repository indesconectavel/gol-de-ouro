// db.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('connect', () => {
  console.log('🟢 Conectado ao banco PostgreSQL com sucesso!');
});

pool.on('error', (err) => {
  console.error('🔴 Erro na conexão com o banco de dados:', err);
});

module.exports = pool;
