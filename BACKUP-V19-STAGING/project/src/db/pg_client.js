/**
 * PG CLIENT - Cliente PostgreSQL direto (alternativa ao Supabase)
 * Usado para operações que requerem controle fino sobre conexões
 */

const { Pool } = require('pg');

let pool = null;

function getPool() {
  if (!pool) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL não configurada');
    }

    pool = new Pool({
      connectionString: databaseUrl,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    pool.on('error', (err) => {
      console.error('❌ [PG-CLIENT] Erro inesperado no pool:', err);
    });
  }

  return pool;
}

async function query(text, params) {
  const client = getPool();
  const start = Date.now();
  
  try {
    const res = await client.query(text, params);
    const duration = Date.now() - start;
    
    if (duration > 1000) {
      console.warn(`⚠️  [PG-CLIENT] Query lenta (${duration}ms): ${text.substring(0, 100)}...`);
    }
    
    return res;
  } catch (error) {
    console.error('❌ [PG-CLIENT] Erro na query:', error.message);
    console.error('Query:', text.substring(0, 200));
    throw error;
  }
}

async function transaction(callback) {
  const client = await getPool().connect();
  
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
}

async function close() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = {
  query,
  transaction,
  getPool,
  close
};

