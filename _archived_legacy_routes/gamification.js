const express = require('express')
const router = express.Router()

// Armazenar dados de gamificação (em produção, usar banco de dados)
const userStats = new Map()
const leaderboard = []

// Obter estatísticas do usuário
router.get('/stats/:userId', (req, res) => {
  try {
    const { userId } = req.params
    const stats = userStats.get(userId) || {
      level: 1,
      experience: 0,
      points: 0,
      achievements: [],
      badges: [],
      totalGoals: 0,
      totalBets: 0,
      currentWinStreak: 0,
      dailyWinnings: 0,
      totalReferrals: 0,
      nightGames: 0,
      goalsPerZone: [],
      rank: 0
    }

    res.json(stats)
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Atualizar estatísticas do usuário
router.post('/stats/:userId', (req, res) => {
  try {
    const { userId } = req.params
    const { stats } = req.body

    // Atualizar estatísticas
    const currentStats = userStats.get(userId) || {}
    const updatedStats = {
      ...currentStats,
      ...stats,
      lastUpdated: new Date().toISOString()
    }

    userStats.set(userId, updatedStats)

    // Atualizar leaderboard
    updateLeaderboard(userId, updatedStats)

    res.json({ success: true, stats: updatedStats })
  } catch (error) {
    console.error('Erro ao atualizar estatísticas:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Adicionar experiência
router.post('/experience/:userId', (req, res) => {
  try {
    const { userId } = req.params
    const { amount, reason } = req.body

    const currentStats = userStats.get(userId) || {
      level: 1,
      experience: 0,
      points: 0
    }

    const newExperience = currentStats.experience + amount
    const newLevel = calculateLevel(newExperience)
    const newPoints = currentStats.points + Math.floor(amount / 10)

    const updatedStats = {
      ...currentStats,
      experience: newExperience,
      level: newLevel,
      points: newPoints,
      lastUpdated: new Date().toISOString()
    }

    userStats.set(userId, updatedStats)
    updateLeaderboard(userId, updatedStats)

    res.json({
      success: true,
      levelUp: newLevel > currentStats.level,
      newLevel,
      newExperience,
      newPoints
    })
  } catch (error) {
    console.error('Erro ao adicionar experiência:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Obter conquistas do usuário
router.get('/achievements/:userId', (req, res) => {
  try {
    const { userId } = req.params
    const stats = userStats.get(userId) || {}
    const achievements = stats.achievements || []

    res.json(achievements)
  } catch (error) {
    console.error('Erro ao obter conquistas:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Desbloquear conquista
router.post('/achievements/:userId', (req, res) => {
  try {
    const { userId } = req.params
    const { achievement } = req.body

    const currentStats = userStats.get(userId) || { achievements: [] }
    const achievements = currentStats.achievements || []

    // Verificar se já possui a conquista
    if (achievements.find(a => a.id === achievement.id)) {
      return res.status(400).json({ error: 'Conquista já desbloqueada' })
    }

    // Adicionar conquista
    const newAchievement = {
      ...achievement,
      unlockedAt: new Date().toISOString()
    }

    const updatedStats = {
      ...currentStats,
      achievements: [...achievements, newAchievement],
      lastUpdated: new Date().toISOString()
    }

    userStats.set(userId, updatedStats)

    res.json({ success: true, achievement: newAchievement })
  } catch (error) {
    console.error('Erro ao desbloquear conquista:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Obter badges do usuário
router.get('/badges/:userId', (req, res) => {
  try {
    const { userId } = req.params
    const stats = userStats.get(userId) || {}
    const badges = stats.badges || []

    res.json(badges)
  } catch (error) {
    console.error('Erro ao obter badges:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Obter leaderboard
router.get('/leaderboard', (req, res) => {
  try {
    const { category = 'points', timeframe = 'all', limit = 50 } = req.query

    // Ordenar por categoria
    const sorted = [...leaderboard].sort((a, b) => {
      switch (category) {
        case 'goals':
          return b.totalGoals - a.totalGoals
        case 'wins':
          return b.totalWins - a.totalWins
        case 'experience':
          return b.experience - a.experience
        case 'level':
          return b.level - a.level
        default:
          return b.points - a.points
      }
    })

    // Aplicar limite
    const limited = sorted.slice(0, parseInt(limit))

    res.json(limited)
  } catch (error) {
    console.error('Erro ao obter leaderboard:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Obter ranking do usuário
router.get('/ranking/:userId', (req, res) => {
  try {
    const { userId } = req.params
    const { category = 'points' } = req.query

    // Encontrar posição do usuário
    const sorted = [...leaderboard].sort((a, b) => {
      switch (category) {
        case 'goals':
          return b.totalGoals - a.totalGoals
        case 'wins':
          return b.totalWins - a.totalWins
        case 'experience':
          return b.experience - a.experience
        case 'level':
          return b.level - a.level
        default:
          return b.points - a.points
      }
    })

    const userIndex = sorted.findIndex(user => user.userId === userId)
    const rank = userIndex + 1

    res.json({ rank, total: sorted.length })
  } catch (error) {
    console.error('Erro ao obter ranking:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Obter recompensas diárias
router.get('/daily-rewards/:userId', (req, res) => {
  try {
    const { userId } = req.params
    const stats = userStats.get(userId) || {}
    const dailyRewards = stats.dailyRewards || {
      currentDay: 0,
      lastClaimed: null,
      streak: 0
    }

    res.json(dailyRewards)
  } catch (error) {
    console.error('Erro ao obter recompensas diárias:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Reivindicar recompensa diária
router.post('/daily-rewards/:userId', (req, res) => {
  try {
    const { userId } = req.params
    const { day } = req.body

    const currentStats = userStats.get(userId) || {}
    const dailyRewards = currentStats.dailyRewards || {
      currentDay: 0,
      lastClaimed: null,
      streak: 0
    }

    const today = new Date().toDateString()
    const lastClaimedDate = dailyRewards.lastClaimed ? new Date(dailyRewards.lastClaimed).toDateString() : null

    // Verificar se pode reivindicar
    if (lastClaimedDate === today) {
      return res.status(400).json({ error: 'Recompensa já reivindicada hoje' })
    }

    // Calcular recompensa
    const reward = calculateDailyReward(day)
    
    // Atualizar estatísticas
    const updatedStats = {
      ...currentStats,
      experience: (currentStats.experience || 0) + reward.experience,
      points: (currentStats.points || 0) + reward.points,
      dailyRewards: {
        currentDay: (dailyRewards.currentDay + 1) % 7,
        lastClaimed: new Date().toISOString(),
        streak: dailyRewards.streak + 1
      },
      lastUpdated: new Date().toISOString()
    }

    userStats.set(userId, updatedStats)
    updateLeaderboard(userId, updatedStats)

    res.json({
      success: true,
      reward,
      newStats: updatedStats
    })
  } catch (error) {
    console.error('Erro ao reivindicar recompensa:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Funções auxiliares
function calculateLevel(experience) {
  const levels = [
    { level: 1, exp: 0 },
    { level: 2, exp: 100 },
    { level: 3, exp: 250 },
    { level: 4, exp: 500 },
    { level: 5, exp: 1000 },
    { level: 6, exp: 2000 },
    { level: 7, exp: 4000 },
    { level: 8, exp: 8000 },
    { level: 9, exp: 15000 },
    { level: 10, exp: 30000 }
  ]

  for (let i = levels.length - 1; i >= 0; i--) {
    if (experience >= levels[i].exp) {
      return levels[i].level
    }
  }
  return 1
}

function calculateDailyReward(day) {
  const rewards = {
    1: { experience: 50, points: 5 },
    2: { experience: 75, points: 7 },
    3: { experience: 100, points: 10 },
    4: { experience: 150, points: 15 },
    5: { experience: 200, points: 20 },
    6: { experience: 300, points: 30 },
    7: { experience: 500, points: 50 }
  }

  return rewards[day] || { experience: 50, points: 5 }
}

function updateLeaderboard(userId, stats) {
  const existingIndex = leaderboard.findIndex(user => user.userId === userId)
  
  const leaderboardEntry = {
    userId,
    name: stats.name || 'Jogador',
    avatar: stats.avatar || '👤',
    level: stats.level || 1,
    experience: stats.experience || 0,
    points: stats.points || 0,
    totalGoals: stats.totalGoals || 0,
    totalBets: stats.totalBets || 0,
    totalWins: stats.totalWins || 0,
    lastUpdated: stats.lastUpdated
  }

  if (existingIndex >= 0) {
    leaderboard[existingIndex] = leaderboardEntry
  } else {
    leaderboard.push(leaderboardEntry)
  }

  // Manter apenas os top 100
  if (leaderboard.length > 100) {
    leaderboard.sort((a, b) => b.points - a.points)
    leaderboard.splice(100)
  }
}

module.exports = router
