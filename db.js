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
      // OTIMIZAÇÕES DE MEMÓRIA: Reduzir conexões para economizar memória
      max: 1, // Reduzir de 2 para 1
      min: 0,
      idleTimeoutMillis: 5000, // Reduzir de 10000 para 5000
      connectionTimeoutMillis: 3000, // Reduzir de 5000 para 3000
      acquireTimeoutMillis: 3000, // Reduzir de 5000 para 3000
      // Configurações específicas para resolver SASL
      statement_timeout: 15000, // Reduzir de 30000 para 15000
      query_timeout: 15000, // Reduzir de 30000 para 15000
      // OTIMIZAÇÕES ADICIONAIS DE MEMÓRIA
      maxUses: 1000, // Reciclar conexões após 1000 usos
      allowExitOnIdle: true // Permitir saída quando idle
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

// OTIMIZAÇÃO DE MEMÓRIA: Limpeza automática de conexões
setInterval(() => {
  // Forçar limpeza de conexões inativas
  if (pool.totalCount > 0) {
    pool.end().then(() => {
      console.log('🧹 Pool de conexões limpo para economizar memória');
    }).catch(err => {
      console.log('⚠️ Erro ao limpar pool:', err.message);
    });
  }
}, 300000); // A cada 5 minutos

// Limpeza de emergência quando memória estiver alta
process.on('SIGTERM', async () => {
  console.log('🔄 Fechando conexões de banco...');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🔄 Fechando conexões de banco...');
  await pool.end();
  process.exit(0);
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
