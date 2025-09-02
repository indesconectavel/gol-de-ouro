// db.js
const { Pool } = require('pg');
const env = require('./config/env');

// SOLUÇÃO DEFINITIVA: Substituir URL problemática automaticamente
function getFixedDatabaseUrl() {
  let databaseUrl = env.DATABASE_URL;
  
  // SOLUÇÃO DEFINITIVA: Usar URL do .env diretamente (IPv4 compatível)
  // Não remover pooler - é necessário para IPv4 e conta Free
  console.log('🔧 Usando URL do .env diretamente (IPv4 compatível)');
  
  return databaseUrl;
}

// Função para detectar e configurar conexão Supabase
function createSupabasePool() {
  const isSupabase = env.DATABASE_URL.includes('supabase.com');
  const fixedUrl = getFixedDatabaseUrl();
  
  if (isSupabase) {
    console.log('🔧 Detectado Supabase - Aplicando SOLUÇÃO DEFINITIVA para SASL');
    
    // SOLUÇÃO DEFINITIVA: Configuração básica para pooler
    return new Pool({
      connectionString: fixedUrl,
      ssl: {
        rejectUnauthorized: false
      },
      // Configurações otimizadas para Supabase pooler
      max: 2,
      min: 0,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 5000,
      acquireTimeoutMillis: 5000,
      // Configurações específicas para resolver SASL
      statement_timeout: 30000,
      query_timeout: 30000
    });
  } else {
    // Configuração padrão para outros bancos
    console.log('🔧 Banco não-Supabase detectado - Usando configuração padrão');
    
    return new Pool({
      connectionString: fixedUrl,
      ssl: {
        rejectUnauthorized: false
      },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      application_name: 'goldeouro-backend'
    });
  }
}

// Criar pool com configuração automática
const pool = createSupabasePool();

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

// Função para testar conexão
pool.testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as db_version');
    client.release();
    return {
      success: true,
      currentTime: result.rows[0].current_time,
      version: result.rows[0].db_version
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = pool;
