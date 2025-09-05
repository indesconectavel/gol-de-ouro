/**
 * Script de Teste do Sistema de IA/ML
 * Testa as funcionalidades de analytics e recomendações
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Dados de teste para simular jogos
const testGameData = [
  { zone: 1, isGoal: true, amount: 1.0, multiplier: 2.0, totalWin: 2.0 },
  { zone: 2, isGoal: false, amount: 1.0, multiplier: 2.0, totalWin: 0 },
  { zone: 1, isGoal: true, amount: 1.0, multiplier: 2.0, totalWin: 2.0 },
  { zone: 3, isGoal: true, amount: 1.0, multiplier: 1.5, totalWin: 1.5 },
  { zone: 1, isGoal: true, amount: 1.0, multiplier: 2.0, totalWin: 2.0 },
  { zone: 4, isGoal: false, amount: 1.0, multiplier: 1.8, totalWin: 0 },
  { zone: 1, isGoal: true, amount: 1.0, multiplier: 2.0, totalWin: 2.0 },
  { zone: 2, isGoal: true, amount: 1.0, multiplier: 2.0, totalWin: 2.0 },
  { zone: 1, isGoal: true, amount: 1.0, multiplier: 2.0, totalWin: 2.0 },
  { zone: 5, isGoal: false, amount: 1.0, multiplier: 1.8, totalWin: 0 }
];

async function testAnalyticsSystem() {
  console.log('🧪 Iniciando testes do sistema de IA/ML...\n');

  try {
    // 1. Testar health check
    console.log('1. Testando health check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check:', healthResponse.data.status);
    console.log('');

    // 2. Simular jogos para um usuário
    const userId = 'test-user-123';
    console.log(`2. Simulando jogos para usuário: ${userId}`);
    
    for (let i = 0; i < testGameData.length; i++) {
      const gameData = testGameData[i];
      console.log(`   Jogo ${i + 1}: Zona ${gameData.zone}, Gol: ${gameData.isGoal ? 'Sim' : 'Não'}`);
      
      await axios.post(`${BASE_URL}/api/analytics/player/${userId}`, {
        gameData: gameData
      });
      
      // Pequena pausa entre jogos
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    console.log('✅ Dados de jogos enviados com sucesso\n');

    // 3. Obter analytics do jogador
    console.log('3. Obtendo analytics do jogador...');
    const analyticsResponse = await axios.get(`${BASE_URL}/api/analytics/player/${userId}`);
    const analytics = analyticsResponse.data;
    
    console.log('📊 Analytics:');
    console.log(`   - Total de jogos: ${analytics.gameHistory.length}`);
    console.log(`   - Taxa de sucesso: ${(analytics.patterns.successRate * 100).toFixed(1)}%`);
    console.log(`   - Sequência de vitórias: ${analytics.patterns.winStreak}`);
    console.log(`   - Zona favorita: ${analytics.patterns.favoriteZones[0]?.zone || 'N/A'}`);
    console.log(`   - Valor ideal de aposta: R$ ${analytics.patterns.optimalBetAmount}`);
    console.log('');

    // 4. Obter recomendações
    console.log('4. Obtendo recomendações...');
    const recommendationsResponse = await axios.get(`${BASE_URL}/api/analytics/recommendations/${userId}`);
    const recommendations = recommendationsResponse.data.recommendations;
    
    console.log('🤖 Recomendações geradas:');
    recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec.title}`);
      console.log(`      ${rec.message}`);
      console.log(`      Ação: ${rec.action}`);
      console.log(`      Confiança: ${(rec.confidence * 100).toFixed(1)}%`);
      console.log('');
    });

    // 5. Obter estatísticas gerais
    console.log('5. Obtendo estatísticas gerais...');
    const statsResponse = await axios.get(`${BASE_URL}/api/analytics/stats/${userId}`);
    const stats = statsResponse.data;
    
    console.log('📈 Estatísticas:');
    console.log(`   - Total de jogos: ${stats.totalGames}`);
    console.log(`   - Total de gols: ${stats.totalGoals}`);
    console.log(`   - Taxa de sucesso: ${(stats.successRate * 100).toFixed(1)}%`);
    console.log(`   - Sequência atual: ${stats.winStreak}`);
    console.log(`   - Frequência de jogo: ${stats.playingFrequency}`);
    console.log(`   - Tolerância ao risco: ${stats.riskTolerance}`);
    console.log('');

    // 6. Testar padrões
    console.log('6. Analisando padrões...');
    const patternsResponse = await axios.get(`${BASE_URL}/api/analytics/patterns/${userId}`);
    const patterns = patternsResponse.data.patterns;
    
    console.log('🔍 Padrões identificados:');
    console.log('   Zonas favoritas:');
    patterns.favoriteZones.forEach((zone, index) => {
      console.log(`     ${index + 1}. Zona ${zone.zone}: ${(zone.successRate * 100).toFixed(1)}% de sucesso`);
    });
    
    console.log('   Melhores horários:');
    patterns.bestTimes.forEach((time, index) => {
      console.log(`     ${index + 1}. ${time.time}: ${(time.successRate * 100).toFixed(1)}% de sucesso`);
    });
    console.log('');

    console.log('🎉 Todos os testes do sistema de IA/ML foram executados com sucesso!');
    console.log('');
    console.log('📋 Resumo dos testes:');
    console.log('   ✅ Health check funcionando');
    console.log('   ✅ Coleta de dados de jogos funcionando');
    console.log('   ✅ Análise de padrões funcionando');
    console.log('   ✅ Geração de recomendações funcionando');
    console.log('   ✅ Estatísticas funcionando');
    console.log('   ✅ Sistema de analytics completo funcionando');

  } catch (error) {
    console.error('❌ Erro durante os testes:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

// Executar testes
testAnalyticsSystem();
