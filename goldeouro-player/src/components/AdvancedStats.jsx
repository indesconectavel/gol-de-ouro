// components/AdvancedStats.jsx
import React, { useState, useEffect } from 'react'
import { useAdvancedGamification } from '../hooks/useAdvancedGamification'

const AdvancedStats = ({ user }) => {
  const { userStats, loading } = useAdvancedGamification()
  const [selectedPeriod, setSelectedPeriod] = useState('week')
  const [statsData, setStatsData] = useState({
    performance: [],
    trends: [],
    comparisons: [],
    detailed: {}
  })

  // Dados simulados para gráficos (serão substituídos por dados reais da API)
  const performanceData = {
    week: [
      { day: 'Seg', goals: 12, games: 20, accuracy: 60 },
      { day: 'Ter', goals: 8, games: 15, accuracy: 53 },
      { day: 'Qua', goals: 15, games: 25, accuracy: 60 },
      { day: 'Qui', goals: 10, games: 18, accuracy: 56 },
      { day: 'Sex', goals: 18, games: 30, accuracy: 60 },
      { day: 'Sáb', goals: 22, games: 35, accuracy: 63 },
      { day: 'Dom', goals: 16, games: 28, accuracy: 57 }
    ],
    month: [
      { week: 'Sem 1', goals: 45, games: 75, accuracy: 60 },
      { week: 'Sem 2', goals: 52, games: 88, accuracy: 59 },
      { week: 'Sem 3', goals: 48, games: 82, accuracy: 59 },
      { week: 'Sem 4', goals: 55, games: 95, accuracy: 58 }
    ]
  }

  const trendData = {
    winRate: [
      { date: '2024-01-01', value: 45 },
      { date: '2024-01-08', value: 52 },
      { date: '2024-01-15', value: 58 },
      { date: '2024-01-22', value: 61 },
      { date: '2024-01-29', value: 59 }
    ],
    xp: [
      { date: '2024-01-01', value: 0 },
      { date: '2024-01-08', value: 250 },
      { date: '2024-01-15', value: 580 },
      { date: '2024-01-22', value: 950 },
      { date: '2024-01-29', value: 1250 }
    ]
  }

  const comparisonData = {
    vsAverage: {
      winRate: { user: 59, average: 45, difference: 14 },
      gamesPerDay: { user: 3.2, average: 2.1, difference: 1.1 },
      xpPerGame: { user: 25, average: 18, difference: 7 }
    },
    vsTopPlayers: {
      rank: 12,
      percentile: 85,
      nextRank: 8
    }
  }

  const detailedMetrics = {
    zones: {
      'TL': { goals: 45, attempts: 120, accuracy: 37.5 },
      'TR': { goals: 38, attempts: 95, accuracy: 40.0 },
      'C': { goals: 52, attempts: 80, accuracy: 65.0 },
      'BL': { goals: 41, attempts: 110, accuracy: 37.3 },
      'BR': { goals: 39, attempts: 105, accuracy: 37.1 }
    },
    times: {
      morning: { games: 45, winRate: 62 },
      afternoon: { games: 78, winRate: 58 },
      evening: { games: 92, winRate: 61 },
      night: { games: 35, winRate: 57 }
    },
    bets: {
      '1': { games: 120, winRate: 58 },
      '2': { games: 85, winRate: 61 },
      '5': { games: 45, winRate: 64 },
      '10': { games: 20, winRate: 70 }
    }
  }

  // Componente de gráfico simples (sem biblioteca externa)
  const SimpleChart = ({ data, type = 'line', color = 'blue' }) => {
    const maxValue = Math.max(...data.map(d => d.value || d.goals || d.games))
    
    return (
      <div className="w-full h-48 bg-white/5 rounded-lg p-4">
        <div className="flex items-end justify-between h-full">
          {data.map((item, index) => {
            const height = ((item.value || item.goals || item.games) / maxValue) * 100
            return (
              <div key={index} className="flex flex-col items-center flex-1">
                <div 
                  className={`w-8 bg-gradient-to-t from-${color}-500 to-${color}-400 rounded-t transition-all duration-300 hover:from-${color}-400 hover:to-${color}-300`}
                  style={{ height: `${height}%` }}
                ></div>
                <span className="text-xs text-white/70 mt-2">
                  {item.day || item.week || item.date?.split('-')[2]}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Componente de métrica detalhada
  const MetricCard = ({ title, value, subtitle, trend, color = 'blue' }) => (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-white/80 text-sm font-medium">{title}</h4>
        {trend && (
          <span className={`text-xs px-2 py-1 rounded-full ${
            trend > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {trend > 0 ? '↗' : '↘'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className={`text-2xl font-bold text-${color}-400`}>{value}</p>
      {subtitle && <p className="text-white/60 text-xs mt-1">{subtitle}</p>}
    </div>
  )

  // Componente de comparação
  const ComparisonCard = ({ title, userValue, averageValue, unit = '' }) => {
    const difference = userValue - averageValue
    const percentage = averageValue > 0 ? ((difference / averageValue) * 100).toFixed(1) : 0
    
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
        <h4 className="text-white/80 text-sm font-medium mb-3">{title}</h4>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-white/70 text-sm">Você</span>
            <span className="text-green-400 font-bold">{userValue}{unit}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/70 text-sm">Média</span>
            <span className="text-white/50">{averageValue}{unit}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-white/10">
            <span className="text-white/70 text-sm">Diferença</span>
            <span className={`font-bold ${difference > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {difference > 0 ? '+' : ''}{difference.toFixed(1)}{unit} ({percentage}%)
            </span>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
        <div className="animate-pulse">
          <div className="h-6 bg-white/20 rounded mb-4"></div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="h-20 bg-white/20 rounded"></div>
            <div className="h-20 bg-white/20 rounded"></div>
          </div>
          <div className="h-48 bg-white/20 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header com período */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Estatísticas Avançadas</h3>
        <div className="flex space-x-2">
          {['week', 'month', 'all'].map(period => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                selectedPeriod === period
                  ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-900'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {period === 'week' ? 'Semana' : period === 'month' ? 'Mês' : 'Todos'}
            </button>
          ))}
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard 
          title="Taxa de Vitória" 
          value={`${user.winRate}%`} 
          subtitle="Últimos 30 dias"
          trend={5.2}
          color="green"
        />
        <MetricCard 
          title="Jogos/Dia" 
          value="3.2" 
          subtitle="Média semanal"
          trend={-2.1}
          color="blue"
        />
        <MetricCard 
          title="XP Total" 
          value={userStats.totalXP.toLocaleString()} 
          subtitle={`Nível ${userStats.level}`}
          trend={12.5}
          color="purple"
        />
        <MetricCard 
          title="Ranking" 
          value={`#${userStats.rank}`} 
          subtitle="Top 15%"
          trend={-3}
          color="yellow"
        />
      </div>

      {/* Gráficos de Performance */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
        <h4 className="text-lg font-bold text-white mb-4">Performance por Período</h4>
        <SimpleChart 
          data={performanceData[selectedPeriod]} 
          type="bar" 
          color="blue" 
        />
        <div className="flex justify-center space-x-6 mt-4 text-sm text-white/70">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
            Gols
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
            Jogos
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-purple-500 rounded mr-2"></div>
            Precisão
          </div>
        </div>
      </div>

      {/* Comparações */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <h4 className="text-lg font-bold text-white mb-4">Comparação com Média</h4>
          <div className="space-y-4">
            <ComparisonCard 
              title="Taxa de Vitória" 
              userValue={user.winRate} 
              averageValue={45} 
              unit="%" 
            />
            <ComparisonCard 
              title="Jogos por Dia" 
              userValue={3.2} 
              averageValue={2.1} 
            />
            <ComparisonCard 
              title="XP por Jogo" 
              userValue={25} 
              averageValue={18} 
            />
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <h4 className="text-lg font-bold text-white mb-4">Métricas Detalhadas</h4>
          <div className="space-y-4">
            <div>
              <h5 className="text-white/80 text-sm font-medium mb-2">Zonas Preferidas</h5>
              <div className="space-y-2">
                {Object.entries(detailedMetrics.zones).map(([zone, data]) => (
                  <div key={zone} className="flex justify-between items-center">
                    <span className="text-white/70 text-sm">{zone}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-white/50 text-xs">{data.goals}/{data.attempts}</span>
                      <span className="text-green-400 text-xs font-bold">{data.accuracy}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h5 className="text-white/80 text-sm font-medium mb-2">Horários de Jogo</h5>
              <div className="space-y-2">
                {Object.entries(detailedMetrics.times).map(([time, data]) => (
                  <div key={time} className="flex justify-between items-center">
                    <span className="text-white/70 text-sm capitalize">{time}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-white/50 text-xs">{data.games} jogos</span>
                      <span className="text-blue-400 text-xs font-bold">{data.winRate}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tendências */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
        <h4 className="text-lg font-bold text-white mb-4">Tendências</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h5 className="text-white/80 text-sm font-medium mb-2">Evolução da Taxa de Vitória</h5>
            <SimpleChart data={trendData.winRate} color="green" />
          </div>
          <div>
            <h5 className="text-white/80 text-sm font-medium mb-2">Progressão de XP</h5>
            <SimpleChart data={trendData.xp} color="purple" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdvancedStats
