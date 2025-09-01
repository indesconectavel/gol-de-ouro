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

async function testProductionDB() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Testando banco de produção...');
    
    // Testar conexão
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ Conexão OK:', result.rows[0].current_time);
    
    // Testar tabelas
    const users = await client.query('SELECT COUNT(*) FROM users');
    console.log('👥 Usuários:', users.rows[0].count);
    
    const games = await client.query('SELECT COUNT(*) FROM games');
    console.log('🎮 Jogos:', games.rows[0].count);
    
    const bets = await client.query('SELECT COUNT(*) FROM bets');
    console.log('💰 Apostas:', bets.rows[0].count);
    
    const queue = await client.query('SELECT COUNT(*) FROM queue_board');
    console.log('🎯 Fila:', queue.rows[0].count);
    
    // Testar query do dashboard
    const dashboard = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM games) as games,
        (SELECT COUNT(*) FROM bets) as bets,
        (SELECT COUNT(*) FROM queue_board) as queue
    `);
    console.log('📊 Dashboard:', dashboard.rows[0]);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

testProductionDB();
