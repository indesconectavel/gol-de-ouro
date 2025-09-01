// test-db.js - Teste de conexão com banco de dados
const pool = require('./db');
const env = require('./config/env');

async function testDatabase() {
  console.log('🔧 Configuração de ambiente carregada:');
  console.log(`   📍 Porta: ${env.PORT}`);
  console.log(`   🌐 CORS Origins: ${env.CORS_ORIGINS}`);
  console.log(`   🔐 JWT Secret: ${env.JWT_SECRET.substring(0, 8)}...`);
  console.log(`   🛡️ Admin Token: ${env.ADMIN_TOKEN.substring(0, 8)}...`);
  console.log(`   🗄️ Database: ${env.DATABASE_URL.split('@')[1] || 'URL oculta'}`);
  
  try {
    console.log('\n🧪 Testando conexão com banco...');
    
    // Usar a nova função de teste
    const result = await pool.testConnection();
    
    if (result.success) {
      console.log('✅ Conexão com banco OK!');
      console.log(`   ⏰ Hora atual: ${result.currentTime}`);
      console.log(`   🗄️ Versão: ${result.version.split(' ')[0]} ${result.version.split(' ')[1]}`);
      
      // Testar query simples
      const testQuery = await pool.query('SELECT 1 as test_value');
      console.log(`   🔍 Query de teste: ${testQuery.rows[0].test_value}`);
      
    } else {
      console.log('❌ Falha na conexão com banco');
      console.log(`   🚨 Erro: ${result.error}`);
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar banco:', error.message);
  } finally {
    await pool.end();
    console.log('\n🔌 Conexão fechada');
  }
}

// Executar teste
testDatabase().catch(console.error);
