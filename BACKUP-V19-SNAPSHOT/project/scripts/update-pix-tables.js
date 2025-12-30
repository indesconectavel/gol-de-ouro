const { Pool } = require('pg');
const env = require('../config/env');

async function updatePixTables() {
  const pool = new Pool({
    connectionString: env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔄 Criando tabelas de pagamentos PIX...');

    // Criar tabela de pagamentos PIX
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pix_payments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        mercado_pago_id VARCHAR(255) UNIQUE NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        pix_code TEXT,
        qr_code TEXT,
        expires_at TIMESTAMP,
        paid_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Tabela pix_payments criada!');

    // Criar tabela de webhooks
    await pool.query(`
      CREATE TABLE IF NOT EXISTS mercado_pago_webhooks (
        id SERIAL PRIMARY KEY,
        webhook_id VARCHAR(255) UNIQUE NOT NULL,
        event_type VARCHAR(100) NOT NULL,
        payment_id VARCHAR(255),
        processed BOOLEAN DEFAULT FALSE,
        payload JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Tabela mercado_pago_webhooks criada!');

    // Criar índices
    await pool.query('CREATE INDEX IF NOT EXISTS idx_pix_payments_user_id ON pix_payments(user_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_pix_payments_status ON pix_payments(status)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_pix_payments_mercado_pago_id ON pix_payments(mercado_pago_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_webhooks_processed ON mercado_pago_webhooks(processed)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_webhooks_payment_id ON mercado_pago_webhooks(payment_id)');
    console.log('✅ Índices criados!');

    // Criar trigger para updated_at
    await pool.query(`
      CREATE TRIGGER update_pix_payments_updated_at BEFORE UPDATE ON pix_payments
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `);
    console.log('✅ Trigger criado!');

    // Verificar se as tabelas foram criadas
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

    console.log('🎉 Sistema de pagamentos PIX configurado com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao criar tabelas PIX:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  updatePixTables();
}

module.exports = updatePixTables;
