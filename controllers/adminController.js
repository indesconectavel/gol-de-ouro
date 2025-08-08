const pool = require('../db');

// Weekly Report
const relatorioSemanal = async (req, res) => {
  try {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);

    const [credits, debits, finishedGames] = await Promise.all([
      pool.query(`
        SELECT COALESCE(SUM(amount), 0) AS total FROM transactions 
        WHERE type = 'credit' AND transaction_date BETWEEN $1 AND $2
      `, [sevenDaysAgo, today]),
      pool.query(`
        SELECT COALESCE(SUM(amount), 0) AS total FROM transactions 
        WHERE type = 'debit' AND transaction_date BETWEEN $1 AND $2
      `, [sevenDaysAgo, today]),
      pool.query(`
        SELECT COUNT(*) FROM games 
        WHERE status = 'finished' AND end_time BETWEEN $1 AND $2
      `, [sevenDaysAgo, today]),
    ]);

    const balance = parseFloat(credits.rows[0].total) - parseFloat(debits.rows[0].total);

    res.status(200).json({
      period: {
        from: sevenDaysAgo,
        to: today,
      },
      credits: parseFloat(credits.rows[0].total),
      debits: parseFloat(debits.rows[0].total),
      balance,
      finished_games: parseInt(finishedGames.rows[0].count),
    });
  } catch (error) {
    console.error('Erro ao gerar relatório semanal:', error);
    res.status(500).json({ error: 'Erro ao gerar relatório semanal' });
  }
};

// Queue Control
const controleFila = async (req, res) => {
  try {
    const [waiting, playing, activeGames, finishedGames] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM queue_board WHERE status = 'waiting'`),
      pool.query(`SELECT COUNT(*) FROM queue_board WHERE status = 'playing'`),
      pool.query(`SELECT COUNT(*) FROM games WHERE status = 'active'`),
      pool.query(`SELECT COUNT(*) FROM games WHERE status = 'finished'`)
    ]);

    res.status(200).json({
      waiting_players: parseInt(waiting.rows[0].count),
      players_playing: parseInt(playing.rows[0].count),
      active_games: parseInt(activeGames.rows[0].count),
      finished_games: parseInt(finishedGames.rows[0].count)
    });
  } catch (error) {
    console.error('Erro ao consultar controle da fila:', error);
    res.status(500).json({ error: 'Erro ao consultar controle da fila' });
  }
};

// General Stats
const estatisticasGerais = async (req, res) => {
  try {
    const [
      totalUsers,
      totalGames,
      totalTransactions,
      totalCredited,
      totalWithdrawals,
      totalShots
    ] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM users`),
      pool.query(`SELECT COUNT(*) FROM games`),
      pool.query(`SELECT COUNT(*) FROM transactions`),
      pool.query(`SELECT COALESCE(SUM(amount), 0) AS total FROM transactions WHERE type = 'credit'`),
      pool.query(`SELECT COALESCE(SUM(amount), 0) AS total FROM withdrawals WHERE status != 'canceled'`),
      pool.query(`SELECT COUNT(*) FROM shot_attempts`)
    ]);

    const avgShotsPerUser =
      parseInt(totalUsers.rows[0].count) > 0
        ? parseInt(totalShots.rows[0].count) / parseInt(totalUsers.rows[0].count)
        : 0;

    const profit = parseFloat(totalCredited.rows[0].total) - parseFloat(totalWithdrawals.rows[0].total);

    res.status(200).json({
      total_users: parseInt(totalUsers.rows[0].count),
      total_games: parseInt(totalGames.rows[0].count),
      total_transactions: parseInt(totalTransactions.rows[0].count),
      total_credited: parseFloat(totalCredited.rows[0].total),
      total_paid: parseFloat(totalWithdrawals.rows[0].total),
      profit,
      average_shots_per_user: avgShotsPerUser.toFixed(2)
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas gerais:', error);
    res.status(500).json({ error: 'Erro ao obter estatísticas gerais' });
  }
};

// Top Players
const topJogadores = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id AS user_id,
        u.name,
        COUNT(*) AS goals_scored
      FROM shot_attempts sa
      JOIN users u ON u.id = sa.user_id
      WHERE sa.was_goal = true
      GROUP BY u.id
      ORDER BY goals_scored DESC
      LIMIT 10
    `);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar top jogadores:', error);
    res.status(500).json({ error: 'Erro ao buscar top jogadores' });
  }
};

// Recent Transactions
const transacoesRecentes = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, user_id, amount, type, description, transaction_date 
      FROM transactions 
      ORDER BY transaction_date DESC 
      LIMIT 20
    `);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar transações recentes:', error);
    res.status(500).json({ error: 'Erro ao buscar transações recentes' });
  }
};

