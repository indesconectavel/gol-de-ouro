// Middleware de autenticação JWT - Gol de Ouro
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { query } = require('../database/connection');

const JWT_SECRET = process.env.JWT_SECRET || 'goldeouro_secret_key_2025';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Gerar token JWT
const generateToken = (userId) => {
  return jwt.sign(
    { 
      userId,
      iat: Math.floor(Date.now() / 1000)
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Verificar token JWT
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Middleware de autenticação
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticação necessário'
      });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido ou expirado'
      });
    }

    // Verificar se o usuário ainda existe
    const user = await query('SELECT id, name, email, balance, account_status FROM users WHERE id = $1', [decoded.userId]);
    
    if (user.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    if (user.rows[0].account_status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Conta desativada'
      });
    }

    req.user = user.rows[0];
    next();
  } catch (error) {
    console.error('Erro na autenticação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Middleware de admin
const authenticateAdmin = async (req, res, next) => {
  try {
    const adminToken = req.headers['x-admin-token'];
    
    if (!adminToken || adminToken !== process.env.ADMIN_TOKEN) {
      return res.status(401).json({
        success: false,
        message: 'Token de administrador inválido'
      });
    }

    next();
  } catch (error) {
    console.error('Erro na autenticação admin:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Hash de senha
const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// Verificar senha
const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

module.exports = {
  generateToken,
  verifyToken,
  authenticateToken,
  authenticateAdmin,
  hashPassword,
  comparePassword
};
