const { Pool } = require('pg');

// Configuração para produção
const pool = new Pool({
  connectionString: 'postgresql://postgres.uatszaqzdqcwnfbipoxg:cryFE1cxWfvPxcj9@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
  ssl: {
    rejectUnauthorized: false
  },
  max: 1,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

async function seedProductionDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Iniciando seed do banco de produção...');
    
    // Verificar se já existem dados
    const existingUsers = await client.query('SELECT COUNT(*) FROM users WHERE id > 10');
    if (existingUsers.rows[0].count > 0) {
      console.log('✅ Dados já existem no banco de produção');
      return;
    }
    
    // Dados fictícios
    const usersData = [
      { name: 'João Silva', email: 'joao@email.com', balance: 150.00 },
      { name: 'Maria Santos', email: 'maria@email.com', balance: 200.50 },
      { name: 'Pedro Costa', email: 'pedro@email.com', balance: 75.25 },
      { name: 'Ana Oliveira', email: 'ana@email.com', balance: 300.00 },
      { name: 'Carlos Lima', email: 'carlos@email.com', balance: 125.75 }
    ];
    
    const gamesData = [
      { status: 'waiting' },
      { status: 'active' },
      { status: 'active' },
      { status: 'finished' },
      { status: 'finished' }
    ];
    
    // Inserir usuários
    console.log('👥 Inserindo usuários...');
    for (const user of usersData) {
      await client.query(
        'INSERT INTO users (name, email, balance, created_at) VALUES ($1, $2, $3, NOW())',
        [user.name, user.email, user.balance]
      );
    }
    
    // Inserir jogos
    console.log('🎮 Inserindo jogos...');
    for (const game of gamesData) {
      await client.query(
        'INSERT INTO games (status, created_at) VALUES ($1, NOW())',
        [game.status]
      );
    }
    
    // Inserir apostas
    console.log('💰 Inserindo apostas...');
    for (let i = 1; i <= 10; i++) {
      await client.query(
        'INSERT INTO bets (user_id, amount, choice, game_id, status, prize) VALUES ($1, $2, $3, $4, $5, $6)',
        [i % 5 + 1, 10.00, 'gol', i % 5 + 1, 'pending', 0.00]
      );
    }
    
    // Inserir fila
    console.log('🎯 Inserindo fila...');
    for (let i = 1; i <= 18; i++) {
      await client.query(
        'INSERT INTO queue_board (user_id, position, status) VALUES ($1, $2, $3)',
        [i % 5 + 1, i, 'waiting']
      );
    }
    
    console.log('✅ Seed do banco de produção concluído!');
    
  } catch (error) {
    console.error('❌ Erro no seed:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

seedProductionDatabase();
