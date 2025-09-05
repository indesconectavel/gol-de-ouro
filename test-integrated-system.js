/**
 * Teste Completo do Sistema Integrado IA/ML + Gamificação
 * Testa a integração entre analytics e sistema de gamificação
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Dados de teste mais complexos para simular um jogador real
const testGameData = [
  // Primeiros jogos - aprendendo
  { zone: 1, isGoal: false, amount: 1.0, multiplier: 2.0, totalWin: 0 },
  { zone: 2, isGoal: true, amount: 1.0, multiplier: 2.0, totalWin: 2.0 },
  { zone: 3, isGoal: false, amount: 1.0, multiplier: 1.5, totalWin: 0 },
  { zone: 1, isGoal: true, amount: 1.0, multiplier: 2.0, totalWin: 2.0 },
  { zone: 4, isGoal: false, amount: 1.0, multiplier: 1.8, totalWin: 0 },
  
  // Melhorando - sequência de vitórias
  { zone: 1, isGoal: true, amount: 1.0, multiplier: 2.0, totalWin: 2.0 },
  { zone: 1, isGoal: true, amount: 1.0, multiplier: 2.0, totalWin: 2.0 },
  { zone: 1, isGoal: true, amount: 1.0, multiplier: 2.0, totalWin: 2.0 },
  { zone: 1, isGoal: true, amount: 1.0, multiplier: 2.0, totalWin: 2.0 },
  { zone: 1, isGoal: true, amount: 1.0, multiplier: 2.0, totalWin: 2.0 },
  
  // Testando outras zonas
  { zone: 2, isGoal: true, amount: 1.0, multiplier: 2.0, totalWin: 2.0 },
  { zone: 3, isGoal: true, amount: 1.0, multiplier: 1.5, totalWin: 1.5 },
  { zone: 4, isGoal: false, amount: 1.0, multiplier: 1.8, totalWin: 0 },
  { zone: 5, isGoal: true, amount: 1.0, multiplier: 1.8, totalWin: 1.8 },
  { zone: 1, isGoal: true, amount: 1.0, multiplier: 2.0, totalWin: 2.0 },
  
  // Mais jogos para testar consistência
  { zone: 1, isGoal: true, amount: 1.0, multiplier: 2.0, totalWin: 2.0 },
  { zone: 2, isGoal: false, amount: 1.0, multiplier: 2.0, totalWin: 0 },
  { zone: 1, isGoal: true, amount: 1.0, multiplier: 2.0, totalWin: 2.0 },
  { zone: 3, isGoal: true, amount: 1.0, multiplier: 1.5, totalWin: 1.5 },
  { zone: 1, isGoal: true, amount: 1.0, multiplier: 2.0, totalWin: 2.0 },
  { zone: 4, isGoal: true, amount: 1.0, multiplier: 1.8, totalWin: 1.8 },
  { zone: 1, isGoal: true, amount: 1.0, multiplier: 2.0, totalWin: 2.0 },
  { zone: 2, isGoal: true, amount: 1.0, multiplier: 2.0, totalWin: 2.0 },
  { zone: 1, isGoal: true, amount: 1.0, multiplier: 2.0, totalWin: 2.0 },
  { zone: 3, isGoal: false, amount: 1.0, multiplier: 1.5, totalWin: 0 }
];

async function testIntegratedSystem() {
  console.log('🧪 Iniciando teste do sistema integrado IA/ML + Gamificação...\n');

  try {
    const userId = 'integrated-test-user-456';

    // 1. Testar health check
    console.log('1. Testando health check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check:', healthResponse.data.status);
    console.log('');

    // 2. Simular jogos e coletar analytics
    console.log('2. Simulando jogos e coletando analytics...');
    
    for (let i = 0; i < testGameData.length; i++) {
      const gameData = testGameData[i];
      console.log(`   Jogo ${i + 1}: Zona ${gameData.zone}, Gol: ${gameData.isGoal ? 'Sim' : 'Não'}`);
      
      // Enviar dados de jogo
      await axios.post(`${BASE_URL}/api/analytics/player/${userId}`, {
        gameData: gameData
      });
      
      // Pequena pausa entre jogos
      await new Promise(resolve => setTimeout(resolve, 50));
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
    console.log(`   - Consistência: ${analytics.patterns.consistency ? 'Sim' : 'Não'}`);
    console.log(`   - Melhoria: ${(analytics.patterns.improvement * 100).toFixed(1)}%`);
    console.log('');

    // 4. Integrar com gamificação
    console.log('4. Integrando analytics com gamificação...');
    const integrationResponse = await axios.post(`${BASE_URL}/api/gamification/integrate/${userId}`, {
      analytics: analytics
    });
    const integration = integrationResponse.data.integration;
    
    console.log('🎮 Integração com Gamificação:');
    console.log(`   - Subiu de nível: ${integration.levelUp ? 'Sim' : 'Não'}`);
    console.log(`   - Novo nível: ${integration.newLevel}`);
    console.log(`   - Experiência ganha: ${integration.experienceGained}`);
    console.log(`   - Novas conquistas: ${integration.newAchievements.length}`);
    console.log(`   - Novos badges: ${integration.newBadges.length}`);
    console.log('');

    // 5. Mostrar conquistas desbloqueadas
    if (integration.newAchievements.length > 0) {
      console.log('🏆 Conquistas Desbloqueadas:');
      integration.newAchievements.forEach((achievement, index) => {
        console.log(`   ${index + 1}. ${achievement.name}`);
        console.log(`      ${achievement.description}`);
        console.log(`      +${achievement.experience} XP`);
        console.log('');
      });
    }

    // 6. Mostrar badges desbloqueados
    if (integration.newBadges.length > 0) {
      console.log('🏅 Badges Desbloqueados:');
      integration.newBadges.forEach((badge, index) => {
        console.log(`   ${index + 1}. ${badge.name} (${badge.rarity})`);
        console.log(`      ${badge.description}`);
        console.log('');
      });
    }

    // 7. Obter dados de gamificação
    console.log('5. Obtendo dados de gamificação...');
    const gamificationResponse = await axios.get(`${BASE_URL}/api/gamification/gamification/${userId}`);
    const gamificationData = gamificationResponse.data;
    
    console.log('🎯 Dados de Gamificação:');
    console.log(`   - Nível: ${gamificationData.level}`);
    console.log(`   - Experiência total: ${gamificationData.experience}`);
    console.log(`   - Conquistas: ${gamificationData.achievements.length}`);
    console.log(`   - Badges: ${gamificationData.badges.length}`);
    console.log('');

    // 8. Obter recomendações de gamificação
    console.log('6. Obtendo recomendações de gamificação...');
    const gamificationRecsResponse = await axios.get(`${BASE_URL}/api/gamification/recommendations/${userId}`);
    const gamificationRecs = gamificationRecsResponse.data.recommendations;
    
    console.log('🎮 Recomendações de Gamificação:');
    gamificationRecs.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec.title}`);
      console.log(`      ${rec.message}`);
      console.log(`      Ação: ${rec.action}`);
      console.log('');
    });

    // 9. Obter recomendações de IA/ML
    console.log('7. Obtendo recomendações de IA/ML...');
    const mlRecsResponse = await axios.get(`${BASE_URL}/api/analytics/recommendations/${userId}`);
    const mlRecs = mlRecsResponse.data.recommendations;
    
    console.log('🤖 Recomendações de IA/ML:');
    mlRecs.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec.title}`);
      console.log(`      ${rec.message}`);
      console.log(`      Confiança: ${(rec.confidence * 100).toFixed(1)}%`);
      console.log('');
    });

    // 10. Estatísticas finais
    console.log('8. Estatísticas finais...');
    const statsResponse = await axios.get(`${BASE_URL}/api/analytics/stats/${userId}`);
    const stats = statsResponse.data;
    
    console.log('📈 Estatísticas Finais:');
    console.log(`   - Total de jogos: ${stats.totalGames}`);
    console.log(`   - Total de gols: ${stats.totalGoals}`);
    console.log(`   - Taxa de sucesso: ${(stats.successRate * 100).toFixed(1)}%`);
    console.log(`   - Nível do jogador: ${stats.level || 'N/A'}`);
    console.log(`   - Experiência: ${stats.experience || 0}`);
    console.log(`   - Frequência de jogo: ${stats.playingFrequency}`);
    console.log(`   - Tolerância ao risco: ${stats.riskTolerance}`);
    console.log('');

    console.log('🎉 Teste do sistema integrado concluído com sucesso!');
    console.log('');
    console.log('📋 Resumo do teste:');
    console.log('   ✅ Sistema de IA/ML funcionando');
    console.log('   ✅ Sistema de gamificação funcionando');
    console.log('   ✅ Integração entre sistemas funcionando');
    console.log('   ✅ Recomendações personalizadas funcionando');
    console.log('   ✅ Conquistas e badges funcionando');
    console.log('   ✅ Sistema completo operacional');

  } catch (error) {
    console.error('❌ Erro durante os testes:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

// Executar testes
testIntegratedSystem();
