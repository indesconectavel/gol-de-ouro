// Gerar token de teste com o mesmo secret do servidor
const jwt = require('jsonwebtoken');

// Usar o mesmo secret que está configurado no servidor
const JWT_SECRET = 'fallback-secret'; // Este é o fallback usado no servidor

const token = jwt.sign(
  { id: 1758910100424, email: 'jogador.novo@teste.com' },
  JWT_SECRET,
  { expiresIn: '24h' }
);

console.log('Token gerado:', token);
