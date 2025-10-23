const axios = require('axios');
const jwt = require('jsonwebtoken');
const env = require('../config/env');

const BASE_URL = 'http://localhost:3000';

// Gerar token JWT válido
function generateTestToken(userId) {
  return jwt.sign(
    { userId, email: `test${userId}@example.com` },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

// Testar fluidez simples
async function testSimpleFluidity() {
  console.log('🎮 Testando Fluidez Simples do Sistema\n');

  try {
    // 1. Usuário 1 entra na fila
    console.log('1. 👤 Usuário 1 entrando na fila...');
    const token1 = generateTestToken(1);
    const headers1 = {
      'Authorization': `Bearer ${token1}`,
      'Content-Type': 'application/json'
    };

    const response1 = await axios.post(`${BASE_URL}/api/games/fila/entrar`, {
      user_id: 1
    }, { headers: headers1 });

    console.log(`   ✅ ${response1.data.message}`);
    console.log(`   Game ID: ${response1.data.data.game_id}`);
    console.log(`   Posição: ${response1.data.data.position}`);

    // 2. Usuário 1 chuta (mesmo sem partida completa)
    console.log('\n2. ⚽ Usuário 1 tentando chutar...');
    try {
      const shotResponse = await axios.post(`${BASE_URL}/api/games/chutar`, {
        user_id: 1,
        game_id: response1.data.data.game_id,
        shot_option_id: 1
      }, { headers: headers1 });

      console.log(`   ✅ Chute executado: ${shotResponse.data.message}`);
    } catch (error) {
      console.log(`   ⏳ Partida não está ativa ainda: ${error.response?.data?.message || 'Aguardando 10 jogadores'}`);
    }

    // 3. Usuário 1 pode sair e entrar em nova partida
    console.log('\n3. 🔄 Usuário 1 tentando entrar em nova partida...');
    try {
      const newGameResponse = await axios.post(`${BASE_URL}/api/games/fila/entrar`, {
        user_id: 1
      }, { headers: headers1 });

      console.log(`   ✅ Entrou em nova partida: ${newGameResponse.data.message}`);
      console.log(`   Nova Game ID: ${newGameResponse.data.data.game_id}`);
    } catch (error) {
      console.log(`   ❌ Erro: ${error.response?.data?.message || error.message}`);
    }

    console.log('\n🎉 Teste de fluidez simples concluído!');

  } catch (error) {
    console.error('❌ Erro no teste:', error.response?.data || error.message);
  }
}

if (require.main === module) {
  testSimpleFluidity();
}

module.exports = testSimpleFluidity;
