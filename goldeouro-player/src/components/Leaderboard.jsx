import React, { useState, useEffect } from 'react'
import useGamification from '../hooks/useGamification'

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([])
  const [timeframe, setTimeframe] = useState('all')
  const [category, setCategory] = useState('points')
  const [isLoading, setIsLoading] = useState(false)
  const { getUserStats } = useGamification()

  const timeframes = [
    { id: 'daily', name: 'Diário' },
    { id: 'weekly', name: 'Semanal' },
    { id: 'monthly', name: 'Mensal' },
    { id: 'all', name: 'Todos os Tempos' }
  ]

  const categories = [
    { id: 'points', name: 'Pontos', icon: '⭐' },
    { id: 'goals', name: 'Gols', icon: '⚽' },
    { id: 'wins', name: 'Vitórias', icon: '🏆' },
    { id: 'experience', name: 'Experiência', icon: '📈' },
    { id: 'level', name: 'Nível', icon: '🎯' }
  ]

  // Dados simulados do leaderboard
  const mockLeaderboard = [
    {
      id: 1,
      name: 'João Silva',
      avatar: '👤',
      points: 15420,
      goals: 89,
      wins: 156,
      experience: 8750,
      level: 8,
      rank: 1,
      isCurrentUser: false
    },
    {
      id: 2,
      name: 'Maria Santos',
      avatar: '👩',
      points: 12850,
      goals: 76,
      wins: 134,
      experience: 7200,
      level: 7,
      rank: 2,
      isCurrentUser: false
    },
    {
      id: 3,
      name: 'Pedro Costa',
      avatar: '👨',
      points: 11200,
      goals: 65,
      wins: 118,
      experience: 6800,
      level: 7,
      rank: 3,
      isCurrentUser: false
    },
    {
      id: 4,
      name: 'Ana Oliveira',
      avatar: '👩‍🦰',
      points: 9850,
      goals: 58,
      wins: 102,
      experience: 5900,
      level: 6,
      rank: 4,
      isCurrentUser: false
    },
    {
      id: 5,
      name: 'Carlos Lima',
      avatar: '👨‍🦱',
      points: 8750,
      goals: 52,
      wins: 95,
      experience: 5200,
      level: 6,
      rank: 5,
      isCurrentUser: false
    },
    {
      id: 6,
      name: 'Você',
      avatar: '🎮',
      points: 7200,
      goals: 45,
      wins: 78,
      experience: 4200,
      level: 5,
      rank: 6,
      isCurrentUser: true
    }
  ]

  // Carregar leaderboard
  const loadLeaderboard = async () => {
    setIsLoading(true)
    try {
      // Simular carregamento
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Ordenar por categoria selecionada
      const sorted = [...mockLeaderboard].sort((a, b) => {
        if (category === 'level') return b.level - a.level
        if (category === 'goals') return b.goals - a.goals
        if (category === 'wins') return b.wins - a.wins
        if (category === 'experience') return b.experience - a.experience
        return b.points - a.points
      })
      
      // Atualizar ranks
      const ranked = sorted.map((player, index) => ({
        ...player,
        rank: index + 1
      }))
      
      setLeaderboard(ranked)
    } catch (error) {
      console.error('Erro ao carregar leaderboard:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadLeaderboard()
  }, [timeframe, category])

  // Obter valor da categoria
  const getCategoryValue = (player) => {
    switch (category) {
      case 'goals': return player.goals
      case 'wins': return player.wins
      case 'experience': return player.experience
      case 'level': return player.level
      default: return player.points
    }
  }

  // Formatar valor
  const formatValue = (value) => {
    if (category === 'level') return `Nível ${value}`
    if (category === 'goals') return `${value} gols`
    if (category === 'wins') return `${value} vitórias`
    if (category === 'experience') return `${value.toLocaleString()} XP`
    return `${value.toLocaleString()} pts`
  }

  // Obter cor do rank
  const getRankColor = (rank) => {
    if (rank === 1) return 'text-yellow-400'
    if (rank === 2) return 'text-gray-300'
    if (rank === 3) return 'text-orange-400'
    return 'text-white/70'
  }

  // Obter ícone do rank
  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return '🏅'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            🏆 Leaderboard
          </h1>
          <p className="text-xl text-white/70">
            Os melhores jogadores do Gol de Ouro
          </p>
        </div>

        {/* Filtros */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Período
              </label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
              >
                {timeframes.map((tf) => (
                  <option key={tf.id} value={tf.id}>
                    {tf.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <h2 className="text-xl font-bold text-white mb-6">
            {categories.find(c => c.id === category)?.icon} {categories.find(c => c.id === category)?.name}
          </h2>
          
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
              <p className="text-white/70">Carregando leaderboard...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {leaderboard.map((player) => (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-4 rounded-xl transition-all ${
                    player.isCurrentUser
                      ? 'bg-yellow-500/20 border-2 border-yellow-400'
                      : 'bg-white/5 border border-white/10'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl font-bold text-yellow-400">
                      {getRankIcon(player.rank)}
                    </div>
                    
                    <div className="text-3xl">{player.avatar}</div>
                    
                    <div>
                      <div className={`text-lg font-semibold ${
                        player.isCurrentUser ? 'text-yellow-400' : 'text-white'
                      }`}>
                        {player.name}
                        {player.isCurrentUser && ' (Você)'}
                      </div>
                      <div className="text-white/70 text-sm">
                        Nível {player.level} • {player.goals} gols • {player.wins} vitórias
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-xl font-bold ${getRankColor(player.rank)}`}>
                      {formatValue(getCategoryValue(player))}
                    </div>
                    <div className="text-white/70 text-sm">
                      #{player.rank} lugar
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Estatísticas do Usuário */}
        <div className="mt-8 bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <h2 className="text-xl font-bold text-white mb-6">📊 Suas Estatísticas</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">6º</div>
              <div className="text-white/70">Posição</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">45</div>
              <div className="text-white/70">Gols</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">78</div>
              <div className="text-white/70">Vitórias</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">5</div>
              <div className="text-white/70">Nível</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Leaderboard
