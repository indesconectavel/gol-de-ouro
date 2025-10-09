// Controller de notificações - Gol de Ouro
const { query } = require('../database/connection');

// Listar notificações do usuário
const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, unread_only = false } = req.query;

    const offset = (page - 1) * limit;
    let whereClause = 'WHERE user_id = $1';
    let params = [userId];

    if (unread_only === 'true') {
      whereClause += ' AND read_at IS NULL';
    }

    const notifications = await query(`
      SELECT id, title, message, type, read_at, created_at
      FROM notifications 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `, [...params, limit, offset]);

    const total = await query(`
      SELECT COUNT(*) FROM notifications ${whereClause}
    `, params);

    res.json({
      success: true,
      data: {
        notifications: notifications.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(total.rows[0].count),
          pages: Math.ceil(total.rows[0].count / limit)
        }
      }
    });

  } catch (error) {
    console.error('Erro ao listar notificações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Marcar notificação como lida
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await query(`
      UPDATE notifications 
      SET read_at = NOW() 
      WHERE id = $1 AND user_id = $2 AND read_at IS NULL
      RETURNING id
    `, [id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notificação não encontrada ou já lida'
      });
    }

    res.json({
      success: true,
      message: 'Notificação marcada como lida'
    });

  } catch (error) {
    console.error('Erro ao marcar notificação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Marcar todas como lidas
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await query(`
      UPDATE notifications 
      SET read_at = NOW() 
      WHERE user_id = $1 AND read_at IS NULL
    `, [userId]);

    res.json({
      success: true,
      message: 'Todas as notificações foram marcadas como lidas'
    });

  } catch (error) {
    console.error('Erro ao marcar todas como lidas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Contar notificações não lidas
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(`
      SELECT COUNT(*) as count 
      FROM notifications 
      WHERE user_id = $1 AND read_at IS NULL
    `, [userId]);

    res.json({
      success: true,
      data: {
        unread_count: parseInt(result.rows[0].count)
      }
    });

  } catch (error) {
    console.error('Erro ao contar notificações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Criar notificação (função auxiliar)
const createNotification = async (userId, title, message, type = 'info') => {
  try {
    await query(`
      INSERT INTO notifications (user_id, title, message, type)
      VALUES ($1, $2, $3, $4)
    `, [userId, title, message, type]);
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
  }
};

module.exports = {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  createNotification
};
