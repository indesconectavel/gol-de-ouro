// db-ultra-optimized.js - ULTRA-OTIMIZADO para Render Free Tier
const { Pool } = require('pg');
const env = require('./config/env');

// Configuração ULTRA-OTIMIZADA para economizar memória
function createUltraOptimizedPool() {
  const isSupabase = env.DATABASE_URL.includes('supabase.com');
  
  if (isSupabase) {
    console.log('🔧 Supabase detectado - Configuração ULTRA-OTIMIZADA');
    
    return new Pool({
      connectionString: env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      },
      // CONFIGURAÇÃO ULTRA-OTIMIZADA
      max: 1, // MÁXIMO 1 conexão
      min: 0, // MÍNIMO 0 conexões
      idleTimeoutMillis: 2000, // 2 segundos (muito agressivo)
      connectionTimeoutMillis: 2000, // 2 segundos
      acquireTimeoutMillis: 2000, // 2 segundos
      statement_timeout: 10000, // 10 segundos
      query_timeout: 10000, // 10 segundos
      maxUses: 50, // Reciclar após 50 usos (muito agressivo)
      allowExitOnIdle: true,
      // Configurações adicionais para economizar memória
      keepAlive: false,
      keepAliveInitialDelayMillis: 0
    });
  } else {
    console.log('🔧 Banco não-Supabase - Configuração padrão otimizada');
    
    return new Pool({
      connectionString: env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      },
      max: 1, // Reduzir drasticamente
      min: 0,
      idleTimeoutMillis: 5000,
      connectionTimeoutMillis: 5000,
      acquireTimeoutMillis: 5000,
      application_name: 'goldeouro-backend-ultra-optimized'
    });
  }
}

// Criar pool ULTRA-OTIMIZADO
const pool = createUltraOptimizedPool();

// Eventos simplificados
pool.on('connect', () => {
  if (env.NODE_ENV === 'development') {
    console.log('🟢 Conectado ao banco ULTRA-OTIMIZADO!');
  }
});

pool.on('error', (err) => {
  console.error('🔴 Erro de banco:', err.message);
});

// Limpeza AGRESSIVA a cada 2 minutos
setInterval(() => {
  if (pool.totalCount > 0) {
    pool.end().then(() => {
      console.log('🧹 Pool ULTRA-LIMPO para economizar memória');
    }).catch(err => {
      console.log('⚠️ Erro ao limpar pool:', err.message);
    });
  }
}, 120000); // A cada 2 minutos

// Limpeza de emergência
process.on('SIGTERM', async () => {
  console.log('🔄 Fechando conexões ULTRA-OTIMIZADAS...');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🔄 Fechando conexões ULTRA-OTIMIZADAS...');
  await pool.end();
  process.exit(0);
});

// Função de teste simplificada
pool.testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time');
    client.release();
    return {
      success: true,
      currentTime: result.rows[0].current_time
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = pool;
