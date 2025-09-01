const pool = require('../db');

// Modelo Game para PostgreSQL
class Game {
  // Buscar jogo por ID
  static async findById(gameId) {
    try {
      const result = await pool.query(
        'SELECT * FROM games WHERE id = $1',
        [gameId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Erro ao buscar jogo:', error);
      throw error;
    }
  }

  // Criar novo jogo
  static async create(gameData) {
    try {
      const { players = [], currentPlayer = null, gameStatus = 'waiting', winnerUserId = null, prizeAmount = 0 } = gameData;
      
      const result = await pool.query(
        'INSERT INTO games (players, current_player, game_status, winner_user_id, prize_amount, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *',
        [JSON.stringify(players), currentPlayer, gameStatus, winnerUserId, prizeAmount]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Erro ao criar jogo:', error);
      throw error;
    }
  }

  // Atualizar jogo
  static async update(gameId, updateData) {
    try {
      const fields = Object.keys(updateData);
      const values = Object.values(updateData);
      const setClause = fields.map((field, index) => {
        // Converter camelCase para snake_case
        const snakeField = field.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        return `${snakeField} = $${index + 2}`;
      }).join(', ');
      
      const result = await pool.query(
        `UPDATE games SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
        [gameId, ...values]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Erro ao atualizar jogo:', error);
      throw error;
    }
  }

  // Adicionar jogador ao jogo
  static async addPlayer(gameId, userId) {
    try {
      const game = await this.findById(gameId);
      if (!game) throw new Error('Jogo não encontrado');
      
      let players = game.players || [];
      if (Array.isArray(players)) {
        if (!players.includes(userId)) {
          players.push(userId);
        }
      } else {
        players = [userId];
      }
      
      const result = await pool.query(
        'UPDATE games SET players = $2, updated_at = NOW() WHERE id = $1 RETURNING *',
        [gameId, JSON.stringify(players)]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Erro ao adicionar jogador:', error);
      throw error;
    }
  }

  // Remover jogador do jogo
  static async removePlayer(gameId, userId) {
    try {
      const game = await this.findById(gameId);
      if (!game) throw new Error('Jogo não encontrado');
      
      let players = game.players || [];
      if (Array.isArray(players)) {
        players = players.filter(id => id !== userId);
      }
      
      const result = await pool.query(
        'UPDATE games SET players = $2, updated_at = NOW() WHERE id = $1 RETURNING *',
        [gameId, JSON.stringify(players)]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Erro ao remover jogador:', error);
      throw error;
    }
  }

  // Listar jogos ativos
  static async findActive() {
    try {
      const result = await pool.query(
        'SELECT * FROM games WHERE game_status IN ($1, $2) ORDER BY created_at DESC',
        ['waiting', 'active']
      );
      return result.rows;
    } catch (error) {
      console.error('Erro ao listar jogos ativos:', error);
      throw error;
    }
  }

  // Finalizar jogo
  static async finishGame(gameId, winnerUserId, prizeAmount) {
    try {
      const result = await pool.query(
        'UPDATE games SET game_status = $2, winner_user_id = $3, prize_amount = $4, updated_at = NOW() WHERE id = $1 RETURNING *',
        [gameId, 'finished', winnerUserId, prizeAmount]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Erro ao finalizar jogo:', error);
      throw error;
    }
  }

  // Deletar jogo
  static async delete(gameId) {
    try {
      const result = await pool.query(
        'DELETE FROM games WHERE id = $1 RETURNING *',
        [gameId]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Erro ao deletar jogo:', error);
      throw error;
    }
  }
}

module.exports = Game;
