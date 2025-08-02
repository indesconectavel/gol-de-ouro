const pool = require('../db');
const { Parser } = require('json2csv');

// Export Users
exports.exportUsersCSV = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, email, created_at, balance 
      FROM users
      ORDER BY id
    `);

    const fields = ['id', 'name', 'email', 'created_at', 'balance'];
    const parser = new Parser({ fields });
    const csv = parser.parse(result.rows);

    res.header('Content-Type', 'text/csv');
    res.attachment('users_export.csv');
    return res.send(csv);
  } catch (error) {
    console.error('Erro ao exportar usuários:', error);
    res.status(500).json({ error: 'Erro ao exportar usuários' });
  }
};

// Export Shot Attempts
exports.exportShotsCSV = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, user_id, was_goal, shot_choice, shot_date
      FROM shot_attempts
      ORDER BY shot_date DESC
    `);

    const fields = ['id', 'user_id', 'was_goal', 'shot_choice', 'shot_date'];
    const parser = new Parser({ fields });
    const csv = parser.parse(result.rows);

    res.header('Content-Type', 'text/csv');
    res.attachment('shots_export.csv');
    return res.send(csv);
  } catch (error) {
    console.error('Erro ao exportar chutes:', error);
    res.status(500).json({ error: 'Erro ao exportar chutes' });
  }
};

// Export Transactions
exports.exportTransactionsCSV = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, user_id, amount, type, description, transaction_date 
      FROM transactions
      ORDER BY transaction_date DESC
    `);

    const fields = ['id', 'user_id', 'amount', 'type', 'description', 'transaction_date'];
    const parser = new Parser({ fields });
    const csv = parser.parse(result.rows);

    res.header('Content-Type', 'text/csv');
    res.attachment('transactions_export.csv');
    return res.send(csv);
  } catch (error) {
    console.error('Erro ao exportar transações:', error);
    res.status(500).json({ error: 'Erro ao exportar transações' });
  }
};

// Export Withdrawals
exports.exportWithdrawalsCSV = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, user_id, amount, status, created_at
      FROM withdrawals
      ORDER BY created_at DESC
    `);

    const fields = ['id', 'user_id', 'amount', 'status', 'created_at'];
    const parser = new Parser({ fields });
    const csv = parser.parse(result.rows);

    res.header('Content-Type', 'text/csv');
    res.attachment('withdrawals_export.csv');
    return res.send(csv);
  } catch (error) {
    console.error('Erro ao exportar saques:', error);
    res.status(500).json({ error: 'Erro ao exportar saques' });
  }
};

// Export All Data
exports.exportGeneralReportCSV = async (req, res) => {
  try {
    const [
      users,
      transactions,
      withdrawals,
      shots
    ] = await Promise.all([
      pool.query(`SELECT id, name, email, created_at, balance FROM users`),
      pool.query(`SELECT id, user_id, amount, type, description, transaction_date FROM transactions`),
      pool.query(`SELECT id, user_id, amount, status, created_at FROM withdrawals`),
      pool.query(`SELECT id, user_id, was_goal, shot_choice, shot_date FROM shot_attempts`)
    ]);

    const data = {
      users: users.rows,
      transactions: transactions.rows,
      withdrawals: withdrawals.rows,
      shots: shots.rows
    };

    res.status(200).json(data);
  } catch (error) {
    console.error('Erro ao exportar relatório geral:', error);
    res.status(500).json({ error: 'Erro ao exportar relatório geral' });
  }
};
