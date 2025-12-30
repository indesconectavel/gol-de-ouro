const { Pool } = require('pg');
const env = require('../config/env');

// Configurar conexão com o banco
const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function cleanTestGames() {
  try {
    console.log('🧹 Limpando partidas de teste...');
    
    // Limpar fila de jogadores
    await pool.query('DELETE FROM queue_board WHERE user_id IN (1, 2, 3, 4, 5)');
    console.log('✅ Fila de jogadores limpa');
    
    // Limpar chutes dos jogadores
    await pool.query('DELETE FROM player_shots WHERE user_id IN (1, 2, 3, 4, 5)');
    console.log('✅ Chutes dos jogadores limpos');
    
    // Limpar animações de jogo
    await pool.query('DELETE FROM game_animations WHERE user_id IN (1, 2, 3, 4, 5)');
    console.log('✅ Animações de jogo limpas');
    
    // Limpar apostas relacionadas
    await pool.query('DELETE FROM bets WHERE user_id IN (1, 2, 3, 4, 5)');
    console.log('✅ Apostas limpas');
    
    // Limpar apostas que referenciam partidas órfãs
    await pool.query('DELETE FROM bets WHERE game_id NOT IN (SELECT DISTINCT game_id FROM queue_board WHERE game_id IS NOT NULL)');
    console.log('✅ Apostas órfãs removidas');
    
    // Limpar partidas sem jogadores
    await pool.query('DELETE FROM games WHERE id NOT IN (SELECT DISTINCT game_id FROM queue_board WHERE game_id IS NOT NULL)');
    console.log('✅ Partidas órfãs removidas');
    
    console.log('🎉 Limpeza concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro na limpeza:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  cleanTestGames();
}

module.exports = cleanTestGames;
