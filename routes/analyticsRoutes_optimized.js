/**
 * Rotas de Analytics e Monitoramento - VERSÃO OTIMIZADA
 * ETAPA 5 - Analytics e Monitoramento + IA/ML Otimizado
 */

const express = require('express');
const router = express.Router();
const analyticsCollector = require('../src/utils/analytics');
const systemMonitor = require('../src/utils/monitoring');
const { getMetrics } = require('../src/utils/metrics');
const { info, security } = require('../src/utils/logger');

// Middleware de autenticação para rotas administrativas
const requireAdmin = (req, res, next) => {
  const adminToken = req.headers['x-admin-token'];
  const env = require('../config/env');
  
  if (!adminToken || adminToken !== env.ADMIN_TOKEN) {
    security('UNAUTHORIZED_ANALYTICS_ACCESS', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      attemptedRoute: req.path
    });
    
    return res.status(401).json({
      error: 'Acesso negado',
      message: 'Token de administrador necessário'
    });
  }
  
  next();
};

// ===== MÉTRICAS EM TEMPO REAL =====

// Dashboard principal de métricas
router.get('/dashboard', requireAdmin, async (req, res) => {
  try {
    const metrics = systemMonitor.getMetrics();
    const realTimeMetrics = analyticsCollector.getRealTimeMetrics();
    const alerts = systemMonitor.getActiveAlerts();
    
    const dashboard = {
      timestamp: new Date().toISOString(),
      system: {
        status: metrics.status,
        uptime: metrics.system.uptime,
        cpu: metrics.system.cpu,
        memory: metrics.system.memory,
        loadAverage: metrics.system.loadAverage
      },
      realTime: realTimeMetrics,
      alerts: alerts,
      performance: {
        responseTime: metrics.performance.responseTime,
        throughput: metrics.performance.throughput,
        errorRate: metrics.performance.errorRate
      }
    };
    
    res.json(dashboard);
  } catch (error) {
    console.error('Erro ao obter dashboard:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Métricas do sistema
router.get('/metrics', getMetrics);

// Health check
router.get('/health', requireAdmin, async (req, res) => {
  const healthStatus = systemMonitor.getHealthStatus();
  res.json(healthStatus);
});

// Logs do sistema
router.get('/logs', requireAdmin, async (req, res) => {
  try {
    const { level, limit = 100, offset = 0 } = req.query;
    const logs = await analyticsCollector.getLogs({ level, limit, offset });
    res.json(logs);
  } catch (error) {
    console.error('Erro ao obter logs:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Eventos recentes
router.get('/events', requireAdmin, async (req, res) => {
  try {
    const { type, limit = 50 } = req.query;
    const events = analyticsCollector.getRecentEvents({ type, limit });
    res.json(events);
  } catch (error) {
    console.error('Erro ao obter eventos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Estatísticas de apostas
router.get('/bets/stats', requireAdmin, async (req, res) => {
  try {
    const { period = '24h' } = req.query;
    const stats = analyticsCollector.getBettingStats(period);
    res.json(stats);
  } catch (error) {
    console.error('Erro ao obter estatísticas de apostas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Alertas do sistema
router.get('/alerts', requireAdmin, async (req, res) => {
  try {
    const { status = 'active' } = req.query;
    const alerts = systemMonitor.getAlerts({ status });
    res.json(alerts);
  } catch (error) {
    console.error('Erro ao obter alertas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Configurações de threshold
router.get('/thresholds', requireAdmin, async (req, res) => {
  try {
    const thresholds = systemMonitor.getThresholds();
    res.json(thresholds);
  } catch (error) {
    console.error('Erro ao obter thresholds:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Status geral do sistema
router.get('/status', async (req, res) => {
  try {
    const status = systemMonitor.getSystemStatus();
    res.json(status);
  } catch (error) {
    console.error('Erro ao obter status:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ===== ROTAS DE IA/ML OTIMIZADAS - RECOMENDAÇÕES PERSONALIZADAS =====

// Armazenar dados de analytics (em produção, usar banco de dados)
const playerAnalytics = new Map();

// Cache para otimização de performance
const analyticsCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// Obter analytics do jogador (com cache)
router.get('/player/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const cacheKey = `analytics_${userId}`;
    
    // Verificar cache
    if (analyticsCache.has(cacheKey)) {
      const cached = analyticsCache.get(cacheKey);
      if (Date.now() - cached.timestamp < CACHE_TTL) {
        return res.json(cached.data);
      }
    }

    const analytics = playerAnalytics.get(userId) || {
      gameHistory: [],
      patterns: {},
      recommendations: [],
      lastUpdated: null
    };

    // Atualizar cache
    analyticsCache.set(cacheKey, {
      data: analytics,
      timestamp: Date.now()
    });

    res.json(analytics);
  } catch (error) {
    console.error('Erro ao obter analytics:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar analytics do jogador (otimizado)
router.post('/player/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const { gameData } = req.body;

    // Validação de dados de entrada
    if (!gameData || typeof gameData.zone !== 'number' || typeof gameData.isGoal !== 'boolean') {
      return res.status(400).json({ error: 'Dados de jogo inválidos' });
    }

    const currentAnalytics = playerAnalytics.get(userId) || {
      gameHistory: [],
      patterns: {},
      recommendations: [],
      lastUpdated: null
    };

    // Adicionar novo jogo ao histórico
    const newGame = {
      ...gameData,
      timestamp: new Date().toISOString(),
      id: Date.now() + Math.random() // ID único para o jogo
    };

    const updatedHistory = [...currentAnalytics.gameHistory, newGame];
    
    // Manter apenas os últimos 200 jogos (aumentado de 100)
    const recentHistory = updatedHistory.slice(-200);

    // Analisar padrões (otimizado)
    const patterns = analyzePlayerPatternsOptimized(recentHistory);
    
    // Gerar recomendações (otimizado)
    const recommendations = generateRecommendationsOptimized(patterns, recentHistory);

    const updatedAnalytics = {
      gameHistory: recentHistory,
      patterns,
      recommendations,
      lastUpdated: new Date().toISOString(),
      version: '2.0.0' // Versão do algoritmo
    };

    playerAnalytics.set(userId, updatedAnalytics);

    // Limpar cache
    const cacheKey = `analytics_${userId}`;
    analyticsCache.delete(cacheKey);

    res.json({ success: true, analytics: updatedAnalytics });
  } catch (error) {
    console.error('Erro ao atualizar analytics:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter recomendações do jogador (otimizado)
router.get('/recommendations/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 5, priority = 'all' } = req.query;
    
    const analytics = playerAnalytics.get(userId);
    
    if (!analytics) {
      return res.json({ recommendations: [] });
    }

    let recommendations = analytics.recommendations;
    
    // Filtrar por prioridade se especificado
    if (priority !== 'all') {
      recommendations = recommendations.filter(rec => rec.priority === priority);
    }
    
    // Limitar número de recomendações
    recommendations = recommendations.slice(0, parseInt(limit));

    res.json({ recommendations });
  } catch (error) {
    console.error('Erro ao obter recomendações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter padrões do jogador (otimizado)
router.get('/patterns/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const analytics = playerAnalytics.get(userId);
    
    if (!analytics) {
      return res.json({ patterns: {} });
    }

    res.json({ patterns: analytics.patterns });
  } catch (error) {
    console.error('Erro ao obter padrões:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter estatísticas gerais (otimizado)
router.get('/stats/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const analytics = playerAnalytics.get(userId);
    
    if (!analytics) {
      return res.json({
        totalGames: 0,
        totalGoals: 0,
        successRate: 0,
        winStreak: 0,
        favoriteZone: null,
        bestTime: null,
        optimalBetAmount: 1.0,
        playingFrequency: 'low',
        riskTolerance: 'medium',
        level: 'iniciante',
        experience: 0
      });
    }

    const stats = {
      totalGames: analytics.patterns.totalGames || 0,
      totalGoals: analytics.patterns.totalGoals || 0,
      successRate: analytics.patterns.successRate || 0,
      winStreak: analytics.patterns.winStreak || 0,
      favoriteZone: analytics.patterns.favoriteZones?.[0] || null,
      bestTime: analytics.patterns.bestTimes?.[0] || null,
      optimalBetAmount: analytics.patterns.optimalBetAmount || 1.0,
      playingFrequency: analytics.patterns.playingFrequency || 'low',
      riskTolerance: analytics.patterns.riskTolerance || 'medium',
      level: calculatePlayerLevel(analytics.patterns),
      experience: calculatePlayerExperience(analytics.patterns)
    };

    res.json(stats);
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ===== ALGORITMOS OTIMIZADOS =====

// Análise de padrões otimizada
function analyzePlayerPatternsOptimized(gameHistory) {
  if (!gameHistory || gameHistory.length === 0) {
    return {
      favoriteZones: [],
      bestTimes: [],
      optimalBetAmount: 1.0,
      successRate: 0,
      winStreak: 0,
      playingFrequency: 'low',
      riskTolerance: 'medium',
      totalGames: 0,
      totalGoals: 0,
      consistency: 0,
      improvement: 0
    };
  }

  // Análise de zonas favoritas (otimizada)
  const zoneStats = {};
  const zoneAttempts = {};
  
  gameHistory.forEach(game => {
    const zone = game.zone;
    zoneAttempts[zone] = (zoneAttempts[zone] || 0) + 1;
    if (game.isGoal) {
      zoneStats[zone] = (zoneStats[zone] || 0) + 1;
    }
  });
  
  const favoriteZones = Object.entries(zoneStats)
    .map(([zone, goals]) => ({
      zone: parseInt(zone),
      successCount: goals,
      totalAttempts: zoneAttempts[zone] || 0,
      successRate: goals / (zoneAttempts[zone] || 1),
      confidence: Math.min(1, goals / 5) // Confiança baseada em amostra
    }))
    .sort((a, b) => b.successRate - a.successRate)
    .slice(0, 5);

  // Análise de horários (otimizada)
  const timeStats = {};
  gameHistory.forEach(game => {
    const hour = new Date(game.timestamp).getHours();
    const timeSlot = hour < 6 ? 'madrugada' : 
                    hour < 12 ? 'manhã' : 
                    hour < 18 ? 'tarde' : 'noite';
    
    if (!timeStats[timeSlot]) {
      timeStats[timeSlot] = { total: 0, goals: 0 };
    }
    timeStats[timeSlot].total++;
    if (game.isGoal) timeStats[timeSlot].goals++;
  });

  const bestTimes = Object.entries(timeStats)
    .map(([time, stats]) => ({
      time,
      successRate: stats.goals / stats.total,
      totalGames: stats.total,
      confidence: Math.min(1, stats.total / 10) // Confiança baseada em amostra
    }))
    .sort((a, b) => b.successRate - a.successRate)
    .slice(0, 3);

  // Análise de valores de aposta (otimizada)
  const betAmounts = gameHistory.map(g => g.amount).filter(Boolean);
  const optimalBetAmount = betAmounts.length > 0 
    ? betAmounts.reduce((a, b) => a + b, 0) / betAmounts.length
    : 1.0;

  // Taxa de sucesso geral
  const totalGames = gameHistory.length;
  const totalGoals = gameHistory.filter(g => g.isGoal).length;
  const successRate = totalGames > 0 ? totalGoals / totalGames : 0;

  // Sequência de vitórias atual (otimizada)
  let currentWinStreak = 0;
  let maxWinStreak = 0;
  let currentLossStreak = 0;
  let maxLossStreak = 0;
  
  for (let i = gameHistory.length - 1; i >= 0; i--) {
    if (gameHistory[i].isGoal) {
      currentWinStreak++;
      currentLossStreak = 0;
      maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
    } else {
      currentLossStreak++;
      currentWinStreak = 0;
      maxLossStreak = Math.max(maxLossStreak, currentLossStreak);
    }
  }

  // Frequência de jogo (otimizada)
  const now = new Date();
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const recentGames = gameHistory.filter(g => 
    new Date(g.timestamp) > lastWeek
  ).length;
  
  const monthlyGames = gameHistory.filter(g => 
    new Date(g.timestamp) > lastMonth
  ).length;
  
  const playingFrequency = recentGames > 20 ? 'high' : 
                        recentGames > 10 ? 'medium' : 'low';

  // Tolerância ao risco (otimizada)
  const avgBet = betAmounts.length > 0 ? betAmounts.reduce((a, b) => a + b, 0) / betAmounts.length : 1.0;
  const maxBet = Math.max(...betAmounts, 1);
  const riskTolerance = avgBet > 5 ? 'high' : 
                     avgBet > 2 ? 'medium' : 'low';

  // Consistência (nova métrica)
  const recentGames_10 = gameHistory.slice(-10);
  const recentSuccessRate = recentGames_10.length > 0 
    ? recentGames_10.filter(g => g.isGoal).length / recentGames_10.length 
    : 0;
  const consistency = Math.abs(successRate - recentSuccessRate) < 0.2 ? 1 : 0;

  // Melhoria (nova métrica)
  const firstHalf = gameHistory.slice(0, Math.floor(gameHistory.length / 2));
  const secondHalf = gameHistory.slice(Math.floor(gameHistory.length / 2));
  const firstHalfRate = firstHalf.length > 0 ? firstHalf.filter(g => g.isGoal).length / firstHalf.length : 0;
  const secondHalfRate = secondHalf.length > 0 ? secondHalf.filter(g => g.isGoal).length / secondHalf.length : 0;
  const improvement = secondHalfRate - firstHalfRate;

  return {
    favoriteZones,
    bestTimes,
    optimalBetAmount: Math.round(optimalBetAmount * 100) / 100,
    successRate: Math.round(successRate * 100) / 100,
    winStreak: currentWinStreak,
    maxWinStreak,
    lossStreak: currentLossStreak,
    maxLossStreak,
    playingFrequency,
    riskTolerance,
    totalGames,
    totalGoals,
    consistency,
    improvement,
    monthlyGames
  };
}

// Geração de recomendações otimizada
function generateRecommendationsOptimized(patterns, gameHistory) {
  const recommendations = [];

  // Recomendação de zona favorita (otimizada)
  if (patterns.favoriteZones.length > 0) {
    const bestZone = patterns.favoriteZones[0];
    if (bestZone.successRate > 0.6 && bestZone.confidence > 0.5) {
      recommendations.push({
        id: 'favorite_zone',
        type: 'zone',
        priority: 'high',
        title: 'Zona de Sucesso!',
        message: `Você tem ${Math.round(bestZone.successRate * 100)}% de sucesso na zona ${bestZone.zone} (${bestZone.totalAttempts} tentativas). Continue apostando nela!`,
        action: `Apostar na zona ${bestZone.zone}`,
        confidence: bestZone.confidence,
        icon: '🎯',
        data: { zone: bestZone.zone, successRate: bestZone.successRate }
      });
    }
  }

  // Recomendação de horário (otimizada)
  if (patterns.bestTimes.length > 0) {
    const bestTime = patterns.bestTimes[0];
    if (bestTime.successRate > 0.7 && bestTime.confidence > 0.5) {
      recommendations.push({
        id: 'best_time',
        type: 'timing',
        priority: 'medium',
        title: 'Horário de Ouro',
        message: `Sua taxa de sucesso é ${Math.round(bestTime.successRate * 100)}% durante a ${bestTime.time} (${bestTime.totalGames} jogos).`,
        action: `Jogar mais durante a ${bestTime.time}`,
        confidence: bestTime.confidence,
        icon: '⏰',
        data: { time: bestTime.time, successRate: bestTime.successRate }
      });
    }
  }

  // Recomendação de valor de aposta (otimizada)
  if (patterns.optimalBetAmount > 0) {
    const betRecommendation = {
      id: 'optimal_bet',
      type: 'betting',
      priority: 'medium',
      title: 'Valor Ideal',
      message: `Seu valor médio de aposta é R$ ${patterns.optimalBetAmount.toFixed(2)}. Considere manter esse valor!`,
      action: `Apostar R$ ${patterns.optimalBetAmount.toFixed(2)}`,
      confidence: 0.8,
      icon: '💰',
      data: { amount: patterns.optimalBetAmount }
    };
    recommendations.push(betRecommendation);
  }

  // Recomendação de sequência de vitórias (otimizada)
  if (patterns.winStreak >= 3) {
    recommendations.push({
      id: 'win_streak',
      type: 'motivation',
      priority: 'high',
      title: 'Sequência Quente!',
      message: `Você está em uma sequência de ${patterns.winStreak} vitórias! Continue assim!`,
      action: 'Manter a estratégia atual',
      confidence: 0.9,
      icon: '🔥',
      data: { streak: patterns.winStreak }
    });
  }

  // Recomendação de sequência de derrotas (nova)
  if (patterns.lossStreak >= 3) {
    recommendations.push({
      id: 'loss_streak',
      type: 'motivation',
      priority: 'high',
      title: 'Quebre a Sequência!',
      message: `Você está em uma sequência de ${patterns.lossStreak} derrotas. Que tal tentar uma zona diferente?`,
      action: 'Mudar estratégia',
      confidence: 0.8,
      icon: '💪',
      data: { streak: patterns.lossStreak }
    });
  }

  // Recomendação de frequência de jogo (otimizada)
  if (patterns.playingFrequency === 'low' && patterns.successRate > 0.5) {
    recommendations.push({
      id: 'play_more',
      type: 'engagement',
      priority: 'low',
      title: 'Jogue Mais!',
      message: `Sua taxa de sucesso é ${Math.round(patterns.successRate * 100)}%. Que tal jogar mais vezes?`,
      action: 'Aumentar frequência de jogo',
      confidence: patterns.successRate,
      icon: '🎮',
      data: { successRate: patterns.successRate }
    });
  }

  // Recomendação de tolerância ao risco (otimizada)
  if (patterns.riskTolerance === 'low' && patterns.successRate > 0.6) {
    recommendations.push({
      id: 'increase_bet',
      type: 'betting',
      priority: 'low',
      title: 'Considere Apostar Mais',
      message: `Com ${Math.round(patterns.successRate * 100)}% de sucesso, você pode considerar apostas maiores.`,
      action: 'Aumentar valor das apostas',
      confidence: patterns.successRate,
      icon: '📈',
      data: { successRate: patterns.successRate }
    });
  }

  // Recomendação de consistência (nova)
  if (patterns.consistency === 1) {
    recommendations.push({
      id: 'consistent_player',
      type: 'recognition',
      priority: 'medium',
      title: 'Jogador Consistente!',
      message: 'Você tem mantido uma performance consistente. Parabéns!',
      action: 'Manter o foco',
      confidence: 0.9,
      icon: '🏆',
      data: { consistency: patterns.consistency }
    });
  }

  // Recomendação de melhoria (nova)
  if (patterns.improvement > 0.1) {
    recommendations.push({
      id: 'improving_player',
      type: 'recognition',
      priority: 'medium',
      title: 'Você Está Melhorando!',
      message: `Sua performance melhorou ${Math.round(patterns.improvement * 100)}% recentemente. Continue assim!`,
      action: 'Manter a evolução',
      confidence: 0.8,
      icon: '📈',
      data: { improvement: patterns.improvement }
    });
  }

  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

// Calcular nível do jogador (nova funcionalidade)
function calculatePlayerLevel(patterns) {
  const totalGames = patterns.totalGames || 0;
  const successRate = patterns.successRate || 0;
  const maxWinStreak = patterns.maxWinStreak || 0;
  
  let level = 'iniciante';
  
  if (totalGames >= 100 && successRate >= 0.7 && maxWinStreak >= 10) {
    level = 'expert';
  } else if (totalGames >= 50 && successRate >= 0.6 && maxWinStreak >= 5) {
    level = 'avançado';
  } else if (totalGames >= 20 && successRate >= 0.5) {
    level = 'intermediário';
  }
  
  return level;
}

// Calcular experiência do jogador (nova funcionalidade)
function calculatePlayerExperience(patterns) {
  const totalGames = patterns.totalGames || 0;
  const successRate = patterns.successRate || 0;
  const maxWinStreak = patterns.maxWinStreak || 0;
  
  let experience = 0;
  
  // Base experience from games
  experience += totalGames * 10;
  
  // Bonus for success rate
  experience += Math.round(successRate * 100) * 5;
  
  // Bonus for win streaks
  experience += maxWinStreak * 20;
  
  // Bonus for consistency
  if (patterns.consistency === 1) {
    experience += 50;
  }
  
  // Bonus for improvement
  if (patterns.improvement > 0.1) {
    experience += 100;
  }
  
  return experience;
}

module.exports = router;
