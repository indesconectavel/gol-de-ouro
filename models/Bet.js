const pool = require('../db');

// Modelo Bet para PostgreSQL
class Bet {
  // Buscar aposta por ID
  static async findById(betId) {
    try {
      const result = await pool.query(
        'SELECT * FROM bets WHERE id = $1',
        [betId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Erro ao buscar aposta:', error);
      throw error;
    }
  }

  // Buscar apostas por usuário
  static async findByUserId(userId) {
    try {
      const result = await pool.query(
        'SELECT * FROM bets WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );
      return result.rows;
    } catch (error) {
      console.error('Erro ao buscar apostas do usuário:', error);
      throw error;
    }
  }

  // Buscar apostas por jogo
  static async findByGameId(gameId) {
    try {
      const result = await pool.query(
        'SELECT * FROM bets WHERE game_id = $1 ORDER BY created_at DESC',
        [gameId]
      );
      return result.rows;
    } catch (error) {
      console.error('Erro ao buscar apostas do jogo:', error);
      throw error;
    }
  }

  // Criar nova aposta
  static async create(betData) {
    try {
      const { userId, amount, choice, gameId, status = 'pending', prize = 0 } = betData;
      
      const result = await pool.query(
        'INSERT INTO bets (user_id, amount, choice, game_id, status, prize, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *',
        [userId, amount, choice, gameId, status, prize]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Erro ao criar aposta:', error);
      throw error;
    }
  }

  // Atualizar aposta
  static async update(betId, updateData) {
    try {
      const fields = Object.keys(updateData);
      const values = Object.values(updateData);
      const setClause = fields.map((field, index) => {
        // Converter camelCase para snake_case
        const snakeField = field.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        return `${snakeField} = $${index + 2}`;
      }).join(', ');
      
      const result = await pool.query(
        `UPDATE bets SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
        [betId, ...values]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Erro ao atualizar aposta:', error);
      throw error;
    }
  }

  // Atualizar status da aposta
  static async updateStatus(betId, status, prize = 0) {
    try {
      const result = await pool.query(
        'UPDATE bets SET status = $2, prize = $3, updated_at = NOW() WHERE id = $1 RETURNING *',
        [betId, status, prize]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Erro ao atualizar status da aposta:', error);
      throw error;
    }
  }

  // Listar todas as apostas
  static async findAll() {
    try {
      const result = await pool.query(
        'SELECT * FROM bets ORDER BY created_at DESC'
      );
      return result.rows;
    } catch (error) {
      console.error('Erro ao listar apostas:', error);
      throw error;
    }
  }

  // Listar apostas por status
  static async findByStatus(status) {
    try {
      const result = await pool.query(
        'SELECT * FROM bets WHERE status = $1 ORDER BY created_at DESC',
        [status]
      );
      return result.rows;
    } catch (error) {
      console.error('Erro ao listar apostas por status:', error);
      throw error;
    }
  }

  // Deletar aposta
  static async delete(betId) {
    try {
      const result = await pool.query(
        'DELETE FROM bets WHERE id = $1 RETURNING *',
        [betId]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Erro ao deletar aposta:', error);
      throw error;
    }
  }

  // Estatísticas das apostas
  static async getStats() {
    try {
      const result = await pool.query(`
        SELECT 
          COUNT(*) as total_bets,
          COUNT(CASE WHEN status = 'won' THEN 1 END) as won_bets,
          COUNT(CASE WHEN status = 'lost' THEN 1 END) as lost_bets,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_bets,
          SUM(CASE WHEN status = 'won' THEN prize ELSE 0 END) as total_prizes,
          AVG(amount) as avg_bet_amount
        FROM bets
      `);
      return result.rows[0];
    } catch (error) {
      console.error('Erro ao buscar estatísticas das apostas:', error);
      throw error;
    }
  }
}

module.exports = Bet;
