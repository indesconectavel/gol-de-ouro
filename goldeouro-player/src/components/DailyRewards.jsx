import React, { useState, useEffect } from 'react'
import useGamification from '../hooks/useGamification'

const DailyRewards = () => {
  const [rewards, setRewards] = useState([])
  const [currentDay, setCurrentDay] = useState(0)
  const [lastClaimed, setLastClaimed] = useState(null)
  const [canClaim, setCanClaim] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)
  const { addExperience, getUserStats } = useGamification()

  // Configuração de recompensas diárias
  const dailyRewardsConfig = [
    {
      day: 1,
      reward: { type: 'experience', amount: 50, name: '50 XP' },
      icon: '🌱',
      title: 'Primeiro Dia',
      description: 'Bem-vindo ao Gol de Ouro!'
    },
    {
      day: 2,
      reward: { type: 'experience', amount: 75, name: '75 XP' },
      icon: '🌿',
      title: 'Segundo Dia',
      description: 'Continue sua jornada!'
    },
    {
      day: 3,
      reward: { type: 'experience', amount: 100, name: '100 XP' },
      icon: '🌳',
      title: 'Terceiro Dia',
      description: 'Você está evoluindo!'
    },
    {
      day: 4,
      reward: { type: 'experience', amount: 150, name: '150 XP' },
      icon: '🎯',
      title: 'Quarto Dia',
      description: 'Foco e determinação!'
    },
    {
      day: 5,
      reward: { type: 'experience', amount: 200, name: '200 XP' },
      icon: '⭐',
      title: 'Quinto Dia',
      description: 'Meio caminho andado!'
    },
    {
      day: 6,
      reward: { type: 'experience', amount: 300, name: '300 XP' },
      icon: '🏆',
      title: 'Sexto Dia',
      description: 'Quase lá!'
    },
    {
      day: 7,
      reward: { type: 'experience', amount: 500, name: '500 XP' },
      icon: '👑',
      title: 'Sétimo Dia',
      description: 'Semana completa!'
    }
  ]

  // Verificar se pode reivindicar recompensa
  useEffect(() => {
    const checkCanClaim = () => {
      const today = new Date().toDateString()
      const lastClaimedDate = lastClaimed ? new Date(lastClaimed).toDateString() : null
      
      if (lastClaimedDate === today) {
        setCanClaim(false)
      } else {
        setCanClaim(true)
      }
    }

    checkCanClaim()
  }, [lastClaimed])

  // Carregar dados salvos
  useEffect(() => {
    const savedData = localStorage.getItem('daily_rewards_data')
    if (savedData) {
      const data = JSON.parse(savedData)
      setCurrentDay(data.currentDay || 0)
      setLastClaimed(data.lastClaimed)
    }
  }, [])

  // Salvar dados
  useEffect(() => {
    const data = {
      currentDay,
      lastClaimed
    }
    localStorage.setItem('daily_rewards_data', JSON.stringify(data))
  }, [currentDay, lastClaimed])

  // Reivindicar recompensa
  const claimReward = async () => {
    if (!canClaim || isClaiming) return

    setIsClaiming(true)
    
    try {
      const reward = dailyRewardsConfig[currentDay]
      
      // Adicionar experiência
      addExperience(reward.reward.amount, `Recompensa diária - Dia ${reward.day}`)
      
      // Atualizar estado
      setLastClaimed(new Date().toISOString())
      setCurrentDay(prev => (prev + 1) % 7)
      
      // Mostrar notificação
      showRewardNotification(reward)
      
    } catch (error) {
      console.error('Erro ao reivindicar recompensa:', error)
    } finally {
      setIsClaiming(false)
    }
  }

  // Mostrar notificação de recompensa
  const showRewardNotification = (reward) => {
    // Implementar notificação visual
    console.log(`🎉 Recompensa reivindicada: ${reward.reward.name}!`)
  }

  // Obter status da recompensa
  const getRewardStatus = (day) => {
    if (day < currentDay) return 'claimed'
    if (day === currentDay && canClaim) return 'available'
    if (day === currentDay && !canClaim) return 'claimed'
    return 'locked'
  }

  // Obter classe CSS baseada no status
  const getRewardClass = (status) => {
    switch (status) {
      case 'claimed':
        return 'bg-green-500/20 border-green-400 text-green-400'
      case 'available':
        return 'bg-yellow-500/20 border-yellow-400 text-yellow-400 animate-pulse'
      case 'locked':
        return 'bg-gray-500/20 border-gray-500 text-gray-500'
      default:
        return 'bg-white/10 border-white/20 text-white'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-blue-900 to-purple-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            🎁 Recompensas Diárias
          </h1>
          <p className="text-xl text-white/70">
            Reivindique sua recompensa diária e continue evoluindo!
          </p>
        </div>

        {/* Status Atual */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">
                Status das Recompensas
              </h2>
              <p className="text-white/70">
                {canClaim 
                  ? 'Você pode reivindicar sua recompensa de hoje!'
                  : 'Você já reivindicou sua recompensa de hoje. Volte amanhã!'
                }
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-yellow-400">
                Dia {currentDay + 1}
              </div>
              <div className="text-white/70">
                Próxima recompensa
              </div>
            </div>
          </div>
        </div>

        {/* Recompensas */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4 mb-8">
          {dailyRewardsConfig.map((reward, index) => {
            const status = getRewardStatus(index)
            const isCurrent = index === currentDay
            
            return (
              <div
                key={reward.day}
                className={`relative p-4 rounded-xl border-2 transition-all ${
                  getRewardClass(status)
                } ${isCurrent ? 'ring-2 ring-yellow-400' : ''}`}
              >
                {/* Dia */}
                <div className="text-center mb-3">
                  <div className="text-2xl mb-1">{reward.icon}</div>
                  <div className="text-sm font-semibold">Dia {reward.day}</div>
                </div>
                
                {/* Recompensa */}
                <div className="text-center">
                  <div className="text-lg font-bold mb-1">
                    {reward.reward.name}
                  </div>
                  <div className="text-xs opacity-70">
                    {reward.title}
                  </div>
                </div>
                
                {/* Status */}
                <div className="absolute top-2 right-2">
                  {status === 'claimed' && (
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                  {status === 'available' && (
                    <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">!</span>
                    </div>
                  )}
                  {status === 'locked' && (
                    <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">🔒</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Botão de Reivindicar */}
        <div className="text-center mb-8">
          <button
            onClick={claimReward}
            disabled={!canClaim || isClaiming}
            className={`px-8 py-4 rounded-xl font-bold text-lg transition-all ${
              canClaim && !isClaiming
                ? 'bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                : 'bg-gray-500 text-gray-300 cursor-not-allowed'
            }`}
          >
            {isClaiming ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Reivindicando...</span>
              </div>
            ) : canClaim ? (
              '🎁 Reivindicar Recompensa'
            ) : (
              '⏰ Já Reivindicado Hoje'
            )}
          </button>
        </div>

        {/* Informações Adicionais */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <h2 className="text-xl font-bold text-white mb-4">ℹ️ Como Funciona</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">📅 Recompensas Diárias</h3>
              <ul className="text-white/70 space-y-1">
                <li>• Reivindique uma recompensa por dia</li>
                <li>• As recompensas aumentam a cada dia</li>
                <li>• No 7º dia, você ganha uma recompensa especial</li>
                <li>• O ciclo reinicia após 7 dias</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">🎯 Dicas</h3>
              <ul className="text-white/70 space-y-1">
                <li>• Faça login todos os dias para não perder</li>
                <li>• As recompensas incluem XP e pontos</li>
                <li>• Complete a semana para ganhar bônus</li>
                <li>• Quanto mais dias seguidos, melhor!</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DailyRewards
