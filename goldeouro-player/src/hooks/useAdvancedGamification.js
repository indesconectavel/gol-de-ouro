// hooks/useAdvancedGamification.js
import { useState, useEffect } from 'react'
import apiClient from '../services/apiClient'

export const useAdvancedGamification = () => {
  const [userStats, setUserStats] = useState({
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    totalXP: 0,
    badges: [],
    achievements: [],
    rank: 0,
    streak: 0,
    weeklyXP: 0,
    monthlyXP: 0
  })

  const [loading, setLoading] = useState(true)

  // Sistema de níveis com progressão exponencial
  const calculateLevel = (totalXP) => {
    return Math.floor(Math.sqrt(totalXP / 100)) + 1
  }

  const calculateXPToNextLevel = (currentLevel, totalXP) => {
    const nextLevelXP = Math.pow(currentLevel, 2) * 100
    return nextLevelXP - totalXP
  }

  // Sistema de badges avançado
  const badges = [
    // Badges de Nível
    { id: 'rookie', name: 'Novato', description: 'Alcance o nível 5', icon: '🌱', requirement: { type: 'level', value: 5 }, rarity: 'common' },
    { id: 'veteran', name: 'Veterano', description: 'Alcance o nível 15', icon: '⚔️', requirement: { type: 'level', value: 15 }, rarity: 'rare' },
    { id: 'master', name: 'Mestre', description: 'Alcance o nível 30', icon: '👑', requirement: { type: 'level', value: 30 }, rarity: 'epic' },
    { id: 'legend', name: 'Lenda', description: 'Alcance o nível 50', icon: '🏆', requirement: { type: 'level', value: 50 }, rarity: 'legendary' },
    
    // Badges de Performance
    { id: 'sharpshooter', name: 'Atirador de Elite', description: 'Taxa de acerto acima de 80%', icon: '🎯', requirement: { type: 'winRate', value: 80 }, rarity: 'rare' },
    { id: 'lucky', name: 'Sortudo', description: 'Ganhe 5 vezes seguidas', icon: '🍀', requirement: { type: 'streak', value: 5 }, rarity: 'common' },
    { id: 'unlucky', name: 'Azarado', description: 'Perda 10 vezes seguidas', icon: '😅', requirement: { type: 'loseStreak', value: 10 }, rarity: 'common' },
    
    // Badges de Atividade
    { id: 'dedicated', name: 'Dedicado', description: 'Jogue 7 dias seguidos', icon: '🔥', requirement: { type: 'dailyStreak', value: 7 }, rarity: 'rare' },
    { id: 'nightowl', name: 'Coruja Noturna', description: 'Jogue após meia-noite', icon: '🦉', requirement: { type: 'nightGames', value: 10 }, rarity: 'common' },
    { id: 'earlybird', name: 'Madrugador', description: 'Jogue antes das 6h', icon: '🐦', requirement: { type: 'earlyGames', value: 10 }, rarity: 'common' },
    
    // Badges de Zona
    { id: 'corner_specialist', name: 'Especialista em Cantos', description: '100 gols nos cantos', icon: '📐', requirement: { type: 'cornerGoals', value: 100 }, rarity: 'rare' },
    { id: 'center_master', name: 'Mestre do Centro', description: '100 gols no centro', icon: '🎯', requirement: { type: 'centerGoals', value: 100 }, rarity: 'rare' },
    
    // Badges de Gol de Ouro
    { id: 'golden_goal', name: 'Gol de Ouro', description: 'Marque um Gol de Ouro', icon: '⚡', requirement: { type: 'goldenGoals', value: 1 }, rarity: 'epic' },
    { id: 'golden_hunter', name: 'Caçador de Ouro', description: '5 Gols de Ouro', icon: '🏅', requirement: { type: 'goldenGoals', value: 5 }, rarity: 'legendary' },
    
    // Badges de Tempo
    { id: 'speed_demon', name: 'Demônio da Velocidade', description: 'Jogue 50 partidas em 1 hora', icon: '⚡', requirement: { type: 'gamesPerHour', value: 50 }, rarity: 'epic' },
    { id: 'patience', name: 'Paciência', description: 'Espere 1 hora entre jogos', icon: '⏰', requirement: { type: 'waitTime', value: 3600 }, rarity: 'rare' },
    
    // Badges de Dinheiro
    { id: 'big_spender', name: 'Gastador', description: 'Aposte R$ 1000 total', icon: '💰', requirement: { type: 'totalBets', value: 1000 }, rarity: 'rare' },
    { id: 'big_winner', name: 'Grande Vencedor', description: 'Ganhe R$ 500 total', icon: '💎', requirement: { type: 'totalWins', value: 500 }, rarity: 'epic' },
    { id: 'high_roller', name: 'Apostador Alto', description: 'Aposte R$ 10 em uma partida', icon: '🎰', requirement: { type: 'maxBet', value: 10 }, rarity: 'common' }
  ]

  // Sistema de conquistas expandido
  const achievements = [
    // Conquistas de Início
    { id: 'first_goal', name: 'Primeiro Gol', description: 'Marque seu primeiro gol', icon: '⚽', xp: 50, category: 'goals' },
    { id: 'first_win', name: 'Primeira Vitória', description: 'Ganhe sua primeira partida', icon: '🏆', xp: 100, category: 'wins' },
    { id: 'first_bet', name: 'Primeira Aposta', description: 'Faça sua primeira aposta', icon: '🎯', xp: 25, category: 'bets' },
    
    // Conquistas de Quantidade
    { id: 'century', name: 'Centurião', description: 'Jogue 100 partidas', icon: '💯', xp: 500, category: 'games' },
    { id: 'goals_10', name: 'Dez Gols', description: 'Marque 10 gols', icon: '⚽', xp: 200, category: 'goals' },
    { id: 'goals_50', name: 'Cinquenta Gols', description: 'Marque 50 gols', icon: '⚽', xp: 1000, category: 'goals' },
    { id: 'goals_100', name: 'Centena de Gols', description: 'Marque 100 gols', icon: '⚽', xp: 2500, category: 'goals' },
    { id: 'goals_500', name: 'Quinhentos Gols', description: 'Marque 500 gols', icon: '⚽', xp: 10000, category: 'goals' },
    
    // Conquistas de Sequência
    { id: 'streak_3', name: 'Sequência de 3', description: 'Ganhe 3 vezes seguidas', icon: '🔥', xp: 150, category: 'streak' },
    { id: 'streak_5', name: 'Sequência de 5', description: 'Ganhe 5 vezes seguidas', icon: '🔥', xp: 300, category: 'streak' },
    { id: 'streak_10', name: 'Sequência de 10', description: 'Ganhe 10 vezes seguidas', icon: '🔥', xp: 750, category: 'streak' },
    
    // Conquistas de Precisão
    { id: 'accuracy_50', name: 'Precisão 50%', description: 'Mantenha 50% de precisão em 50 jogos', icon: '🎯', xp: 400, category: 'accuracy' },
    { id: 'accuracy_70', name: 'Precisão 70%', description: 'Mantenha 70% de precisão em 50 jogos', icon: '🎯', xp: 800, category: 'accuracy' },
    { id: 'accuracy_90', name: 'Precisão 90%', description: 'Mantenha 90% de precisão em 50 jogos', icon: '🎯', xp: 2000, category: 'accuracy' },
    
    // Conquistas de Tempo
    { id: 'daily_player', name: 'Jogador Diário', description: 'Jogue todos os dias por uma semana', icon: '📅', xp: 500, category: 'time' },
    { id: 'weekly_champion', name: 'Campeão Semanal', description: 'Seja o melhor da semana', icon: '👑', xp: 1000, category: 'ranking' },
    { id: 'monthly_legend', name: 'Lenda Mensal', description: 'Seja o melhor do mês', icon: '🏆', xp: 5000, category: 'ranking' },
    
    // Conquistas Especiais
    { id: 'golden_goal_first', name: 'Primeiro Gol de Ouro', description: 'Marque seu primeiro Gol de Ouro', icon: '⚡', xp: 2000, category: 'special' },
    { id: 'golden_goal_5', name: 'Cinco Gols de Ouro', description: 'Marque 5 Gols de Ouro', icon: '⚡', xp: 10000, category: 'special' },
    { id: 'perfect_day', name: 'Dia Perfeito', description: 'Ganhe todas as partidas em um dia (mín. 10)', icon: '✨', xp: 1500, category: 'special' },
    { id: 'comeback_king', name: 'Rei da Virada', description: 'Ganhe após perder 5 vezes seguidas', icon: '🔄', xp: 1000, category: 'special' }
  ]

  // Carregar dados do usuário
  const loadUserStats = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/api/user/gamification')
      
      if (response.data.success) {
        const data = response.data.data
        const level = calculateLevel(data.totalXP || 0)
        
        setUserStats({
          level,
          xp: data.currentXP || 0,
          xpToNextLevel: calculateXPToNextLevel(level, data.totalXP || 0),
          totalXP: data.totalXP || 0,
          badges: data.badges || [],
          achievements: data.achievements || [],
          rank: data.rank || 0,
          streak: data.streak || 0,
          weeklyXP: data.weeklyXP || 0,
          monthlyXP: data.monthlyXP || 0
        })
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
      // Dados padrão em caso de erro
      setUserStats({
        level: 1,
        xp: 0,
        xpToNextLevel: 100,
        totalXP: 0,
        badges: [],
        achievements: [],
        rank: 0,
        streak: 0,
        weeklyXP: 0,
        monthlyXP: 0
      })
    } finally {
      setLoading(false)
    }
  }

  // Adicionar XP
  const addXP = async (amount, reason) => {
    try {
      const response = await apiClient.post('/api/user/xp', {
        amount,
        reason
      })
      
      if (response.data.success) {
        await loadUserStats() // Recarregar dados
        return true
      }
    } catch (error) {
      console.error('Erro ao adicionar XP:', error)
    }
    return false
  }

  // Verificar conquistas
  const checkAchievements = async () => {
    try {
      const response = await apiClient.post('/api/user/achievements/check')
      return response.data.success
    } catch (error) {
      console.error('Erro ao verificar conquistas:', error)
      return false
    }
  }

  // Verificar badges
  const checkBadges = async () => {
    try {
      const response = await apiClient.post('/api/user/badges/check')
      return response.data.success
    } catch (error) {
      console.error('Erro ao verificar badges:', error)
      return false
    }
  }

  // Obter ranking
  const getRanking = async (period = 'all') => {
    try {
      const response = await apiClient.get(`/api/ranking?period=${period}`)
      return response.data.success ? response.data.data : []
    } catch (error) {
      console.error('Erro ao obter ranking:', error)
      return []
    }
  }

  useEffect(() => {
    loadUserStats()
  }, [])

  return {
    userStats,
    badges,
    achievements,
    loading,
    addXP,
    checkAchievements,
    checkBadges,
    getRanking,
    loadUserStats
  }
}

export default useAdvancedGamification
