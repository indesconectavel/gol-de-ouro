const express = require('express')
const router = express.Router()

// Armazenar dados de analytics (em produção, usar banco de dados)
const playerAnalytics = new Map()

// Obter analytics do jogador
router.get('/player/:userId', (req, res) => {
  try {
    const { userId } = req.params
    const analytics = playerAnalytics.get(userId) || {
      gameHistory: [],
      patterns: {},
      recommendations: [],
      lastUpdated: null
    }

    res.json(analytics)
  } catch (error) {
    console.error('Erro ao obter analytics:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Atualizar analytics do jogador
router.post('/player/:userId', (req, res) => {
  try {
    const { userId } = req.params
    const { gameData } = req.body

    const currentAnalytics = playerAnalytics.get(userId) || {
      gameHistory: [],
      patterns: {},
      recommendations: [],
      lastUpdated: null
    }

    // Adicionar novo jogo ao histórico
    const newGame = {
      ...gameData,
      timestamp: new Date().toISOString()
    }

    const updatedHistory = [...currentAnalytics.gameHistory, newGame]
    
    // Manter apenas os últimos 100 jogos
    const recentHistory = updatedHistory.slice(-100)

    // Analisar padrões
    const patterns = analyzePlayerPatterns(recentHistory)
    
    // Gerar recomendações
    const recommendations = generateRecommendations(patterns)

    const updatedAnalytics = {
      gameHistory: recentHistory,
      patterns,
      recommendations,
      lastUpdated: new Date().toISOString()
    }

    playerAnalytics.set(userId, updatedAnalytics)

    res.json({ success: true, analytics: updatedAnalytics })
  } catch (error) {
    console.error('Erro ao atualizar analytics:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Obter recomendações do jogador
router.get('/recommendations/:userId', (req, res) => {
  try {
    const { userId } = req.params
    const analytics = playerAnalytics.get(userId)
    
    if (!analytics) {
      return res.json({ recommendations: [] })
    }

    res.json({ recommendations: analytics.recommendations })
  } catch (error) {
    console.error('Erro ao obter recomendações:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Obter padrões do jogador
router.get('/patterns/:userId', (req, res) => {
  try {
    const { userId } = req.params
    const analytics = playerAnalytics.get(userId)
    
    if (!analytics) {
      return res.json({ patterns: {} })
    }

    res.json({ patterns: analytics.patterns })
  } catch (error) {
    console.error('Erro ao obter padrões:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Obter estatísticas gerais
router.get('/stats/:userId', (req, res) => {
  try {
    const { userId } = req.params
    const analytics = playerAnalytics.get(userId)
    
    if (!analytics) {
      return res.json({
        totalGames: 0,
        totalGoals: 0,
        successRate: 0,
        winStreak: 0,
        favoriteZone: null,
        bestTime: null,
        optimalBetAmount: 1.0
      })
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
      riskTolerance: analytics.patterns.riskTolerance || 'medium'
    }

    res.json(stats)
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Funções auxiliares
function analyzePlayerPatterns(gameHistory) {
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
      totalGoals: 0
    }
  }

  // Análise de zonas favoritas
  const zoneStats = {}
  gameHistory.forEach(game => {
    if (game.zone && game.isGoal) {
      zoneStats[game.zone] = (zoneStats[game.zone] || 0) + 1
    }
  })
  
  const favoriteZones = Object.entries(zoneStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([zone, count]) => ({
      zone: parseInt(zone),
      successCount: count,
      successRate: count / gameHistory.filter(g => g.zone === parseInt(zone)).length
    }))

  // Análise de horários
  const timeStats = {}
  gameHistory.forEach(game => {
    const hour = new Date(game.timestamp).getHours()
    const timeSlot = hour < 6 ? 'madrugada' : 
                    hour < 12 ? 'manhã' : 
                    hour < 18 ? 'tarde' : 'noite'
    
    if (!timeStats[timeSlot]) {
      timeStats[timeSlot] = { total: 0, goals: 0 }
    }
    timeStats[timeSlot].total++
    if (game.isGoal) timeStats[timeSlot].goals++
  })

  const bestTimes = Object.entries(timeStats)
    .map(([time, stats]) => ({
      time,
      successRate: stats.goals / stats.total,
      totalGames: stats.total
    }))
    .sort((a, b) => b.successRate - a.successRate)
    .slice(0, 2)

  // Análise de valores de aposta
  const betAmounts = gameHistory.map(g => g.amount).filter(Boolean)
  const optimalBetAmount = betAmounts.length > 0 
    ? betAmounts.reduce((a, b) => a + b, 0) / betAmounts.length
    : 1.0

  // Taxa de sucesso geral
  const totalGames = gameHistory.length
  const totalGoals = gameHistory.filter(g => g.isGoal).length
  const successRate = totalGames > 0 ? totalGoals / totalGames : 0

  // Sequência de vitórias atual
  let currentWinStreak = 0
  for (let i = gameHistory.length - 1; i >= 0; i--) {
    if (gameHistory[i].isGoal) {
      currentWinStreak++
    } else {
      break
    }
  }

  // Frequência de jogo
  const now = new Date()
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const recentGames = gameHistory.filter(g => 
    new Date(g.timestamp) > lastWeek
  ).length
  
  const playingFrequency = recentGames > 20 ? 'high' : 
                          recentGames > 10 ? 'medium' : 'low'

  // Tolerância ao risco
  const avgBet = betAmounts.length > 0 ? betAmounts.reduce((a, b) => a + b, 0) / betAmounts.length : 1.0
  const riskTolerance = avgBet > 5 ? 'high' : 
                       avgBet > 2 ? 'medium' : 'low'

  return {
    favoriteZones,
    bestTimes,
    optimalBetAmount: Math.round(optimalBetAmount * 100) / 100,
    successRate: Math.round(successRate * 100) / 100,
    winStreak: currentWinStreak,
    playingFrequency,
    riskTolerance,
    totalGames,
    totalGoals
  }
}

function generateRecommendations(patterns) {
  const recommendations = []

  // Recomendação de zona favorita
  if (patterns.favoriteZones.length > 0) {
    const bestZone = patterns.favoriteZones[0]
    if (bestZone.successRate > 0.6) {
      recommendations.push({
        id: 'favorite_zone',
        type: 'zone',
        priority: 'high',
        title: 'Zona de Sucesso!',
        message: `Você tem ${Math.round(bestZone.successRate * 100)}% de sucesso na zona ${bestZone.zone}. Continue apostando nela!`,
        action: `Apostar na zona ${bestZone.zone}`,
        confidence: bestZone.successRate,
        icon: '🎯'
      })
    }
  }

  // Recomendação de horário
  if (patterns.bestTimes.length > 0) {
    const bestTime = patterns.bestTimes[0]
    if (bestTime.successRate > 0.7) {
      recommendations.push({
        id: 'best_time',
        type: 'timing',
        priority: 'medium',
        title: 'Horário de Ouro',
        message: `Sua taxa de sucesso é ${Math.round(bestTime.successRate * 100)}% durante a ${bestTime.time}.`,
        action: `Jogar mais durante a ${bestTime.time}`,
        confidence: bestTime.successRate,
        icon: '⏰'
      })
    }
  }

  // Recomendação de valor de aposta
  if (patterns.optimalBetAmount > 0) {
    recommendations.push({
      id: 'optimal_bet',
      type: 'betting',
      priority: 'medium',
      title: 'Valor Ideal',
      message: `Seu valor médio de aposta é R$ ${patterns.optimalBetAmount.toFixed(2)}. Considere manter esse valor!`,
      action: `Apostar R$ ${patterns.optimalBetAmount.toFixed(2)}`,
      confidence: 0.8,
      icon: '💰'
    })
  }

  // Recomendação de sequência de vitórias
  if (patterns.winStreak >= 3) {
    recommendations.push({
      id: 'win_streak',
      type: 'motivation',
      priority: 'high',
      title: 'Sequência Quente!',
      message: `Você está em uma sequência de ${patterns.winStreak} vitórias! Continue assim!`,
      action: 'Manter a estratégia atual',
      confidence: 0.9,
      icon: '🔥'
    })
  }

  // Recomendação de frequência de jogo
  if (patterns.playingFrequency === 'low' && patterns.successRate > 0.5) {
    recommendations.push({
      id: 'play_more',
      type: 'engagement',
      priority: 'low',
      title: 'Jogue Mais!',
      message: `Sua taxa de sucesso é ${Math.round(patterns.successRate * 100)}%. Que tal jogar mais vezes?`,
      action: 'Aumentar frequência de jogo',
      confidence: patterns.successRate,
      icon: '🎮'
    })
  }

  // Recomendação de tolerância ao risco
  if (patterns.riskTolerance === 'low' && patterns.successRate > 0.6) {
    recommendations.push({
      id: 'increase_bet',
      type: 'betting',
      priority: 'low',
      title: 'Considere Apostar Mais',
      message: `Com ${Math.round(patterns.successRate * 100)}% de sucesso, você pode considerar apostas maiores.`,
      action: 'Aumentar valor das apostas',
      confidence: patterns.successRate,
      icon: '📈'
    })
  }

  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    return priorityOrder[b.priority] - priorityOrder[a.priority]
  })
}

module.exports = router
