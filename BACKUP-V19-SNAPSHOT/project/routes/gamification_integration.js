/**
 * Integração entre Sistema de IA/ML e Gamificação
 * Conecta analytics com sistema de níveis, conquistas e recompensas
 */

const express = require('express');
const router = express.Router();

// Simulação de dados de gamificação (em produção, usar banco de dados)
const playerGamification = new Map();

// Integrar analytics com gamificação
function integrateAnalyticsWithGamification(userId, analytics) {
  const patterns = analytics.patterns;
  const gameHistory = analytics.gameHistory;
  
  // Obter dados de gamificação existentes
  let gamificationData = playerGamification.get(userId) || {
    level: 1,
    experience: 0,
    achievements: [],
    badges: [],
    dailyRewards: [],
    lastLogin: null,
    totalPlayTime: 0,
    consecutiveDays: 0
  };

  // Calcular experiência baseada em analytics
  const experienceGained = calculateExperienceFromAnalytics(patterns, gameHistory);
  gamificationData.experience += experienceGained;

  // Calcular novo nível
  const newLevel = calculateLevelFromExperience(gamificationData.experience);
  const levelUp = newLevel > gamificationData.level;
  gamificationData.level = newLevel;

  // Verificar conquistas baseadas em analytics
  const newAchievements = checkAchievementsFromAnalytics(patterns, gameHistory, gamificationData);
  gamificationData.achievements.push(...newAchievements);

  // Verificar badges baseados em analytics
  const newBadges = checkBadgesFromAnalytics(patterns, gameHistory, gamificationData);
  gamificationData.badges.push(...newBadges);

  // Atualizar dados
  gamificationData.lastLogin = new Date().toISOString();
  playerGamification.set(userId, gamificationData);

  return {
    levelUp,
    newLevel,
    experienceGained,
    newAchievements,
    newBadges,
    gamificationData
  };
}

// Calcular experiência baseada em analytics
function calculateExperienceFromAnalytics(patterns, gameHistory) {
  let experience = 0;

  // Experiência base por jogo
  experience += gameHistory.length * 10;

  // Bônus por taxa de sucesso
  if (patterns.successRate > 0.8) {
    experience += 50; // Bônus por alta taxa de sucesso
  } else if (patterns.successRate > 0.6) {
    experience += 25; // Bônus por boa taxa de sucesso
  }

  // Bônus por sequência de vitórias
  if (patterns.winStreak >= 5) {
    experience += 100; // Bônus por sequência longa
  } else if (patterns.winStreak >= 3) {
    experience += 50; // Bônus por sequência média
  }

  // Bônus por consistência
  if (patterns.consistency === 1) {
    experience += 30; // Bônus por consistência
  }

  // Bônus por melhoria
  if (patterns.improvement > 0.1) {
    experience += 40; // Bônus por melhoria
  }

  // Bônus por frequência de jogo
  if (patterns.playingFrequency === 'high') {
    experience += 20; // Bônus por jogar muito
  }

  return experience;
}

// Calcular nível baseado na experiência
function calculateLevelFromExperience(experience) {
  if (experience < 100) return 1;
  if (experience < 300) return 2;
  if (experience < 600) return 3;
  if (experience < 1000) return 4;
  if (experience < 1500) return 5;
  if (experience < 2100) return 6;
  if (experience < 2800) return 7;
  if (experience < 3600) return 8;
  if (experience < 4500) return 9;
  return 10;
}

