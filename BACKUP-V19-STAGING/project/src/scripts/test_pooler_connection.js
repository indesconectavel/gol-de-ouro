/**
 * TEST POOLER CONNECTION - Validação da conexão via Session Pooler
 */

require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    console.log("🔄 Testando conexão ao Session Pooler...");
    console.log(`   URL: ${process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/:[^:@]+@/, ':***@') : 'NÃO CONFIGURADA'}`);
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL não configurada no .env.local');
    }
    
    await client.connect();
    console.log("✅ Cliente conectado ao Session Pooler");
    
    const res = await client.query("SELECT NOW() as current_time, version() as pg_version");
    console.log("✅ Conectado ao Session Pooler com sucesso!");
    console.log(`   Timestamp: ${res.rows[0].current_time}`);
    console.log(`   PostgreSQL: ${res.rows[0].pg_version.split(' ')[0]} ${res.rows[0].pg_version.split(' ')[1]}`);
    
    // Testar acesso a tabelas
    try {
      const tablesRes = await client.query(`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      console.log(`   Tabelas públicas: ${tablesRes.rows[0].count}`);
    } catch (e) {
      console.log(`   ⚠️  Não foi possível contar tabelas: ${e.message}`);
    }
    
    process.exit(0);
  } catch (err) {
    console.error("❌ Falha ao conectar via Session Pooler:", err.message);
    console.error(`   Código: ${err.code || 'N/A'}`);
    
    if (err.message.includes('ENOTFOUND')) {
      console.error("   💡 Verifique se o host está correto");
    } else if (err.message.includes('timeout')) {
      console.error("   💡 Verifique conectividade de rede");
    } else if (err.message.includes('password')) {
      console.error("   💡 Verifique se a senha está correta");
    }
    
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();

