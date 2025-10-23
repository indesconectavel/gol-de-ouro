const axios = require('axios');
const jwt = require('jsonwebtoken');
const env = require('../config/env');

const BASE_URL = 'http://localhost:3000';

// Gerar token JWT válido
function generateTestToken(userId = 1) {
  return jwt.sign(
    { userId, email: 'test@example.com' },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

// Testar endpoint específico
async function testEndpoint() {
  console.log('🧪 Testando endpoint específico...\n');

  const token = generateTestToken();
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  try {
    console.log('1. 📋 Testando opções de chute...');
    const shotOptionsResponse = await axios.get(`${BASE_URL}/api/games/opcoes-chute`, { headers });
    console.log('✅ Opções de chute:', shotOptionsResponse.data.data.length, 'opções encontradas');

    console.log('\n2. 🎯 Testando entrada na fila...');
    const enterQueueResponse = await axios.post(`${BASE_URL}/api/games/fila/entrar`, {
      user_id: 1
    }, { headers });
    console.log('✅ Entrou na fila:', enterQueueResponse.data.message);
    console.log('   Game ID:', enterQueueResponse.data.data.game_id);
    console.log('   Posição:', enterQueueResponse.data.data.position);

  } catch (error) {
    console.error('❌ Erro no teste:', error.response?.data || error.message);
    if (error.response?.data) {
      console.log('   Status:', error.response.status);
      console.log('   Headers:', error.response.headers);
    }
  }
}

if (require.main === module) {
  testEndpoint();
}

module.exports = testEndpoint;
