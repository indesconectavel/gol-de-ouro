// src/middlewares/authMiddleware.js
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

  if (token !== process.env.ADMIN_TOKEN) {
    return res.status(403).json({ 
      error: 'Acesso negado',
      message: 'Token inválido'
    });
  }

  // Log apenas em desenvolvimento
  if (process.env.NODE_ENV === 'development') {
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    // ✅ CORREÇÃO: Sempre retornar 401 para tokens inválidos (não 403 ou 404)
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expirado',
        message: 'Faça login novamente'
      });
    } else if (error.name === 'JsonWebTokenError') {
      // ✅ CORREÇÃO: Token inválido também retorna 401 (não 403)
      return res.status(401).json({
        success: false,
        error: 'Token inválido',
        message: 'Token malformado ou inválido'
      });
    } else {
      return res.status(401).json({
        success: false,
        error: 'Erro na verificação do token',
        message: 'Token inválido ou expirado'
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
