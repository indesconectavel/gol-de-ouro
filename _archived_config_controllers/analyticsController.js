// Controller de analytics - Gol de Ouro
const { query } = require('../database/connection');

// Dashboard do usuário
const getUserDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    // Estatísticas básicas
    const stats = await query(`
      SELECT 
        (SELECT COUNT(*) FROM games WHERE user_id = $1) as total_games,
        (SELECT COUNT(*) FROM games WHERE user_id = $1 AND status = 'completed') as completed_games,
        (SELECT COUNT(*) FROM shots WHERE user_id = $1) as total_shots,
        (SELECT COUNT(*) FROM shots WHERE user_id = $1 AND result = 'goal') as goals_scored,
        (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE user_id = $1 AND status = 'approved') as total_deposits,
        (SELECT COALESCE(SUM(bet_amount), 0) FROM games WHERE user_id = $1) as total_bets,
        (SELECT balance FROM users WHERE id = $1) as current_balance
    `, [userId]);

    // Jogos recentes
    const recentGames = await query(`
      SELECT id, bet_amount, total_shots, shots_taken, status, created_at
      FROM games 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT 5
    `, [userId]);

    // Pagamentos recentes
    const recentPayments = await query(`
      SELECT id, amount, status, created_at
      FROM payments 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT 5
    `, [userId]);

    // Performance por zona
    const zonePerformance = await query(`
      SELECT 
        zone,
        COUNT(*) as total_shots,
        COUNT(CASE WHEN result = 'goal' THEN 1 END) as goals,
        ROUND(
          COUNT(CASE WHEN result = 'goal' THEN 1 END) * 100.0 / COUNT(*), 2
        ) as accuracy_percentage
      FROM shots 
      WHERE user_id = $1 
      GROUP BY zone 
      ORDER BY accuracy_percentage DESC
    `, [userId]);

    res.json({
      success: true,
      data: {
        stats: stats.rows[0],
        recent_games: recentGames.rows,
        recent_payments: recentPayments.rows,
        zone_performance: zonePerformance.rows
      }
    });

  } catch (error) {
    console.error('Erro ao buscar dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Analytics do admin
const getAdminAnalytics = async (req, res) => {
  try {
    // Estatísticas gerais
    const generalStats = await query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE account_status = 'active') as active_users,
        (SELECT COUNT(*) FROM games) as total_games,
        (SELECT COUNT(*) FROM payments WHERE status = 'approved') as approved_payments,
        (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'approved') as total_revenue,
        (SELECT COALESCE(SUM(bet_amount), 0) FROM games) as total_bets,
        (SELECT COUNT(*) FROM shots WHERE result = 'goal') as total_goals
    `);

    // Usuários por período
    const usersByPeriod = await query(`
      SELECT 
        DATE_TRUNC('day', created_at) as date,
        COUNT(*) as new_users
      FROM users 
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY date
    `);

    // Receita por período
    const revenueByPeriod = await query(`
      SELECT 
        DATE_TRUNC('day', approved_at) as date,
        COUNT(*) as payments,
        COALESCE(SUM(amount), 0) as revenue
      FROM payments 
      WHERE status = 'approved' 
        AND approved_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE_TRUNC('day', approved_at)
      ORDER BY date
    `);

    // Top usuários por saldo
    const topUsersByBalance = await query(`
      SELECT id, name, email, balance, created_at
      FROM users 
      ORDER BY balance DESC 
      LIMIT 10
    `);

    // Performance por zona (global)
    const globalZonePerformance = await query(`
      SELECT 
        zone,
        COUNT(*) as total_shots,
        COUNT(CASE WHEN result = 'goal' THEN 1 END) as goals,
        ROUND(
          COUNT(CASE WHEN result = 'goal' THEN 1 END) * 100.0 / COUNT(*), 2
        ) as accuracy_percentage
      FROM shots 
      GROUP BY zone 
      ORDER BY accuracy_percentage DESC
    `);

    res.json({
      success: true,
      data: {
        general_stats: generalStats.rows[0],
        users_by_period: usersByPeriod.rows,
        revenue_by_period: revenueByPeriod.rows,
        top_users: topUsersByBalance.rows,
        global_zone_performance: globalZonePerformance.rows
      }
    });

  } catch (error) {
    console.error('Erro ao buscar analytics admin:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Registrar métrica
const recordMetric = async (userId, metricType, metricValue, metadata = {}) => {
  try {
    await query(`
      INSERT INTO metrics (user_id, metric_type, metric_value, metadata)
      VALUES ($1, $2, $3, $4)
    `, [userId, metricType, metricValue, JSON.stringify(metadata)]);
  } catch (error) {
    console.error('Erro ao registrar métrica:', error);
  }
};

module.exports = {
  getUserDashboard,
  getAdminAnalytics,
  recordMetric
};