// Verificar conquistas baseadas em analytics
function checkAchievementsFromAnalytics(patterns, gameHistory, gamificationData) {
  const newAchievements = [];
  const existingAchievementIds = gamificationData.achievements.map(a => a.id);

  // Conquista: Primeiro Gol
  if (patterns.totalGoals >= 1 && !existingAchievementIds.includes('first_goal')) {
    newAchievements.push({
      id: 'first_goal',
      name: 'Primeiro Gol',
      description: 'Marcou seu primeiro gol!',
      icon: '⚽',
      experience: 50,
      unlockedAt: new Date().toISOString()
    });
  }

  // Conquista: Artilheiro
  if (patterns.totalGoals >= 10 && !existingAchievementIds.includes('scorer')) {
    newAchievements.push({
      id: 'scorer',
      name: 'Artilheiro',
      description: 'Marcou 10 gols!',
      icon: '🥅',
      experience: 100,
      unlockedAt: new Date().toISOString()
    });
  }

  // Conquista: Sequência Quente
  if (patterns.winStreak >= 5 && !existingAchievementIds.includes('hot_streak')) {
    newAchievements.push({
      id: 'hot_streak',
      name: 'Sequência Quente',
      description: 'Conseguiu 5 vitórias seguidas!',
      icon: '🔥',
      experience: 150,
      unlockedAt: new Date().toISOString()
    });
  }

  // Conquista: Jogador Consistente
  if (patterns.consistency === 1 && patterns.totalGames >= 20 && !existingAchievementIds.includes('consistent')) {
    newAchievements.push({
      id: 'consistent',
      name: 'Jogador Consistente',
      description: 'Manteve performance consistente em 20+ jogos!',
      icon: '🎯',
      experience: 200,
      unlockedAt: new Date().toISOString()
    });
  }

  // Conquista: Especialista em Zona
  if (patterns.favoriteZones.length > 0 && patterns.favoriteZones[0].successRate >= 0.8 && !existingAchievementIds.includes('zone_specialist')) {
    newAchievements.push({
      id: 'zone_specialist',
      name: 'Especialista em Zona',
      description: `Domina a zona ${patterns.favoriteZones[0].zone} com ${Math.round(patterns.favoriteZones[0].successRate * 100)}% de sucesso!`,
      icon: '🎯',
      experience: 180,
      unlockedAt: new Date().toISOString()
    });
  }

  // Conquista: Melhoria Contínua
  if (patterns.improvement > 0.2 && !existingAchievementIds.includes('improvement')) {
    newAchievements.push({
      id: 'improvement',
      name: 'Melhoria Contínua',
      description: 'Melhorou significativamente sua performance!',
      icon: '📈',
      experience: 120,
      unlockedAt: new Date().toISOString()
    });
  }

  return newAchievements;
}

// Verificar badges baseados em analytics
function checkBadgesFromAnalytics(patterns, gameHistory, gamificationData) {
  const newBadges = [];
  const existingBadgeIds = gamificationData.badges.map(b => b.id);

  // Badge: Iniciante
  if (patterns.totalGames >= 5 && !existingBadgeIds.includes('beginner')) {
    newBadges.push({
      id: 'beginner',
      name: 'Iniciante',
      description: 'Completou 5 jogos',
      icon: '🌱',
      rarity: 'common',
      unlockedAt: new Date().toISOString()
    });
  }

  // Badge: Veterano
  if (patterns.totalGames >= 50 && !existingBadgeIds.includes('veteran')) {
    newBadges.push({
      id: 'veteran',
      name: 'Veterano',
      description: 'Completou 50 jogos',
      icon: '🏆',
      rarity: 'rare',
      unlockedAt: new Date().toISOString()
    });
  }

  // Badge: Precisão
  if (patterns.successRate >= 0.8 && patterns.totalGames >= 10 && !existingBadgeIds.includes('precision')) {
    newBadges.push({
      id: 'precision',
      name: 'Precisão',
      description: 'Manteve 80%+ de sucesso em 10+ jogos',
      icon: '🎯',
      rarity: 'epic',
      unlockedAt: new Date().toISOString()
    });
  }

  // Badge: Estratégia
  if (patterns.riskTolerance === 'high' && patterns.totalGames >= 20 && !existingBadgeIds.includes('strategist')) {
    newBadges.push({
      id: 'strategist',
      name: 'Estrategista',
      description: 'Joga com apostas altas e estratégia',
      icon: '🧠',
      rarity: 'legendary',
      unlockedAt: new Date().toISOString()
    });
  }

  return newBadges;
}

