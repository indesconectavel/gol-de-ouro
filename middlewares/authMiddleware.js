// src/middlewares/authMiddleware.js
const env = require('../config/env');
const jwt = require('jsonwebtoken');

// Middleware de autenticação para rotas administrativas
const authAdminToken = (req, res, next) => {
  const token = req.headers['x-admin-token'];

  if (!token) {
    return res.status(401).json({ 
      error: 'Token de autenticação não fornecido',
      message: 'Header x-admin-token é obrigatório'
    });
  }

  if (token !== env.ADMIN_TOKEN) {
    return res.status(403).json({ 
      error: 'Acesso negado',
      message: 'Token inválido'
    });
  }

  // Log apenas em desenvolvimento
  if (env.NODE_ENV === 'development') {
    console.log('🔐 Autenticação admin bem-sucedida');
  }

  next();
};

// Middleware de verificação JWT
const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Token JWT não fornecido',
      message: 'Header Authorization com Bearer token é obrigatório'
    });
  }

  const token = authHeader.substring(7); // Remove 'Bearer '

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expirado',
        message: 'Faça login novamente'
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({
        error: 'Token inválido',
        message: 'Token malformado'
      });
    } else {
      return res.status(500).json({
        error: 'Erro na verificação do token',
        message: 'Erro interno do servidor'
      });
    }
  }
};

// Middleware de verificação de token (para compatibilidade)
const verifyToken = verifyJWT;

// Middleware de verificação de token admin
const verifyAdminToken = authAdminToken;

module.exports = {
  authAdminToken,
  verifyJWT,
  verifyToken,
  verifyAdminToken
};
