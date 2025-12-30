const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const env = require('../config/env');

// Configuração do pool de conexão
const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 1,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

// Dados fictícios para popular as tabelas
const usersData = [
  { name: 'João Silva', email: 'joao@goldeouro.com', password: '123456', balance: 150.50 },
  { name: 'Maria Santos', email: 'maria@goldeouro.com', password: '123456', balance: 75.25 },
  { name: 'Pedro Costa', email: 'pedro@goldeouro.com', password: '123456', balance: 200.00 },
  { name: 'Ana Oliveira', email: 'ana@goldeouro.com', password: '123456', balance: 50.75 },
  { name: 'Carlos Lima', email: 'carlos@goldeouro.com', password: '123456', balance: 300.00 },
  { name: 'Lucia Ferreira', email: 'lucia@goldeouro.com', password: '123456', balance: 125.80 },
  { name: 'Roberto Alves', email: 'roberto@goldeouro.com', password: '123456', balance: 80.30 },
  { name: 'Fernanda Rocha', email: 'fernanda@goldeouro.com', password: '123456', balance: 250.60 },
  { name: 'Marcos Souza', email: 'marcos@goldeouro.com', password: '123456', balance: 95.40 },
  { name: 'Juliana Martins', email: 'juliana@goldeouro.com', password: '123456', balance: 180.90 }
];

const gamesData = [
  { players: [1, 2], currentPlayer: 1, gameStatus: 'active', winnerUserId: null, prizeAmount: 50.00 },
  { players: [3, 4], currentPlayer: 3, gameStatus: 'finished', winnerUserId: 3, prizeAmount: 75.00 },
  { players: [5, 6], currentPlayer: 5, gameStatus: 'active', winnerUserId: null, prizeAmount: 100.00 },
  { players: [7, 8], currentPlayer: 7, gameStatus: 'waiting', winnerUserId: null, prizeAmount: 25.00 },
  { players: [9, 10], currentPlayer: 9, gameStatus: 'finished', winnerUserId: 10, prizeAmount: 60.00 }
];

const betsData = [
  { userId: 1, gameId: 1, amount: 10.00, choice: 'esquerda', result: 'pending' },
  { userId: 2, gameId: 1, amount: 15.00, choice: 'direita', result: 'pending' },
  { userId: 3, gameId: 2, amount: 20.00, choice: 'esquerda', result: 'won' },
  { userId: 4, gameId: 2, amount: 25.00, choice: 'direita', result: 'lost' },
  { userId: 5, gameId: 3, amount: 30.00, choice: 'esquerda', result: 'pending' },
  { userId: 6, gameId: 3, amount: 35.00, choice: 'direita', result: 'pending' },
  { userId: 7, gameId: 4, amount: 12.00, choice: 'esquerda', result: 'pending' },
  { userId: 8, gameId: 4, amount: 18.00, choice: 'direita', result: 'pending' },
  { userId: 9, gameId: 5, amount: 22.00, choice: 'esquerda', result: 'lost' },
  { userId: 10, gameId: 5, amount: 28.00, choice: 'direita', result: 'won' }
];

const queueData = [
  { userId: 1, position: 1, status: 'waiting', hasShot: false, scoredGoal: false },
  { userId: 2, position: 2, status: 'waiting', hasShot: false, scoredGoal: false },
  { userId: 3, position: 3, status: 'waiting', hasShot: false, scoredGoal: false },
  { userId: 4, position: 4, status: 'waiting', hasShot: false, scoredGoal: false },
  { userId: 5, position: 5, status: 'waiting', hasShot: false, scoredGoal: false }
];

const transactionsData = [
  { userId: 1, type: 'deposit', amount: 100.00, description: 'Depósito inicial' },
  { userId: 1, type: 'bet', amount: -10.00, description: 'Aposta no jogo #1' },
  { userId: 2, type: 'deposit', amount: 50.00, description: 'Depósito inicial' },
  { userId: 2, type: 'bet', amount: -15.00, description: 'Aposta no jogo #1' },
  { userId: 3, type: 'deposit', amount: 200.00, description: 'Depósito inicial' },
  { userId: 3, type: 'bet', amount: -20.00, description: 'Aposta no jogo #2' },
  { userId: 3, type: 'win', amount: 75.00, description: 'Vitória no jogo #2' },
  { userId: 4, type: 'deposit', amount: 75.00, description: 'Depósito inicial' },
  { userId: 4, type: 'bet', amount: -25.00, description: 'Aposta no jogo #2' },
  { userId: 5, type: 'deposit', amount: 300.00, description: 'Depósito inicial' }
];

