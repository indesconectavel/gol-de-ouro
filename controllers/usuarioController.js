const pool = require('../db');

// Ver saldo
exports.getBalance = async (req, res) => {
  const { userId } = req.body;
  try {
    const result = await pool.query(
      'SELECT balance FROM users WHERE id = $1',
      [userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }
    res.status(200).json({ saldo: parseFloat(result.rows[0].balance) });
  } catch (error) {
    console.error('Erro ao consultar saldo:', error);
    res.status(500).json({ error: 'Erro ao consultar saldo.' });
  }
};

// Solicitar saque
exports.requestWithdrawal = async (req, res) => {
  const { userId, amount } = req.body;
  try {
    const userResult = await pool.query(
      'SELECT balance FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const currentBalance = parseFloat(userResult.rows[0].balance);
    if (currentBalance < amount) {
      return res.status(400).json({ error: 'Saldo insuficiente para saque.' });
    }

    await pool.query('BEGIN');

    // Registrar solicitação de saque
    await pool.query(
      'INSERT INTO withdrawals (user_id, amount, status, created_at) VALUES ($1, $2, $3, NOW())',
      [userId, amount, 'pendente']
    );

    // Atualizar saldo do usuário
    await pool.query(
      'UPDATE users SET balance = balance - $1 WHERE id = $2',
      [amount, userId]
    );

    // Registrar transação
    await pool.query(
      `INSERT INTO transactions (user_id, amount, type, description, transaction_date) 
       VALUES ($1, $2, 'debit', 'Solicitação de saque', NOW())`,
      [userId, amount]
    );

    await pool.query('COMMIT');

    res.status(200).json({ message: 'Saque solicitado com sucesso.' });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Erro ao solicitar saque:', error);
    res.status(500).json({ error: 'Erro ao solicitar saque.' });
  }
};

// Relatório por usuário
exports.userReport = async (req, res) => {
  const { userId } = req.body;
  try {
    const user = await pool.query(
      'SELECT id, name, email, balance FROM users WHERE id = $1',
      [userId]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const totalShots = await pool.query(
      'SELECT COUNT(*) FROM shot_attempts WHERE user_id = $1',
      [userId]
    );

    const totalGoals = await pool.query(
      'SELECT COUNT(*) FROM shot_attempts WHERE user_id = $1 AND was_goal = true',
      [userId]
    );

    const totalCredits = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM transactions 
       WHERE user_id = $1 AND type = 'credit'`,
      [userId]
    );

    const totalDebits = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM transactions 
       WHERE user_id = $1 AND type = 'debit'`,
      [userId]
    );

    res.status(200).json({
      usuario: user.rows[0],
      total_chutes: parseInt(totalShots.rows[0].count),
      gols_marcados: parseInt(totalGoals.rows[0].count),
      creditos: parseFloat(totalCredits.rows[0].total),
      debitos: parseFloat(totalDebits.rows[0].total),
      saldo: parseFloat(user.rows[0].balance)
    });
  } catch (error) {
    console.error('Erro ao gerar relatório do usuário:', error);
    res.status(500).json({ error: 'Erro ao gerar relatório do usuário.' });
  }
};
