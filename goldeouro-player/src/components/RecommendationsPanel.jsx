import React, { useState } from 'react'
import usePlayerAnalytics from '../hooks/usePlayerAnalytics'

const RecommendationsPanel = () => {
  const { getCurrentRecommendations, getCurrentPatterns } = usePlayerAnalytics()
  const [isExpanded, setIsExpanded] = useState(false)
  const [dismissedRecommendations, setDismissedRecommendations] = useState(new Set())

  const recommendations = getCurrentRecommendations()
  const patterns = getCurrentPatterns()

  // Filtrar recomendações não dispensadas
  const activeRecommendations = recommendations.filter(
    rec => !dismissedRecommendations.has(rec.id)
  )

  // Dispensar recomendação
  const dismissRecommendation = (id) => {
    setDismissedRecommendations(prev => new Set([...prev, id]))
  }

  // Obter cor da prioridade
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-500/20 border-red-500/30'
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30'
      case 'low': return 'text-green-400 bg-green-500/20 border-green-500/30'
      default: return 'text-blue-400 bg-blue-500/20 border-blue-500/30'
    }
  }

  // Obter ícone da confiança
  const getConfidenceIcon = (confidence) => {
    if (confidence >= 0.8) return '🟢'
    if (confidence >= 0.6) return '🟡'
    return '🔴'
  }

  if (activeRecommendations.length === 0) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
        <div className="text-center">
          <div className="text-4xl mb-4">🤖</div>
          <h3 className="text-xl font-bold text-white mb-2">
            IA Analisando...
          </h3>
          <p className="text-white/70">
            Jogue algumas partidas para receber recomendações personalizadas!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
      {/* Header */}
      <div 
        className="p-6 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">🤖</div>
            <div>
              <h3 className="text-xl font-bold text-white">
                Recomendações da IA
              </h3>
              <p className="text-white/70 text-sm">
                {activeRecommendations.length} sugestão(ões) personalizada(s)
              </p>
            </div>
          </div>
          <div className="text-white/50">
            {isExpanded ? '▼' : '▶'}
          </div>
        </div>
      </div>

      {/* Conteúdo Expandido */}
      {isExpanded && (
        <div className="px-6 pb-6 space-y-4">
          {/* Estatísticas Rápidas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {Math.round(patterns.successRate * 100)}%
              </div>
              <div className="text-white/70 text-sm">Taxa de Sucesso</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {patterns.winStreak}
              </div>
              <div className="text-white/70 text-sm">Sequência Atual</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {patterns.totalGames}
              </div>
              <div className="text-white/70 text-sm">Jogos Totais</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                R$ {patterns.optimalBetAmount?.toFixed(2) || '0.00'}
              </div>
              <div className="text-white/70 text-sm">Aposta Ideal</div>
            </div>
          </div>

          {/* Recomendações */}
          <div className="space-y-3">
            {activeRecommendations.map((recommendation) => (
              <div
                key={recommendation.id}
                className={`p-4 rounded-xl border ${getPriorityColor(recommendation.priority)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-xl">{recommendation.icon}</span>
                      <h4 className="font-bold text-white">
                        {recommendation.title}
                      </h4>
                      <span className="text-sm">
                        {getConfidenceIcon(recommendation.confidence)}
                      </span>
                    </div>
                    <p className="text-white/80 text-sm mb-2">
                      {recommendation.message}
                    </p>
                    <div className="text-white/60 text-xs">
                      💡 {recommendation.action}
                    </div>
                  </div>
                  <button
                    onClick={() => dismissRecommendation(recommendation.id)}
                    className="text-white/50 hover:text-white/80 transition-colors ml-2"
                    title="Dispensar recomendação"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Informações Adicionais */}
          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-blue-400">ℹ️</span>
              <h4 className="font-bold text-blue-400">Como Funciona</h4>
            </div>
            <p className="text-white/70 text-sm">
              Nossa IA analisa seus padrões de jogo para sugerir estratégias personalizadas. 
              As recomendações são baseadas em sua taxa de sucesso, zonas favoritas, 
              horários de jogo e sequências de vitórias.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default RecommendationsPanel
