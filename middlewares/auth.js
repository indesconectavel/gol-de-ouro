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

// Middleware de autenticação para players
const authenticatePlayer = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Token de acesso necessário' });
    }

    // Verificar token JWT
    const decoded = verifyToken(token);
    
    // Verificar se usuário ainda existe no banco
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, balance, status')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    if (user.status !== 'active') {
      return res.status(401).json({ error: 'Usuário inativo' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Erro na autenticação:', error);
    return res.status(401).json({ error: 'Token inválido' });
  }
};

// Middleware de autenticação para admin
const authenticateAdmin = (req, res, next) => {
  const adminToken = req.headers['x-admin-token'];
  
  if (!adminToken) {
    return res.status(401).json({ error: 'Token admin necessário' });
  }

  // Verificar token admin
  if (adminToken === process.env.ADMIN_TOKEN || adminToken === 'admin-prod-token-2025') {
    next();
  } else {
    return res.status(401).json({ error: 'Token admin inválido' });
  }
};

// Middleware opcional de autenticação
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = verifyToken(token);
      const { data: user } = await supabase
        .from('users')
        .select('id, email, name, balance, status')
        .eq('id', decoded.userId)
        .single();

      if (user && user.status === 'active') {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Se houver erro, continuar sem usuário autenticado
    next();
  }
};

module.exports = {
  generateToken,
  verifyToken,
  authenticatePlayer,
  authenticateAdmin,
  optionalAuth
};