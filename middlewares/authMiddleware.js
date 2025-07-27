module.exports = (req, res, next) => {
  const token = req.headers['x-admin-token'];

  // Token fixo temporário — altere conforme necessário
  const TOKEN_VALIDO = process.env.ADMIN_TOKEN || 'goldeouro123';

  if (!token) {
    return res.status(401).json({ error: 'Token de autenticação não fornecido' });
  }

  if (token !== TOKEN_VALIDO) {
    return res.status(403).json({ error: 'Acesso negado. Token inválido.' });
  }

  next();
};
