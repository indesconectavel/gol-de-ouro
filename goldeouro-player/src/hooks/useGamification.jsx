import { useState, useEffect, useCallback } from 'react'

const useGamification = () => {
  const [userLevel, setUserLevel] = useState(1)
  const [experience, setExperience] = useState(0)
  const [achievements, setAchievements] = useState([])
  const [badges, setBadges] = useState([])
  const [points, setPoints] = useState(0)
  const [rank, setRank] = useState(0)
  const [nextLevelExp, setNextLevelExp] = useState(100)

  // Configuração de níveis
  const levelConfig = {
    1: { exp: 0, title: 'Iniciante', color: '#6B7280', multiplier: 1.0 },
    2: { exp: 100, title: 'Aprendiz', color: '#10B981', multiplier: 1.1 },
    3: { exp: 250, title: 'Competidor', color: '#3B82F6', multiplier: 1.2 },
    4: { exp: 500, title: 'Profissional', color: '#8B5CF6', multiplier: 1.3 },
    5: { exp: 1000, title: 'Expert', color: '#F59E0B', multiplier: 1.5 },
    6: { exp: 2000, title: 'Mestre', color: '#EF4444', multiplier: 1.8 },
    7: { exp: 4000, title: 'Lenda', color: '#EC4899', multiplier: 2.0 },
    8: { exp: 8000, title: 'Ídolo', color: '#F97316', multiplier: 2.5 },
    9: { exp: 15000, title: 'Campeão', color: '#84CC16', multiplier: 3.0 },
    10: { exp: 30000, title: 'Lenda Viva', color: '#06B6D4', multiplier: 5.0 }
  }

  // Conquistas disponíveis
  const availableAchievements = [
    {
      id: 'first_goal',
      name: 'Primeiro Gol',
      description: 'Marque seu primeiro gol no jogo',
      icon: '⚽',
      points: 50,
      condition: { type: 'goals', value: 1 },
      rarity: 'common'
    },
    {
      id: 'goal_machine',
      name: 'Máquina de Gols',
      description: 'Marque 10 gols',
      icon: '🎯',
      points: 200,
      condition: { type: 'goals', value: 10 },
      rarity: 'uncommon'
    },
    {
      id: 'goal_legend',
      name: 'Lenda dos Gols',
      description: 'Marque 100 gols',
      icon: '👑',
      points: 1000,
      condition: { type: 'goals', value: 100 },
      rarity: 'legendary'
    },
    {
      id: 'betting_rookie',
      name: 'Apostador Iniciante',
      description: 'Faça sua primeira aposta',
      icon: '💰',
      points: 25,
      condition: { type: 'bets', value: 1 },
      rarity: 'common'
    },
    {
      id: 'betting_pro',
      name: 'Apostador Profissional',
      description: 'Faça 50 apostas',
      icon: '💎',
      points: 500,
      condition: { type: 'bets', value: 50 },
      rarity: 'rare'
    },
    {
      id: 'winning_streak',
      name: 'Sequência Vencedora',
      description: 'Ganhe 5 jogos seguidos',
      icon: '🔥',
      points: 300,
      condition: { type: 'win_streak', value: 5 },
      rarity: 'epic'
    },
    {
      id: 'lucky_day',
      name: 'Dia de Sorte',
      description: 'Ganhe R$ 100 em um dia',
      icon: '🍀',
      points: 400,
      condition: { type: 'daily_winnings', value: 100 },
      rarity: 'epic'
    },
    {
      id: 'social_butterfly',
      name: 'Borboleta Social',
      description: 'Convide 5 amigos',
      icon: '🦋',
      points: 600,
      condition: { type: 'referrals', value: 5 },
      rarity: 'rare'
    },
    {
      id: 'night_owl',
      name: 'Coruja Noturna',
      description: 'Jogue 10 vezes entre 23h e 6h',
      icon: '🦉',
      points: 150,
      condition: { type: 'night_games', value: 10 },
      rarity: 'uncommon'
    },
    {
      id: 'perfectionist',
      name: 'Perfeccionista',
      description: 'Marque gol em todas as zonas',
      icon: '⭐',
      points: 800,
      condition: { type: 'all_zones', value: 5 },
      rarity: 'legendary'
    }
  ]

  // Badges disponíveis
  const availableBadges = [
    {
      id: 'rookie',
      name: 'Novato',
      description: 'Primeiro dia no jogo',
      icon: '🌱',
      color: '#10B981',
      requirement: { type: 'days_played', value: 1 }
    },
    {
      id: 'veteran',
      name: 'Veterano',
      description: '7 dias jogando',
      icon: '🏆',
      color: '#F59E0B',
      requirement: { type: 'days_played', value: 7 }
    },
    {
      id: 'champion',
      name: 'Campeão',
      description: '30 dias jogando',
      icon: '👑',
      color: '#8B5CF6',
      requirement: { type: 'days_played', value: 30 }
    },
    {
      id: 'high_roller',
      name: 'Apostador Alto',
      description: 'Apostou mais de R$ 500',
      icon: '💸',
      color: '#EF4444',
      requirement: { type: 'total_bet', value: 500 }
    },
    {
      id: 'lucky',
      name: 'Sortudo',
      description: 'Taxa de vitória acima de 80%',
      icon: '🍀',
      color: '#84CC16',
      requirement: { type: 'win_rate', value: 80 }
    }
  ]

  // Calcular nível baseado na experiência
  const calculateLevel = useCallback((exp) => {
    for (let level = 10; level >= 1; level--) {
      if (exp >= levelConfig[level].exp) {
        return level
      }
    }
    return 1
  }, [])

  // Calcular experiência necessária para próximo nível
  const calculateNextLevelExp = useCallback((currentLevel) => {
    const nextLevel = currentLevel + 1
    if (nextLevel > 10) return null
    return levelConfig[nextLevel].exp
  }, [])

  // Adicionar experiência
  const addExperience = useCallback((amount, reason = '') => {
    setExperience(prev => {
      const newExp = prev + amount
      const newLevel = calculateLevel(newExp)
      
      // Verificar se subiu de nível
      if (newLevel > userLevel) {
        setUserLevel(newLevel)
        // Notificar subida de nível
        showLevelUpNotification(newLevel)
      }
      
      setNextLevelExp(calculateNextLevelExp(newLevel))
      return newExp
    })
    
    // Adicionar pontos
    setPoints(prev => prev + Math.floor(amount / 10))
  }, [userLevel, calculateLevel, calculateNextLevelExp])

  // Verificar conquistas
  const checkAchievements = useCallback((stats) => {
    const newAchievements = []
    
    availableAchievements.forEach(achievement => {
      // Verificar se já possui a conquista
      if (achievements.find(a => a.id === achievement.id)) return
      
      // Verificar condição
      let achieved = false
      switch (achievement.condition.type) {
        case 'goals':
          achieved = stats.totalGoals >= achievement.condition.value
          break
        case 'bets':
          achieved = stats.totalBets >= achievement.condition.value
          break
        case 'win_streak':
          achieved = stats.currentWinStreak >= achievement.condition.value
          break
        case 'daily_winnings':
          achieved = stats.dailyWinnings >= achievement.condition.value
          break
        case 'referrals':
          achieved = stats.totalReferrals >= achievement.condition.value
          break
        case 'night_games':
          achieved = stats.nightGames >= achievement.condition.value
          break
        case 'all_zones':
          achieved = stats.goalsPerZone.length >= achievement.condition.value
          break
      }
      
      if (achieved) {
        newAchievements.push({
          ...achievement,
          unlockedAt: new Date().toISOString()
        })
        
        // Adicionar pontos da conquista
        addExperience(achievement.points, `Conquista: ${achievement.name}`)
      }
    })
    
    if (newAchievements.length > 0) {
      setAchievements(prev => [...prev, ...newAchievements])
      showAchievementNotification(newAchievements)
    }
  }, [achievements, addExperience])

  // Verificar badges
  const checkBadges = useCallback((stats) => {
    const newBadges = []
    
    availableBadges.forEach(badge => {
      // Verificar se já possui o badge
      if (badges.find(b => b.id === badge.id)) return
      
      // Verificar requisito
      let earned = false
      switch (badge.requirement.type) {
        case 'days_played':
          earned = stats.daysPlayed >= badge.requirement.value
          break
        case 'total_bet':
          earned = stats.totalBetAmount >= badge.requirement.value
          break
        case 'win_rate':
          earned = stats.winRate >= badge.requirement.value
          break
      }
      
      if (earned) {
        newBadges.push({
          ...badge,
          earnedAt: new Date().toISOString()
        })
      }
    })
    
    if (newBadges.length > 0) {
      setBadges(prev => [...prev, ...newBadges])
      showBadgeNotification(newBadges)
    }
  }, [badges])

  // Notificação de subida de nível
  const showLevelUpNotification = (newLevel) => {
    const levelInfo = levelConfig[newLevel]
    // Implementar notificação visual
    console.log(`🎉 Subiu para o nível ${newLevel}: ${levelInfo.title}!`)
  }

  // Notificação de conquista
  const showAchievementNotification = (newAchievements) => {
    newAchievements.forEach(achievement => {
      console.log(`🏆 Conquista desbloqueada: ${achievement.name}!`)
    })
  }

  // Notificação de badge
  const showBadgeNotification = (newBadges) => {
    newBadges.forEach(badge => {
      console.log(`🏅 Badge conquistado: ${badge.name}!`)
    })
  }

  // Calcular progresso para próximo nível
  const getLevelProgress = useCallback(() => {
    const currentLevelExp = levelConfig[userLevel].exp
    const nextLevelExp = calculateNextLevelExp(userLevel)
    
    if (!nextLevelExp) return { percentage: 100, current: experience, needed: 0 }
    
    const progress = experience - currentLevelExp
    const needed = nextLevelExp - currentLevelExp
    const percentage = Math.min((progress / needed) * 100, 100)
    
    return { percentage, current: progress, needed }
  }, [userLevel, experience, calculateNextLevelExp])

  // Obter estatísticas do usuário
  const getUserStats = useCallback(() => {
    return {
      level: userLevel,
      experience,
      points,
      achievements: achievements.length,
      badges: badges.length,
      rank,
      levelInfo: levelConfig[userLevel],
      progress: getLevelProgress()
    }
  }, [userLevel, experience, points, achievements, badges, rank, getLevelProgress])

  // Atualizar estatísticas do usuário
  const updateUserStats = useCallback((stats) => {
    checkAchievements(stats)
    checkBadges(stats)
  }, [checkAchievements, checkBadges])

  // Carregar dados salvos
  useEffect(() => {
    const savedData = localStorage.getItem('gamification_data')
    if (savedData) {
      const data = JSON.parse(savedData)
      setUserLevel(data.level || 1)
      setExperience(data.experience || 0)
      setAchievements(data.achievements || [])
      setBadges(data.badges || [])
      setPoints(data.points || 0)
      setRank(data.rank || 0)
    }
  }, [])

  // Salvar dados
  useEffect(() => {
    const data = {
      level: userLevel,
      experience,
      achievements,
      badges,
      points,
      rank
    }
    localStorage.setItem('gamification_data', JSON.stringify(data))
  }, [userLevel, experience, achievements, badges, points, rank])

  return {
    userLevel,
    experience,
    achievements,
    badges,
    points,
    rank,
    nextLevelExp,
    levelConfig,
    addExperience,
    checkAchievements,
    checkBadges,
    getUserStats,
    updateUserStats,
    getLevelProgress
  }
}

export default useGamification
