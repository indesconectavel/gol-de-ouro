const pool = require('../db');

// Modelo User para PostgreSQL
class User {
  // Buscar usuário por ID
  static async findById(userId) {
    try {
      const result = await pool.query(
        'SELECT * FROM users WHERE id = $1',
        [userId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      throw error;
    }
  }

  // Buscar usuário por email
  static async findByEmail(email) {
    try {
      const result = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Erro ao buscar usuário por email:', error);
      throw error;
    }
  }

  // Criar novo usuário
  static async create(userData) {
    try {
      const { name, email, passwordHash, avatar = '', balance = 0 } = userData;
      const result = await pool.query(
        'INSERT INTO users (name, email, password_hash, avatar, balance, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *',
        [name, email, passwordHash, avatar, balance]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      throw error;
    }
  }

  // Atualizar usuário
  static async update(userId, updateData) {
    try {
      const fields = Object.keys(updateData);
      const values = Object.values(updateData);
      const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
      
      const result = await pool.query(
        `UPDATE users SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
        [userId, ...values]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      throw error;
    }
  }

  // Atualizar saldo
  static async updateBalance(userId, newBalance) {
    try {
      const result = await pool.query(
        'UPDATE users SET balance = $2, updated_at = NOW() WHERE id = $1 RETURNING *',
        [userId, newBalance]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Erro ao atualizar saldo:', error);
      throw error;
    }
  }

  // Listar todos os usuários
  static async findAll() {
    try {
      const result = await pool.query(
        'SELECT id, name, email, avatar, balance, created_at FROM users ORDER BY created_at DESC'
      );
      return result.rows;
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      throw error;
    }
  }

  // Deletar usuário
  static async delete(userId) {
    try {
      const result = await pool.query(
        'DELETE FROM users WHERE id = $1 RETURNING *',
        [userId]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      throw error;
    }
  }
}

module.exports = User;
