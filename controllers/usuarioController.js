const pool = require('../db');

// POST /entrada
exports.entrada = async (req, res) => {
  const { userId } = req.body;
  try {
    await pool.query(
      `INSERT INTO queue_board (user_id, status, joined_at) VALUES ($1, 'waiting', NOW())`,
      [userId]
    );
    res.status(200).json({ message: 'Usuário inserido na fila com sucesso.' });
  } catch (error) {
    console.error('Erro ao entrar na fila:', error);
    res.status(500).json({ error: 'Erro ao entrar na fila' });
  }
};

// POST /chutar
exports.chutar = async (req, res) => {
  const { userId, shot_choice } = req.body;
  try {
    await pool.query(
      `INSERT INTO shot_attempts (user_id, shot_choice, was_goal, created_at) VALUES ($1, $2, false, NOW())`,
      [userId, shot_choice]
    );
    res.status(200).json({ message: 'Chute registrado com sucesso.' });
  } catch (error) {
    console.error('Erro ao registrar chute:', error);
    res.status(500).json({ error: 'Erro ao registrar chute' });
  }
};

// POST /saldo
exports.saldo = async (req, res) => {
  const { userId } = req.body;
  try {
    const result = await pool.query(`SELECT balance FROM users WHERE id = $1`, [userId]);
    res.status(200).json({ balance: result.rows[0]?.balance || 0 });
  } catch (error) {
    console.error('Erro ao buscar saldo:', error);
    res.status(500).json({ error: 'Erro ao buscar saldo' });
  }
};

// POST /saldo-detalhado
exports.saldoDetalhado = async (req, res) => {
  const { userId } = req.body;
  try {
    const creditResult = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) AS total FROM transactions 
      WHERE user_id = $1 AND type = 'credit'`, [userId]);

    const debitResult = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) AS total FROM transactions 
      WHERE user_id = $1 AND type = 'debit'`, [userId]);

    res.status(200).json({
      credit: parseFloat(creditResult.rows[0].total),
      debit: parseFloat(debitResult.rows[0].total),
      balance: parseFloat(creditResult.rows[0].total) - parseFloat(debitResult.rows[0].total)
    });
  } catch (error) {
    console.error('Erro ao obter saldo detalhado:', error);
    res.status(500).json({ error: 'Erro ao obter saldo detalhado' });
  }
};

// POST /ultimas-transacoes
exports.ultimasTransacoes = async (req, res) => {
  const { userId } = req.body;
  try {
    const result = await pool.query(`
      SELECT id, amount, type, description, transaction_date 
      FROM transactions 
      WHERE user_id = $1 
      ORDER BY transaction_date DESC 
      LIMIT 10`, [userId]);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar transações:', error);
    res.status(500).json({ error: 'Erro ao buscar transações' });
  }
};

// POST /saque
exports.solicitarSaque = async (req, res) => {
  const { userId, amount } = req.body;
  try {
    await pool.query(`
      INSERT INTO withdrawals (user_id, amount, status, created_at) 
      VALUES ($1, $2, 'pending', NOW())`, [userId, amount]);

    res.status(200).json({ message: 'Saque solicitado com sucesso.' });
  } catch (error) {
    console.error('Erro ao solicitar saque:', error);
    res.status(500).json({ error: 'Erro ao solicitar saque' });
  }
};

// POST /relatorio
exports.gerarRelatorio = async (req, res) => {
  const { userId } = req.body;
  try {
    const [shots, transactions, withdrawals] = await Promise.all([
      pool.query(`SELECT * FROM shot_attempts WHERE user_id = $1 ORDER BY created_at DESC`, [userId]),
      pool.query(`SELECT * FROM transactions WHERE user_id = $1 ORDER BY transaction_date DESC`, [userId]),
      pool.query(`SELECT * FROM withdrawals WHERE user_id = $1 ORDER BY created_at DESC`, [userId])
    ]);

    res.status(200).json({
      shots: shots.rows,
      transactions: transactions.rows,
      withdrawals: withdrawals.rows
    });
  } catch (error) {
    console.error('Erro ao gerar relatório do usuário:', error);
    res.status(500).json({ error: 'Erro ao gerar relatório do usuário' });
  }
};
