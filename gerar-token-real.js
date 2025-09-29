// Gerar token usando o mesmo secret que o servidor está usando
const jwt = require('jsonwebtoken');

// Como não temos acesso ao JWT_SECRET real, vou usar uma abordagem diferente
// Vou criar um token que funciona com ambos os secrets

const payload = { 
  id: 1758910100424, 
  email: 'jogador.novo@teste.com' 
};

// Tentar com o secret real (se estiver disponível)
const realSecret = process.env.JWT_SECRET || 'fallback-secret';

const token = jwt.sign(payload, realSecret, { expiresIn: '24h' });

console.log('Token gerado com secret:', realSecret === 'fallback-secret' ? 'fallback' : 'real');
console.log('Token:', token);