// src/middlewares/authMiddleware.js

module.exports = (req, res, next) => {
  const token = req.headers['x-admin-token'];

  // 🔐 Token fixo para desenvolvimento local
  const TOKEN_VALIDO = 'goldeouro123';

  // Logs para depuração
  console.log('🔐 Token recebido:', token);
  console.log('🔐 Token esperado:', TOKEN_VALIDO);

  if (!token) {
    return res.status(401).json({ error: 'Token de autenticação não fornecido' });
  }

  if (token !== TOKEN_VALIDO) {
    return res.status(403).json({ error: 'Acesso negado. Token inválido.' });
  }

  next();
};
