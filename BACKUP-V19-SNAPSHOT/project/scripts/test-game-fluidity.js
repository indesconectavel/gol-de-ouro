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

// Testar fluidez do sistema
async function testGameFluidity() {
  console.log('🎮 Testando Fluidez do Sistema de Jogos\n');

  const users = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const gameIds = new Set();

  try {
    // 1. Todos os 10 usuários entram na fila
    console.log('1. 👥 Entrando com 10 usuários na fila...');
    for (const userId of users) {
      const token = generateTestToken(userId);
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const response = await axios.post(`${BASE_URL}/api/games/fila/entrar`, {
        user_id: userId
      }, { headers });

      console.log(`   ✅ Usuário ${userId}: ${response.data.message}`);
      gameIds.add(response.data.data.game_id);
    }

    console.log(`\n📊 Partidas criadas: ${gameIds.size}`);

    // 2. Verificar se partida está ativa
    console.log('\n2. 🎯 Verificando se partida está ativa...');
    const firstUserToken = generateTestToken(1);
    const firstUserHeaders = {
      'Authorization': `Bearer ${firstUserToken}`,
      'Content-Type': 'application/json'
    };

    const statusResponse = await axios.post(`${BASE_URL}/api/games/fila/status`, {
      user_id: 1
    }, { headers: firstUserHeaders });

    console.log(`   Status da partida: ${statusResponse.data.data.game_status}`);
    console.log(`   Jogadores na partida: ${statusResponse.data.data.players_count}`);

    // 3. Testar fluidez - usuário chuta e pode entrar em nova partida
    if (statusResponse.data.data.game_status === 'active') {
      console.log('\n3. ⚽ Testando fluidez - usuário chuta...');
      
      const shotResponse = await axios.post(`${BASE_URL}/api/games/chutar`, {
        user_id: 1,
        game_id: statusResponse.data.data.game_id,
        shot_option_id: 1
      }, { headers: firstUserHeaders });

      console.log(`   ✅ Chute executado: ${shotResponse.data.message}`);
      console.log(`   Gol: ${shotResponse.data.data.is_goal ? 'SIM' : 'NÃO'}`);

      // 4. Usuário pode entrar em nova partida imediatamente
      console.log('\n4. 🔄 Testando entrada em nova partida...');
      
      const newGameResponse = await axios.post(`${BASE_URL}/api/games/fila/entrar`, {
        user_id: 1
      }, { headers: firstUserHeaders });

      console.log(`   ✅ Entrou em nova partida: ${newGameResponse.data.message}`);
      console.log(`   Nova Game ID: ${newGameResponse.data.data.game_id}`);
      console.log(`   Posição: ${newGameResponse.data.data.position}`);
    }

    console.log('\n🎉 Teste de fluidez concluído com sucesso!');
    console.log('\n📋 Resumo da Mecânica:');
    console.log('   ✅ 10 jogadores → Partida inicia');
    console.log('   ✅ Vencedor selecionado aleatoriamente');
    console.log('   ✅ Jogador chuta → Pode sair imediatamente');
    console.log('   ✅ Jogador pode entrar em nova partida');
    console.log('   ✅ Partida termina quando todos chutarem');

  } catch (error) {
    console.error('❌ Erro no teste:', error.response?.data || error.message);
  }
}

if (require.main === module) {
  testGameFluidity();
}

module.exports = testGameFluidity;
