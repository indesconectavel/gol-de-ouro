import React from 'react'
import useGamification from '../hooks/useGamification'

const GamificationProfile = () => {
  const {
    userLevel,
    experience,
    achievements,
    badges,
    points,
    rank,
    levelConfig,
    getLevelProgress
  } = useGamification()

  const levelInfo = levelConfig[userLevel]
  const progress = getLevelProgress()

  // Calcular ranking baseado em pontos
  const getRankInfo = (points) => {
    if (points >= 10000) return { title: 'Lenda', color: '#EC4899', icon: '👑' }
    if (points >= 5000) return { title: 'Mestre', color: '#8B5CF6', icon: '🏆' }
    if (points >= 2000) return { title: 'Expert', color: '#F59E0B', icon: '⭐' }
    if (points >= 1000) return { title: 'Profissional', color: '#3B82F6', icon: '💎' }
    if (points >= 500) return { title: 'Competidor', color: '#10B981', icon: '🎯' }
    return { title: 'Iniciante', color: '#6B7280', icon: '🌱' }
  }

  const rankInfo = getRankInfo(points)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            🎮 Perfil de Gamificação
          </h1>
          <p className="text-xl text-white/70">
            Sua jornada no Gol de Ouro
          </p>
        </div>

        {/* Estatísticas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 text-center">
            <div className="text-4xl mb-2">{levelInfo.icon || '🎯'}</div>
            <div className="text-2xl font-bold text-white mb-1">Nível {userLevel}</div>
            <div className="text-white/70">{levelInfo.title}</div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 text-center">
            <div className="text-4xl mb-2">⭐</div>
            <div className="text-2xl font-bold text-yellow-400 mb-1">{points.toLocaleString()}</div>
            <div className="text-white/70">Pontos</div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 text-center">
            <div className="text-4xl mb-2">🏆</div>
            <div className="text-2xl font-bold text-green-400 mb-1">{achievements.length}</div>
            <div className="text-white/70">Conquistas</div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 text-center">
            <div className="text-4xl mb-2">🏅</div>
            <div className="text-2xl font-bold text-purple-400 mb-1">{badges.length}</div>
            <div className="text-white/70">Badges</div>
          </div>
        </div>

        {/* Barra de Progresso do Nível */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Progresso do Nível</h2>
            <div className="text-white/70">
              {progress.current} / {progress.needed} XP
            </div>
          </div>
          
          <div className="w-full bg-white/20 rounded-full h-4 mb-2">
            <div
              className="bg-gradient-to-r from-yellow-400 to-orange-500 h-4 rounded-full transition-all duration-500"
              style={{ width: `${progress.percentage}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between text-sm text-white/70">
            <span>Nível {userLevel}</span>
            <span>Nível {userLevel + 1}</span>
          </div>
        </div>

        {/* Ranking */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">🏆 Ranking</h2>
          <div className="flex items-center space-x-4">
            <div className="text-6xl">{rankInfo.icon}</div>
            <div>
              <div className="text-2xl font-bold text-white">{rankInfo.title}</div>
              <div className="text-white/70">Baseado em {points.toLocaleString()} pontos</div>
            </div>
          </div>
        </div>

        {/* Conquistas */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-8">
          <h2 className="text-xl font-bold text-white mb-6">🏆 Conquistas</h2>
          
          {achievements.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🏆</div>
              <p className="text-white/70 text-lg">
                Nenhuma conquista ainda. Continue jogando para desbloquear!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="bg-white/5 rounded-xl p-4 border border-white/10"
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="text-2xl">{achievement.icon}</div>
                    <div>
                      <div className="text-white font-semibold">{achievement.name}</div>
                      <div className="text-white/70 text-sm">{achievement.description}</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      achievement.rarity === 'legendary' ? 'bg-purple-500/20 text-purple-400' :
                      achievement.rarity === 'epic' ? 'bg-pink-500/20 text-pink-400' :
                      achievement.rarity === 'rare' ? 'bg-blue-500/20 text-blue-400' :
                      achievement.rarity === 'uncommon' ? 'bg-green-500/20 text-green-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {achievement.rarity}
                    </span>
                    <span className="text-yellow-400 font-semibold">+{achievement.points} XP</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Badges */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <h2 className="text-xl font-bold text-white mb-6">🏅 Badges</h2>
          
          {badges.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🏅</div>
              <p className="text-white/70 text-lg">
                Nenhum badge ainda. Complete desafios para ganhar!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className="bg-white/5 rounded-xl p-4 border border-white/10"
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="text-2xl">{badge.icon}</div>
                    <div>
                      <div className="text-white font-semibold">{badge.name}</div>
                      <div className="text-white/70 text-sm">{badge.description}</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70 text-xs">
                      Conquistado em {new Date(badge.earnedAt).toLocaleDateString('pt-BR')}
                    </span>
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: badge.color }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default GamificationProfile
