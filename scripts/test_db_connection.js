/**
 * TEST DB CONNECTION - Validação da DATABASE_URL
 * Script temporário para testar conexão com Supabase
 */

require('dotenv').config({ path: '.env.local' });

const { Pool } = require('pg');

async function testConnection() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ ERRO: DATABASE_URL não configurada no .env.local');
    console.error('   Configure a variável DATABASE_URL antes de executar este teste');
    process.exit(1);
  }
  
  console.log('🔍 Testando conexão com banco de dados...');
  console.log(`   Host: ${databaseUrl.match(/@([^:]+)/)?.[1] || 'N/A'}`);
  
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 5000
  });
  
  try {
    const result = await pool.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ DATABASE_URL OK — conexão estabelecida com sucesso!');
    console.log(`   Hora do servidor: ${result.rows[0].current_time}`);
    console.log(`   PostgreSQL: ${result.rows[0].pg_version.split(' ')[0]} ${result.rows[0].pg_version.split(' ')[1]}`);
    
    // Testar acesso a uma tabela
    try {
      const tableTest = await pool.query("SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public'");
      console.log(`   Tabelas públicas encontradas: ${tableTest.rows[0].count}`);
    } catch (e) {
      console.log(`   ⚠️  Não foi possível listar tabelas: ${e.message}`);
    }
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ ERRO: DATABASE_URL inválida ou banco inacessível');
    console.error(`   Mensagem: ${error.message}`);
    
    if (error.message.includes('password authentication failed')) {
      console.error('   💡 Verifique se a senha está correta');
    } else if (error.message.includes('timeout')) {
      console.error('   💡 Verifique se o host está acessível (problema de IPv4?)');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      console.error('   💡 Verifique se o host está correto');
    }
    
    await pool.end();
    process.exit(1);
  }
}

testConnection();