// Rota para integrar analytics com gamificação
router.post('/integrate/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const { analytics } = req.body;

    if (!analytics) {
      return res.status(400).json({ error: 'Dados de analytics necessários' });
    }

    const integrationResult = integrateAnalyticsWithGamification(userId, analytics);

    res.json({
      success: true,
      integration: integrationResult
    });
  } catch (error) {
    console.error('Erro na integração:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para obter dados de gamificação
router.get('/gamification/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const gamificationData = playerGamification.get(userId);

    if (!gamificationData) {
      return res.json({
        level: 1,
        experience: 0,
        achievements: [],
        badges: [],
        dailyRewards: [],
        lastLogin: null,
        totalPlayTime: 0,
        consecutiveDays: 0
      });
    }

    res.json(gamificationData);
  } catch (error) {
    console.error('Erro ao obter gamificação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para obter recomendações baseadas em gamificação
router.get('/recommendations/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const gamificationData = playerGamification.get(userId);

    if (!gamificationData) {
      return res.json({ recommendations: [] });
    }

    const recommendations = generateGamificationRecommendations(gamificationData);

    res.json({ recommendations });
  } catch (error) {
    console.error('Erro ao obter recomendações de gamificação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Gerar recomendações baseadas em gamificação
function generateGamificationRecommendations(gamificationData) {
  const recommendations = [];

  // Recomendação de nível
  const nextLevelExp = getExperienceForLevel(gamificationData.level + 1);
  const expNeeded = nextLevelExp - gamificationData.experience;
  
  if (expNeeded <= 100) {
    recommendations.push({
      id: 'level_up_close',
      type: 'level',
      priority: 'high',
      title: 'Quase no Próximo Nível!',
      message: `Você precisa de apenas ${expNeeded} XP para subir para o nível ${gamificationData.level + 1}!`,
      action: 'Jogue mais para subir de nível',
      confidence: 0.9,
      icon: '⬆️',
      data: { expNeeded, nextLevel: gamificationData.level + 1 }
    });
  }

  // Recomendação de conquistas próximas
  const nearAchievements = getNearAchievements(gamificationData);
  nearAchievements.forEach(achievement => {
    recommendations.push({
      id: `achievement_${achievement.id}`,
      type: 'achievement',
      priority: 'medium',
      title: `Conquista Próxima: ${achievement.name}`,
      message: achievement.description,
      action: achievement.action,
      confidence: 0.8,
      icon: achievement.icon,
      data: { achievement }
    });
  });

  // Recomendação de badges próximos
  const nearBadges = getNearBadges(gamificationData);
  nearBadges.forEach(badge => {
    recommendations.push({
      id: `badge_${badge.id}`,
      type: 'badge',
      priority: 'low',
      title: `Badge Próximo: ${badge.name}`,
      message: badge.description,
      action: badge.action,
      confidence: 0.7,
      icon: badge.icon,
      data: { badge }
    });
  });

  return recommendations;
}

// Obter experiência necessária para um nível
function getExperienceForLevel(level) {
  if (level <= 1) return 0;
  if (level <= 2) return 100;
  if (level <= 3) return 300;
  if (level <= 4) return 600;
  if (level <= 5) return 1000;
  if (level <= 6) return 1500;
  if (level <= 7) return 2100;
  if (level <= 8) return 2800;
  if (level <= 9) return 3600;
  return 4500;
}

// Obter conquistas próximas
function getNearAchievements(gamificationData) {
  const nearAchievements = [];
  const existingIds = gamificationData.achievements.map(a => a.id);

  // Verificar conquistas próximas baseadas no progresso atual
  if (!existingIds.includes('first_goal') && gamificationData.experience >= 50) {
    nearAchievements.push({
      id: 'first_goal',
      name: 'Primeiro Gol',
      description: 'Você está próximo de marcar seu primeiro gol!',
      action: 'Continue jogando',
      icon: '⚽'
    });
  }

  return nearAchievements;
}

// Obter badges próximos
function getNearBadges(gamificationData) {
  const nearBadges = [];
  const existingIds = gamificationData.badges.map(b => b.id);

  // Verificar badges próximos baseados no progresso atual
  if (!existingIds.includes('beginner') && gamificationData.experience >= 40) {
    nearBadges.push({
      id: 'beginner',
      name: 'Iniciante',
      description: 'Você está próximo de ganhar o badge Iniciante!',
      action: 'Complete mais alguns jogos',
      icon: '🌱'
    });
  }

  return nearBadges;
}

module.exports = router;