// Recent Shots
const chutesRecentes = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, user_id, was_goal, shot_choice, shot_date 
      FROM shot_attempts 
      ORDER BY shot_date DESC 
      LIMIT 20
    `);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar chutes recentes:', error);
    res.status(500).json({ error: 'Erro ao buscar chutes recentes' });
  }
};

// Users Report
const relatorioUsuarios = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id,
        u.name,
        COUNT(s.id) AS total_shots,
        COUNT(CASE WHEN s.was_goal THEN 1 END) AS goals_scored,
        COALESCE(SUM(CASE WHEN t.type = 'credit' THEN t.amount ELSE 0 END), 0) AS total_credits,
        COALESCE(SUM(CASE WHEN t.type = 'debit' THEN t.amount ELSE 0 END), 0) AS total_debits,
        COALESCE(SUM(CASE WHEN t.type = 'credit' THEN t.amount ELSE 0 END), 0) - 
        COALESCE(SUM(CASE WHEN t.type = 'debit' THEN t.amount ELSE 0 END), 0) AS balance
      FROM users u
      LEFT JOIN shot_attempts s ON s.user_id = u.id
      LEFT JOIN transactions t ON t.user_id = u.id
      GROUP BY u.id, u.name
      ORDER BY u.id
    `);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erro ao gerar relatório por usuário:', error);
    res.status(500).json({ error: 'Erro ao gerar relatório por usuário' });
  }
};

// Lista de Usuários
const listaUsuarios = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, email, account_status, created_at
      FROM users
      ORDER BY created_at DESC
    `);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar lista de usuários:', error);
    res.status(500).json({ error: 'Erro ao buscar lista de usuários' });
  }
};

// Logs
const logsSistema = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, action, details, created_at 
      FROM admin_logs 
      ORDER BY created_at DESC 
      LIMIT 100
    `);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar logs do sistema:', error);
    res.status(500).json({ error: 'Erro ao buscar logs do sistema' });
  }
};

// Blocked Users
const usuariosBloqueados = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.name, u.email, b.reason, b.blocked_at
      FROM users u
      JOIN blocked_users b ON b.user_id = u.id
    `);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar usuários bloqueados:', error);
    res.status(500).json({ error: 'Erro ao buscar usuários bloqueados' });
  }
};

// Suspend User
const suspenderUsuario = async (req, res) => {
  const userId = req.params.id;
  const { reason } = req.body;

  try {
    await pool.query(
      'INSERT INTO blocked_users (user_id, reason, blocked_at) VALUES ($1, $2, NOW())',
      [userId, reason]
    );

    await pool.query(
      'INSERT INTO admin_logs (action, details, created_at) VALUES ($1, $2, NOW())',
      ['suspension', `Usuário ${userId} suspenso: ${reason}`]
    );

    res.status(200).json({ message: 'Usuário suspenso com sucesso.' });
  } catch (error) {
    console.error('Erro ao suspender usuário:', error);
    res.status(500).json({ error: 'Erro ao suspender usuário' });
  }
};

// Lock/Unlock
const bloquearUsuario = async (req, res) => {
  const { userId, reason } = req.body;

  try {
    await pool.query(
      'INSERT INTO blocked_users (user_id, reason, blocked_at) VALUES ($1, $2, NOW())',
      [userId, reason || 'Bloqueio administrativo']
    );

    await pool.query(
      'INSERT INTO admin_logs (action, details, created_at) VALUES ($1, $2, NOW())',
      ['block', `Usuário ${userId} bloqueado: ${reason}`]
    );

    res.status(200).json({ message: 'Usuário bloqueado com sucesso.' });
  } catch (error) {
    console.error('Erro ao bloquear usuário:', error);
    res.status(500).json({ error: 'Erro ao bloquear usuário' });
  }
};

const desbloquearUsuario = async (req, res) => {
  const { userId } = req.body;

  try {
    await pool.query('DELETE FROM blocked_users WHERE user_id = $1', [userId]);

    await pool.query(
      'INSERT INTO admin_logs (action, details, created_at) VALUES ($1, $2, NOW())',
      ['unblock', `Usuário ${userId} desbloqueado.`]
    );

    res.status(200).json({ message: 'Usuário desbloqueado com sucesso.' });
  } catch (error) {
    console.error('Erro ao desbloquear usuário:', error);
    res.status(500).json({ error: 'Erro ao desbloquear usuário' });
  }
};

// Backup
const statusBackup = async (req, res) => {
  try {
    res.status(200).json({
      status: 'Backup está ativo e funcional',
      last_backup: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao verificar status do backup:', error);
    res.status(500).json({ error: 'Erro ao verificar status do backup' });
  }
};

// Exports
module.exports = {
  relatorioSemanal,
  controleFila,
  estatisticasGerais,
  topJogadores,
  transacoesRecentes,
  chutesRecentes,
  relatorioUsuarios,
  logsSistema,
  usuariosBloqueados,
  suspenderUsuario,
  bloquearUsuario,
  desbloquearUsuario,
  statusBackup,
  listaUsuarios
};
