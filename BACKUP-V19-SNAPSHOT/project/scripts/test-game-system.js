const axios = require('axios');
const jwt = require('jsonwebtoken');
const env = require('../config/env');

const BASE_URL = 'http://localhost:3000';

// Gerar token JWT para teste
function generateTestToken(userId = 1) {
  return jwt.sign(
    { userId, email: 'test@example.com' },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

// Testar sistema de jogos
async function testGameSystem() {
  console.log('🎮 Testando Sistema de Jogos - Fase 3\n');

  const token = generateTestToken();
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  try {
    // 1. Testar obter opções de chute
    console.log('1. 📋 Obtendo opções de chute...');
    const shotOptionsResponse = await axios.get(`${BASE_URL}/api/games/opcoes-chute`, { headers });
    console.log('✅ Opções de chute:', shotOptionsResponse.data.data.length, 'opções encontradas');
    console.log('   Opções:', shotOptionsResponse.data.data.map(opt => opt.name).join(', '));

    // 2. Testar entrar na fila
    console.log('\n2. 🎯 Entrando na fila...');
    const enterQueueResponse = await axios.post(`${BASE_URL}/api/games/fila/entrar`, {
      user_id: 1
    }, { headers });
    console.log('✅ Entrou na fila:', enterQueueResponse.data.message);
    console.log('   Game ID:', enterQueueResponse.data.data.game_id);
    console.log('   Posição:', enterQueueResponse.data.data.position);
    console.log('   Jogadores:', enterQueueResponse.data.data.players_count);

    const gameId = enterQueueResponse.data.data.game_id;

    // 3. Testar status da fila
    console.log('\n3. 📊 Verificando status da fila...');
    const statusResponse = await axios.post(`${BASE_URL}/api/games/fila/status`, {
      user_id: 1
    }, { headers });
    console.log('✅ Status da fila:', statusResponse.data.data);

    // 4. Testar executar chute (se partida estiver ativa)
    if (statusResponse.data.data.game_status === 'active') {
      console.log('\n4. ⚽ Executando chute...');
      const shotResponse = await axios.post(`${BASE_URL}/api/games/chutar`, {
        user_id: 1,
        game_id: gameId,
        shot_option_id: 1 // Primeira opção de chute
      }, { headers });
      console.log('✅ Chute executado:', shotResponse.data.message);
      console.log('   Gol:', shotResponse.data.data.is_goal ? 'SIM' : 'NÃO');
      console.log('   Prêmio:', shotResponse.data.data.prize);
    } else {
      console.log('\n4. ⏳ Partida ainda não está ativa (aguardando 10 jogadores)');
    }

    // 5. Testar histórico de jogos
    console.log('\n5. 📚 Obtendo histórico de jogos...');
    const historyResponse = await axios.post(`${BASE_URL}/api/games/historico`, {
      user_id: 1
    }, { headers });
    console.log('✅ Histórico obtido:', historyResponse.data.data.length, 'jogos encontrados');

    console.log('\n🎉 Teste do sistema de jogos concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro no teste:', error.response?.data || error.message);
  }
}

// Testar com múltiplos usuários
async function testMultipleUsers() {
  console.log('\n👥 Testando com múltiplos usuários...\n');

  const users = [1, 2, 3, 4, 5];
  const gameIds = new Set();

  for (const userId of users) {
    try {
      const token = generateTestToken(userId);
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      console.log(`🎯 Usuário ${userId} entrando na fila...`);
      const response = await axios.post(`${BASE_URL}/api/games/fila/entrar`, {
        user_id: userId
      }, { headers });

      console.log(`✅ Usuário ${userId}:`, response.data.message);
      gameIds.add(response.data.data.game_id);

    } catch (error) {
      console.error(`❌ Erro com usuário ${userId}:`, error.response?.data?.message || error.message);
    }
  }

  console.log(`\n📊 Total de partidas criadas: ${gameIds.size}`);
}

// Executar testes
async function runTests() {
  await testGameSystem();
  await testMultipleUsers();
}

if (require.main === module) {
  runTests();
}

module.exports = { testGameSystem, testMultipleUsers };
