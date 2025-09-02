const { Pool } = require('pg');
const env = require('../config/env');

// Configurar conexão com o banco
const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function addTestBalance() {
  try {
    console.log('💰 Adicionando saldo de teste para usuários...');
    
    // Adicionar saldo para usuários 1-5
    for (let userId = 1; userId <= 5; userId++) {
      await pool.query(
        'UPDATE users SET balance = balance + 10.00 WHERE id = $1',
        [userId]
      );
      
      // Registrar transação
      await pool.query(
        'INSERT INTO transactions (user_id, amount, type) VALUES ($1, $2, $3)',
        [userId, 10.00, 'deposit']
      );
      
      console.log(`✅ Usuário ${userId}: R$ 10,00 adicionados`);
    }
    
    console.log('🎉 Saldo de teste adicionado com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao adicionar saldo:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  addTestBalance();
}

module.exports = addTestBalance;
