// components/AdvancedStats.jsx
import React from 'react'
import { useAdvancedGamification } from '../hooks/useAdvancedGamification'

/**
 * Resumo honesto para /profile — sem gráficos ou comparações simuladas.
 * Valores derivam do estado do perfil e da API de gamificação quando carregados.
 */
const AdvancedStats = ({ user }) => {
  const { userStats, loading } = useAdvancedGamification()

  if (!user) return null

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
        <div className="animate-pulse">
          <div className="h-6 bg-white/20 rounded mb-4"></div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="h-20 bg-white/20 rounded"></div>
            <div className="h-20 bg-white/20 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  const saldoLabel =
    user.balance != null && !Number.isNaN(user.balance)
      ? `R$ ${Number(user.balance).toFixed(2)}`
      : '—'

  return (
    <div className="space-y-6">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl">
        <h3 className="text-xl font-bold text-white mb-2">Estatísticas avançadas</h3>
        <p className="text-white/70 text-sm mb-6">
          Gráficos por período e comparações com a média não estão disponíveis nesta versão.
          Os valores abaixo refletem apenas o resumo do perfil e da gamificação já carregados.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 text-center">
            <div className="text-2xl font-bold text-green-400">{user.winRate ?? 0}%</div>
            <div className="text-white/70 text-sm">Precisão</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 text-center">
            <div className="text-2xl font-bold text-blue-400">{user.totalBets ?? 0}</div>
            <div className="text-white/70 text-sm">Total de chutes</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 text-center">
            <div className="text-2xl font-bold text-purple-400">{user.totalWins ?? 0}</div>
            <div className="text-white/70 text-sm">Gols marcados</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 text-center">
            <div className="text-2xl font-bold text-yellow-400">{saldoLabel}</div>
            <div className="text-white/70 text-sm">Saldo (perfil)</div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 text-center">
            <div className="text-xl font-bold text-cyan-400">{userStats.level}</div>
            <div className="text-white/70 text-xs">Nível (gamificação)</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 text-center">
            <div className="text-xl font-bold text-orange-400">
              {userStats.totalXP.toLocaleString()}
            </div>
            <div className="text-white/70 text-xs">XP total</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 text-center">
            <div className="text-xl font-bold text-pink-400">
              {userStats.rank ? `#${userStats.rank}` : '—'}
            </div>
            <div className="text-white/70 text-xs">Ranking</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdvancedStats
