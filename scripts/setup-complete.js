const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuração temporária
const config = require('../config-temp');

async function setupComplete() {
  console.log('🚀 Iniciando configuração completa do sistema...');
  
  // 1. Verificar se o banco está acessível
  console.log('📊 Verificando conexão com banco de dados...');
  
  // Verificar se a DATABASE_URL está configurada
  if (!config.DATABASE_URL || config.DATABASE_URL.includes('user:password@host:port')) {
    console.log('⚠️  DATABASE_URL não configurada ou usando valores padrão');
    console.log('💡 Configure a URL real do seu banco PostgreSQL no config-temp.js');
    console.log('   Exemplo: postgresql://usuario:senha@host:porta/database?sslmode=require');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: config.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    // Testar conexão
    await pool.query('SELECT NOW()');
    console.log('✅ Conexão com banco de dados OK!');
    
    // 2. Executar schema
    console.log('🔄 Executando schema do banco de dados...');
    const schemaPath = path.join(__dirname, '..', 'database-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    await pool.query(schema);
    console.log('✅ Schema executado com sucesso!');
    
    // 3. Verificar tabelas criadas
    console.log('📋 Verificando tabelas criadas...');
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📊 Tabelas disponíveis:');
    tablesResult.rows.forEach(row => {
      console.log(`   ✅ ${row.table_name}`);
    });
    
    // 4. Verificar se as tabelas de pagamento foram criadas
    const pixTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('pix_payments', 'mercado_pago_webhooks')
      ORDER BY table_name
    `);
    
    if (pixTables.rows.length === 2) {
      console.log('🎉 Tabelas de pagamento PIX criadas com sucesso!');
    } else {
      console.log('⚠️  Algumas tabelas de pagamento podem não ter sido criadas');
    }
    
    // 5. Testar inserção de dados de exemplo
    console.log('🧪 Testando inserção de dados...');
    
    // Verificar se já existem usuários
    const userCount = await pool.query('SELECT COUNT(*) FROM users');
    console.log(`👥 Usuários no banco: ${userCount.rows[0].count}`);
    
    if (parseInt(userCount.rows[0].count) === 0) {
      console.log('📝 Inserindo usuário de teste...');
      await pool.query(`
        INSERT INTO users (name, email, password_hash, balance) 
        VALUES ('Usuário Teste', 'teste@goldeouro.com', '$2a$10$test.hash.here', 100.00)
        ON CONFLICT (email) DO NOTHING
      `);
      console.log('✅ Usuário de teste criado!');
    }
    
    console.log('🎉 Configuração completa finalizada!');
    console.log('');
    console.log('📋 Próximos passos:');
    console.log('1. Crie o arquivo .env com suas credenciais reais');
    console.log('2. Configure as credenciais de produção do Mercado Pago');
    console.log('3. Teste o sistema de pagamentos PIX');
    
  } catch (error) {
    console.error('❌ Erro durante a configuração:', error.message);
    
    if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      console.log('');
      console.log('💡 Dica: Verifique se a DATABASE_URL está correta no config-temp.js');
      console.log('   Exemplo: postgresql://usuario:senha@host:porta/database?sslmode=require');
    }
    
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  setupComplete();
}

module.exports = setupComplete;
