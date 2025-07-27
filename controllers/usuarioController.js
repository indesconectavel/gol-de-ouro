const pool = require('../db');

// Retorna o saldo do usuário
exports.saldo = async (req, res) => {
  const { userId } = req.body;

  try {
    const result = await pool.query(
      `SELECT 
        COALESCE(SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END), 0) AS saldo
      FROM transactions
      WHERE user_id = $1`,
      [userId]
    );

    res.status(200).json({ saldo: result.rows[0].saldo });
  } catch (error) {
    console.error('Erro ao calcular saldo:', error);
    res.status(500).json({ error: 'Erro ao calcular saldo' });
  }
};

// Solicita saque
exports.solicitarSaque = async (req, res) => {
  const { userId, valor } = req.body;

  try {
    const saldoResult = await pool.query(
      `SELECT 
        COALESCE(SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END), 0) AS saldo
      FROM transactions
      WHERE user_id = $1`,
      [userId]
    );

    const saldo = saldoResult.rows[0].saldo;

    if (saldo < valor) {
      return res.status(400).json({ error: 'Saldo insuficiente para saque' });
    }

    await pool.query(
      'INSERT INTO withdrawals (user_id, amount, status, request_date) VALUES ($1, $2, $3, NOW())',
      [userId, valor, 'pendente']
    );

    await pool.query(
      'INSERT INTO transactions (user_id, amount, type, description, transaction_date) VALUES ($1, $2, $3, $4, NOW())',
      [userId, valor, 'debit', 'Solicitação de saque']
    );

    res.status(200).json({ message: 'Saque solicitado com sucesso' });
  } catch (error) {
    console.error('Erro ao solicitar saque:', error);
    res.status(500).json({ error: 'Erro ao solicitar saque' });
  }
};

// Gera relatório consolidado do usuário
exports.gerarRelatorio = async (req, res) => {
  const { userId } = req.body;

  try {
    const chutes = await pool.query(
      `SELECT id, was_goal, shot_choice, shot_date
       FROM shot_attempts
       WHERE user_id = $1
       ORDER BY shot_date DESC`,
      [userId]
    );

    const transacoes = await pool.query(
      `SELECT id, amount, type, description, transaction_date
       FROM transactions
       WHERE user_id = $1
       ORDER BY transaction_date DESC`,
      [userId]
    );

    const saques = await pool.query(
      `SELECT id, amount, status, request_date
       FROM withdrawals
       WHERE user_id = $1
       ORDER BY request_date DESC`,
      [userId]
    );

    res.status(200).json({
      chutes: chutes.rows,
      transacoes: transacoes.rows,
      saques: saques.rows,
    });

  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    res.status(500).json({ error: 'Erro ao gerar relatório' });
  }
};

// Retorna saldo detalhado (créditos e débitos)
exports.saldoDetalhado = async (req, res) => {
  const { userId } = req.body;

  try {
    const resultado = await pool.query(
      `SELECT
        COALESCE(SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END), 0) AS creditos,
        COALESCE(SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END), 0) AS debitos,
        COALESCE(SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END), 0) AS saldo
      FROM transactions
      WHERE user_id = $1`,
      [userId]
    );

    res.status(200).json(resultado.rows[0]);
  } catch (error) {
    console.error('Erro ao obter saldo detalhado:', error);
    res.status(500).json({ error: 'Erro ao obter saldo detalhado' });
  }
};

// Retorna as últimas transações do usuário
exports.ultimasTransacoes = async (req, res) => {
  const { userId } = req.body;

  try {
    const resultado = await pool.query(
      `SELECT id, amount, type, description, transaction_date
       FROM transactions
       WHERE user_id = $1
       ORDER BY transaction_date DESC
       LIMIT 10`,
      [userId]
    );

    res.status(200).json({ transacoes: resultado.rows });
  } catch (error) {
    console.error('Erro ao obter transações:', error);
    res.status(500).json({ error: 'Erro ao obter transações' });
  }
};