const shotAttemptsData = [
  { userId: 1, gameId: 1, choice: 'esquerda', result: 'missed', timestamp: new Date() },
  { userId: 2, gameId: 1, choice: 'direita', result: 'missed', timestamp: new Date() },
  { userId: 3, gameId: 2, choice: 'esquerda', result: 'scored', timestamp: new Date() },
  { userId: 4, gameId: 2, choice: 'direita', result: 'missed', timestamp: new Date() },
  { userId: 5, gameId: 3, choice: 'esquerda', result: 'missed', timestamp: new Date() }
];

async function seedDatabase() {
  console.log('🌱 Iniciando seed do banco de dados...');
  
  let client;
  try {
    client = await pool.connect();
    console.log('✅ Conectado ao banco de dados');

    // Inserir dados de seed (ignorar se já existirem)
    console.log('🌱 Inserindo dados de seed...');

    // Inserir usuários
    console.log('👥 Inserindo usuários...');
    for (const user of usersData) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      try {
        await client.query(
          'INSERT INTO users (name, email, password_hash, balance, account_status, created_at) VALUES ($1, $2, $3, $4, $5, NOW())',
          [user.name, user.email, hashedPassword, user.balance, 'active']
        );
      } catch (error) {
        if (error.code === '23505') { // Duplicate key
          console.log(`⚠️ Usuário ${user.email} já existe, pulando...`);
        } else {
          throw error;
        }
      }
    }

    // Inserir jogos
    console.log('🎮 Inserindo jogos...');
    for (const game of gamesData) {
      try {
        await client.query(
          'INSERT INTO games (status, created_at) VALUES ($1, NOW())',
          [game.gameStatus]
        );
      } catch (error) {
        console.log(`⚠️ Erro ao inserir jogo: ${error.message}`);
      }
    }

    // Inserir apostas
    console.log('💰 Inserindo apostas...');
    for (const bet of betsData) {
      try {
        await client.query(
          'INSERT INTO bets (user_id, game_id, amount, choice, status, created_at) VALUES ($1, $2, $3, $4, $5, NOW())',
          [bet.userId, bet.gameId, bet.amount, bet.choice, bet.result]
        );
      } catch (error) {
        console.log(`⚠️ Erro ao inserir aposta: ${error.message}`);
      }
    }

    // Inserir fila
    console.log('📋 Inserindo fila...');
    for (const queue of queueData) {
      try {
        await client.query(
          'INSERT INTO queue_board (user_id, position, status, created_at) VALUES ($1, $2, $3, NOW())',
          [queue.userId, queue.position, queue.status]
        );
      } catch (error) {
        console.log(`⚠️ Erro ao inserir fila: ${error.message}`);
      }
    }

    // Inserir transações
    console.log('💳 Inserindo transações...');
    for (const transaction of transactionsData) {
      try {
        await client.query(
          'INSERT INTO transactions (user_id, type, amount, description, created_at) VALUES ($1, $2, $3, $4, NOW())',
          [transaction.userId, transaction.type, transaction.amount, transaction.description]
        );
      } catch (error) {
        console.log(`⚠️ Erro ao inserir transação: ${error.message}`);
      }
    }

    // Inserir tentativas de chute
    console.log('⚽ Inserindo tentativas de chute...');
    for (const shot of shotAttemptsData) {
      try {
        await client.query(
          'INSERT INTO shot_attempts (user_id, game_id, choice, result, timestamp) VALUES ($1, $2, $3, $4, $5)',
          [shot.userId, shot.gameId, shot.choice, shot.result, shot.timestamp]
        );
      } catch (error) {
        console.log(`⚠️ Erro ao inserir chute: ${error.message}`);
      }
    }

    // Atualizar saldos dos usuários baseado nas transações
    console.log('💵 Atualizando saldos...');
    for (let i = 1; i <= 10; i++) {
      const result = await client.query(
        'SELECT SUM(amount) as total FROM transactions WHERE user_id = $1',
        [i]
      );
      const total = result.rows[0].total || 0;
      await client.query(
        'UPDATE users SET balance = $1 WHERE id = $2',
        [total, i]
      );
    }

    console.log('🎉 Seed concluído com sucesso!');
    
    // Mostrar estatísticas
    const stats = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM games) as total_games,
        (SELECT COUNT(*) FROM bets) as total_bets,
        (SELECT COUNT(*) FROM queue_board) as total_queue,
        (SELECT COUNT(*) FROM transactions) as total_transactions,
        (SELECT COUNT(*) FROM shot_attempts) as total_shots
    `);
    
    console.log('\n📊 Estatísticas do banco:');
    console.log(`👥 Usuários: ${stats.rows[0].total_users}`);
    console.log(`🎮 Jogos: ${stats.rows[0].total_games}`);
    console.log(`💰 Apostas: ${stats.rows[0].total_bets}`);
    console.log(`📋 Fila: ${stats.rows[0].total_queue}`);
    console.log(`💳 Transações: ${stats.rows[0].total_transactions}`);
    console.log(`⚽ Chutes: ${stats.rows[0].total_shots}`);

  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

// Executar seed
seedDatabase();
