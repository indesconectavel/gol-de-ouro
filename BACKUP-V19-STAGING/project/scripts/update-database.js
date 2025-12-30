const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const env = require('../config/env');

async function updateDatabase() {
  const pool = new Pool({
    connectionString: env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔄 Iniciando atualização do banco de dados...');

    // Ler o arquivo de schema
    const schemaPath = path.join(__dirname, '..', 'database-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Executar o schema
    await pool.query(schema);
    console.log('✅ Schema do banco de dados atualizado com sucesso!');

    // Verificar se as novas tabelas foram criadas
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('pix_payments', 'mercado_pago_webhooks')
      ORDER BY table_name
    `);

    console.log('📋 Tabelas de pagamento criadas:');
    tablesResult.rows.forEach(row => {
      console.log(`   ✅ ${row.table_name}`);
    });

    // Verificar índices
    const indexesResult = await pool.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename IN ('pix_payments', 'mercado_pago_webhooks')
      ORDER BY indexname
    `);

    console.log('🔍 Índices criados:');
    indexesResult.rows.forEach(row => {
      console.log(`   ✅ ${row.indexname}`);
    });

    console.log('🎉 Atualização do banco de dados concluída!');

  } catch (error) {
    console.error('❌ Erro ao atualizar banco de dados:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  updateDatabase();
}

module.exports = updateDatabase;
