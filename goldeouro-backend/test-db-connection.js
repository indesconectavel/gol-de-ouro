const pool = require('./db');

async function testConnection() {
  try {
    console.log('🔍 Testando conexão com banco de dados...');
    
    // Testar conexão básica
    const result = await pool.query('SELECT NOW() as current_time');
    console.log('✅ Conexão com banco OK:', result.rows[0].current_time);
    
    // Contar usuários
    const users = await pool.query('SELECT COUNT(*) FROM users');
    console.log('👥 Total de usuários:', users.rows[0].count);
    
    // Listar alguns usuários
    const sampleUsers = await pool.query('SELECT id, name, email, balance FROM users LIMIT 5');
    console.log('📋 Amostra de usuários:');
    sampleUsers.rows.forEach(user => {
      console.log(`   - ${user.name} (${user.email}): R$ ${user.balance}`);
    });
    
    // Verificar tabelas PIX
    const pixPayments = await pool.query('SELECT COUNT(*) FROM pix_payments');
    console.log('💳 Pagamentos PIX:', pixPayments.rows[0].count);
    
    // Verificar transações
    const transactions = await pool.query('SELECT COUNT(*) FROM transactions');
    console.log('💰 Transações:', transactions.rows[0].count);
    
    // Verificar apostas
    const bets = await pool.query('SELECT COUNT(*) FROM bets');
    console.log('⚽ Apostas:', bets.rows[0].count);
    
    console.log('✅ Teste concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

testConnection();
