const { Pool } = require('pg');
const env = require('../config/env');

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function testAdminEndpoints() {
  console.log('🧪 Testando endpoints do painel administrativo...');
  
  let client;
  try {
    client = await pool.connect();
    
    // Testar lista de usuários
    console.log('\n👥 Testando lista de usuários...');
    const users = await client.query('SELECT id, name, email, balance, account_status, created_at FROM users ORDER BY id DESC LIMIT 10');
    console.log(`✅ ${users.rows.length} usuários encontrados:`);
    users.rows.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - R$ ${user.balance} - ${user.account_status}`);
    });
    
    // Testar jogos
    console.log('\n🎮 Testando jogos...');
    const games = await client.query('SELECT id, status, created_at FROM games ORDER BY id DESC LIMIT 5');
    console.log(`✅ ${games.rows.length} jogos encontrados:`);
    games.rows.forEach(game => {
      console.log(`  - Jogo #${game.id} - Status: ${game.status} - ${game.created_at}`);
    });
    
    // Testar apostas
    console.log('\n💰 Testando apostas...');
    const bets = await client.query('SELECT id, user_id, amount, choice, status FROM bets ORDER BY id DESC LIMIT 5');
    console.log(`✅ ${bets.rows.length} apostas encontradas:`);
    bets.rows.forEach(bet => {
      console.log(`  - Aposta #${bet.id} - User: ${bet.user_id} - R$ ${bet.amount} - ${bet.choice} - ${bet.status}`);
    });
    
    // Testar fila
    console.log('\n📋 Testando fila...');
    const queue = await client.query('SELECT id, user_id, position, status FROM queue_board ORDER BY position LIMIT 5');
    console.log(`✅ ${queue.rows.length} jogadores na fila:`);
    queue.rows.forEach(q => {
      console.log(`  - Posição ${q.position} - User: ${q.user_id} - Status: ${q.status}`);
    });
    
    // Testar transações
    console.log('\n💳 Testando transações...');
    const transactions = await client.query('SELECT id, user_id, type, amount, description FROM transactions ORDER BY id DESC LIMIT 5');
    console.log(`✅ ${transactions.rows.length} transações encontradas:`);
    transactions.rows.forEach(trans => {
      console.log(`  - Transação #${trans.id} - User: ${trans.user_id} - ${trans.type} - R$ ${trans.amount} - ${trans.description}`);
    });
    
    // Testar chutes
    console.log('\n⚽ Testando chutes...');
    const shots = await client.query('SELECT id, user_id, game_id, result, timestamp FROM shot_attempts ORDER BY id DESC LIMIT 5');
    console.log(`✅ ${shots.rows.length} chutes encontrados:`);
    shots.rows.forEach(shot => {
      console.log(`  - Chute #${shot.id} - User: ${shot.user_id} - Game: ${shot.game_id} - ${shot.result} - ${shot.timestamp}`);
    });
    
    // Estatísticas gerais
    console.log('\n📊 Estatísticas gerais:');
    const stats = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM games) as total_games,
        (SELECT COUNT(*) FROM bets) as total_bets,
        (SELECT COUNT(*) FROM queue_board) as total_queue,
        (SELECT COUNT(*) FROM transactions) as total_transactions,
        (SELECT COUNT(*) FROM shot_attempts) as total_shots,
        (SELECT SUM(balance) FROM users) as total_balance
    `);
    
    const s = stats.rows[0];
    console.log(`👥 Total de usuários: ${s.total_users}`);
    console.log(`🎮 Total de jogos: ${s.total_games}`);
    console.log(`💰 Total de apostas: ${s.total_bets}`);
    console.log(`📋 Total na fila: ${s.total_queue}`);
    console.log(`💳 Total de transações: ${s.total_transactions}`);
    console.log(`⚽ Total de chutes: ${s.total_shots}`);
    console.log(`💵 Saldo total: R$ ${s.total_balance || 0}`);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

testAdminEndpoints();
