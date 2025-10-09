const pool = require('../db');
const { Parser } = require('json2csv');

// Exportação de Usuários
exports.exportarUsuariosCSV = async (req, res) => {
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
    res.attachment('usuarios.csv');
    return res.send(csv);
  } catch (error) {
    console.error('Erro ao exportar usuários:', error);
    res.status(500).json({ error: 'Erro ao exportar usuários' });
  }
};

// Exportação de Chutes
exports.exportarChutesCSV = async (req, res) => {
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
    res.attachment('chutes.csv');
    return res.send(csv);
  } catch (error) {
    console.error('Erro ao exportar chutes:', error);
    res.status(500).json({ error: 'Erro ao exportar chutes' });
  }
};

// Exportação de Transações
exports.exportarTransacoesCSV = async (req, res) => {
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
    res.attachment('transacoes.csv');
    return res.send(csv);
  } catch (error) {
    console.error('Erro ao exportar transações:', error);
    res.status(500).json({ error: 'Erro ao exportar transações' });
  }
};

// Exportação de Saques
exports.exportarSaquesCSV = async (req, res) => {
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
    res.attachment('saques.csv');
    return res.send(csv);
  } catch (error) {
    console.error('Erro ao exportar saques:', error);
    res.status(500).json({ error: 'Erro ao exportar saques' });
  }
};

// Exportação de Relatório Completo (JSON)
exports.exportarRelatorioCompletoCSV = async (req, res) => {
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
    console.error('Erro ao exportar relatório completo:', error);
    res.status(500).json({ error: 'Erro ao exportar relatório completo' });
  }
};

// Exportação de Relatório Geral (CSV Resumido)
exports.exportarRelatorioGeralCSV = async (req, res) => {
  try {
    const [
      totalUsers,
      totalTransactions,
      totalWithdrawals,
      totalShots
    ] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM users`),
      pool.query(`SELECT COUNT(*) FROM transactions`),
      pool.query(`SELECT COUNT(*) FROM withdrawals`),
      pool.query(`SELECT COUNT(*) FROM shot_attempts`)
    ]);

    const data = [{
      total_users: totalUsers.rows[0].count,
      total_transactions: totalTransactions.rows[0].count,
      total_withdrawals: totalWithdrawals.rows[0].count,
      total_shots: totalShots.rows[0].count
    }];

    const fields = ['total_users', 'total_transactions', 'total_withdrawals', 'total_shots'];
    const parser = new Parser({ fields });
    const csv = parser.parse(data);

    res.header('Content-Type', 'text/csv');
    res.attachment('relatorio_geral.csv');
    return res.send(csv);
  } catch (error) {
    console.error('Erro ao exportar relatório geral:', error);
    res.status(500).json({ error: 'Erro ao exportar relatório geral' });
  }
};
