// Middleware de Autenticação JWT - Gol de Ouro v1.1.1
const jwt = require('jsonwebtoken');
const { supabase } = require('../database/supabase-config');

const JWT_SECRET = process.env.JWT_SECRET || 'goldeouro-secret-key-2025';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Gerar token JWT
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Verificar token JWT
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Token inválido');
  }
};

// Middleware de autenticação
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        error: 'Token de acesso requerido',
        code: 'TOKEN_REQUIRED'
      });
    }

    const decoded = verifyToken(token);
    
    // Verificar se o usuário ainda existe no banco
    const { data: user, error } = await supabase
      .from('usuarios')
      .select('id, email, nome, ativo, saldo')
      .eq('id', decoded.id)
      .single();

    if (error || !user) {
      return res.status(401).json({ 
        error: 'Usuário não encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    if (!user.ativo) {
      return res.status(401).json({ 
        error: 'Usuário inativo',
        code: 'USER_INACTIVE'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Erro na autenticação:', error);
    return res.status(401).json({ 
      error: 'Token inválido',
      code: 'INVALID_TOKEN'
    });
  }
};

// Middleware de autenticação para administradores
const authenticateAdmin = async (req, res, next) => {
  try {
    await authenticateToken(req, res, () => {
      if (req.user.tipo !== 'admin' && req.user.tipo !== 'moderador') {
        return res.status(403).json({ 
          error: 'Acesso negado - Privilégios de administrador requeridos',
          code: 'ADMIN_REQUIRED'
        });
      }
      next();
    });
  } catch (error) {
    console.error('Erro na autenticação de admin:', error);
    return res.status(401).json({ 
      error: 'Falha na autenticação de administrador',
      code: 'ADMIN_AUTH_FAILED'
    });
  }
};

// Middleware de verificação de saldo
const checkBalance = (requiredAmount = 0) => {
  return (req, res, next) => {
    if (req.user.saldo < requiredAmount) {
      return res.status(400).json({
        error: 'Saldo insuficiente',
        code: 'INSUFFICIENT_BALANCE',
        required: requiredAmount,
        current: req.user.saldo
      });
    }
    next();
  };
};

// Middleware de rate limiting por usuário
const userRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const userId = req.user?.id;
    if (!userId) return next();
    
    const now = Date.now();
    const userRequests = requests.get(userId) || [];
    
    // Limpar requisições antigas
    const validRequests = userRequests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= maxRequests) {
      return res.status(429).json({
        error: 'Muitas requisições',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    validRequests.push(now);
    requests.set(userId, validRequests);
    next();
  };
};

// Middleware de validação de entrada
const validateInput = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        code: 'VALIDATION_ERROR',
        details: error.details[0].message
      });
    }
    next();
  };
};

// Middleware de logging de segurança
const securityLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    };
    
    // Log apenas para operações sensíveis
    if (req.url.includes('/auth') || req.url.includes('/payment') || req.url.includes('/admin')) {
      console.log('🔐 Security Log:', JSON.stringify(logData));
    }
  });
  
  next();
};

module.exports = {
  generateToken,
  verifyToken,
  authenticateToken,
  authenticateAdmin,
  checkBalance,
  userRateLimit,
  validateInput,
  securityLogger
};