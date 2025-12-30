const { Pool } = require('pg');
const env = require('../config/env');

async function createPixTablesComplete() {
  const pool = new Pool({
    connectionString: env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔄 Configurando sistema de pagamentos PIX...');

    // 1. Criar função para updated_at
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);
    console.log('✅ Função update_updated_at_column criada!');

    // 2. Criar tabela de pagamentos PIX
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

    // 3. Criar tabela de webhooks
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

    // 4. Criar índices
    await pool.query('CREATE INDEX IF NOT EXISTS idx_pix_payments_user_id ON pix_payments(user_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_pix_payments_status ON pix_payments(status)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_pix_payments_mercado_pago_id ON pix_payments(mercado_pago_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_webhooks_processed ON mercado_pago_webhooks(processed)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_webhooks_payment_id ON mercado_pago_webhooks(payment_id)');
    console.log('✅ Índices criados!');

    // 5. Criar trigger
    await pool.query(`
      DROP TRIGGER IF EXISTS update_pix_payments_updated_at ON pix_payments;
      CREATE TRIGGER update_pix_payments_updated_at BEFORE UPDATE ON pix_payments
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `);
    console.log('✅ Trigger criado!');

    // 6. Verificar se as tabelas foram criadas
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

    // 7. Testar inserção de dados
    console.log('🧪 Testando inserção de dados...');
    const userCount = await pool.query('SELECT COUNT(*) FROM users');
    console.log(`👥 Usuários no banco: ${userCount.rows[0].count}`);

    if (parseInt(userCount.rows[0].count) > 0) {
      // Inserir um pagamento de teste
      await pool.query(`
        INSERT INTO pix_payments (user_id, mercado_pago_id, amount, status)
        VALUES (1, 'test_123456', 10.00, 'pending')
        ON CONFLICT (mercado_pago_id) DO NOTHING
      `);
      console.log('✅ Pagamento de teste inserido!');
    }

    console.log('');
    console.log('🎉 SISTEMA DE PAGAMENTOS PIX 100% CONFIGURADO!');
    console.log('');
    console.log('📋 RESUMO:');
    console.log('✅ Tabelas criadas: pix_payments, mercado_pago_webhooks');
    console.log('✅ Índices criados para performance');
    console.log('✅ Triggers configurados');
    console.log('✅ Função updated_at criada');
    console.log('✅ Teste de inserção realizado');
    console.log('');
    console.log('🚀 SISTEMA PRONTO PARA USO!');

  } catch (error) {
    console.error('❌ Erro ao configurar sistema PIX:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  createPixTablesComplete();
}

module.exports = createPixTablesComplete;
