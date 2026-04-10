import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import InternalPageLayout from '../components/InternalPageLayout'
import VersionBanner from '../components/VersionBanner'
import apiClient from '../services/apiClient'
import { API_ENDPOINTS } from '../config/api'
import { useAdvancedGamification } from '../hooks/useAdvancedGamification'
import AdvancedStats from '../components/AdvancedStats'
import AvatarSystem from '../components/AvatarSystem'
import NotificationCenter from '../components/NotificationCenter'

/** Texto neutro quando a API não envia o campo (evita email/nome/datas inventados). */
const NOT_INFORMED = '—'

const Profile = () => {
  const { userStats, badges, achievements, loading: gamificationLoading } = useAdvancedGamification()
  const [user, setUser] = useState(null)
  const [profileLoadError, setProfileLoadError] = useState(null)
  const [activeTab, setActiveTab] = useState('info')
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    email: ''
  })
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadUserProfile()
  }, [])

  const loadUserProfile = async () => {
    try {
      setLoading(true)
      setProfileLoadError(null)
      const response = await apiClient.get(API_ENDPOINTS.PROFILE)
      if (response.data.success) {
        const userData = response.data.data
        const displayName =
          (userData.nome && String(userData.nome).trim()) ||
          (userData.email && userData.email.split('@')[0]) ||
          NOT_INFORMED
        const displayEmail =
          (userData.email && String(userData.email).trim()) || NOT_INFORMED
        const joinDate = userData.created_at?.split('T')[0] || NOT_INFORMED
        const saldoRaw = userData.saldo
        const saldoNum =
          saldoRaw !== undefined && saldoRaw !== null && saldoRaw !== ''
            ? Number(saldoRaw)
            : NaN
        const balance = Number.isFinite(saldoNum) ? saldoNum : null

        setUser({
          name: displayName,
          email: displayEmail,
          balance,
          totalBets: userData.total_apostas ?? 0,
          totalWins: userData.total_ganhos ?? 0,
          winRate:
            userData.total_apostas > 0
              ? Math.round((userData.total_ganhos / userData.total_apostas) * 100)
              : 0,
          joinDate,
          level: userData.tipo === 'admin' ? 'Admin' : 'Jogador',
          avatar: '👤'
        })
        setEditForm({
          name: (userData.nome && String(userData.nome).trim()) || '',
          email: (userData.email && String(userData.email).trim()) || ''
        })
      } else {
        setUser(null)
        setProfileLoadError('Não foi possível carregar o perfil.')
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error)
      setUser(null)
      setProfileLoadError('Não foi possível carregar os dados. Verifique a conexão e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const bettingHistory = [] // Dados reais serão carregados do backend

  const withdrawalHistory = [] // Dados reais serão carregados do backend

  const localAchievements = Array.isArray(achievements) ? achievements : []

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      const response = await apiClient.put('/api/user/profile', {
        nome: editForm.name,
        email: editForm.email
      })
      
      if (response.data.success) {
        const d = response.data.data
        const nextName =
          (d.nome && String(d.nome).trim()) ||
          (d.email && d.email.split('@')[0]) ||
          NOT_INFORMED
        const nextEmail = (d.email && String(d.email).trim()) || NOT_INFORMED
        setUser(prev => ({
          ...prev,
          name: nextName,
          email: nextEmail
        }))
        setIsEditing(false)
        alert('Perfil atualizado com sucesso!')
      } else {
        alert(response.data.message || 'Erro ao atualizar perfil')
      }
    } catch (error) {
      console.error('Erro ao salvar perfil:', error)
      alert('Erro ao atualizar perfil. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    if (!user) return
    setEditForm({
      name: user.name,
      email: user.email
    })
    setIsEditing(false)
  }

  // const handleImageSelect = (file) => {
  //   setProfileImage(file)
  //   // Aqui você pode implementar o upload para o servidor
  //   console.log('Imagem selecionada:', file)
  // } // Removido - funcionalidade desnecessária

  const getLevelColor = (level) => {
    switch(level) {
      case 'Bronze': return 'text-orange-400'
      case 'Prata': return 'text-gray-300'
      case 'Ouro': return 'text-yellow-400'
      case 'Diamante': return 'text-blue-400'
      default: return 'text-yellow-400'
    }
  }

  // Função para atualizar avatar
  const handleAvatarUpdate = (newAvatar) => {
    setUser(prev => ({ ...prev, avatar: newAvatar }))
  }

  return (
    <InternalPageLayout title="Perfil" showLogout>
    <div className="min-h-screen flex flex-col">
      <VersionBanner showTime={true} />
      <div
        className="flex-1 relative overflow-hidden p-4"
        style={{
          backgroundImage: 'url(/images/Gol_de_Ouro_Bg02.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        {/* Overlay escuro para melhorar legibilidade */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
      
      {/* Conteúdo principal */}
      <div className="relative z-10 p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-white/70 hover:text-white text-2xl transition-colors bg-white/10 backdrop-blur-lg rounded-full w-10 h-10 flex items-center justify-center hover:bg-white/20"
          >
            ←
          </button>
          <div className="flex items-center space-x-3">
            <Logo size="medium" style={{ width: '60px', height: '60px' }} />
            <h1 className="text-2xl font-bold text-white">Meu Perfil</h1>
          </div>
          <div className="w-10"></div>
        </div>

        {loading && !profileLoadError ? (
          <div className="text-center text-white/80 py-16">Carregando...</div>
        ) : profileLoadError ? (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-6 border border-white/20 shadow-2xl text-center">
            <p className="text-white mb-4">{profileLoadError}</p>
            <button
              type="button"
              onClick={() => loadUserProfile()}
              className="bg-white/10 backdrop-blur-lg border border-sky-400/45 text-sky-100 hover:bg-white/15 hover:border-sky-400/70 font-bold py-3 px-6 rounded-lg transition-all duration-200"
            >
              Tentar novamente
            </button>
          </div>
        ) : user ? (
          <>
        {/* Card Principal do Usuário - Glassmorphism */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white">{user.name}</h2>
              <p className="text-white/70">{user.email}</p>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`text-sm font-bold ${getLevelColor(user.level)}`}>
                  {user.level}
                </span>
                <span className="text-white/50">•</span>
                <span className="text-white/70 text-sm">Membro desde {user.joinDate}</span>
              </div>
            </div>
            <div className="relative pr-4">
              <AvatarSystem user={user} onAvatarUpdate={handleAvatarUpdate} />
            </div>
          </div>

          {/* Estatísticas Principais */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
              <p className="text-2xl font-bold text-yellow-400">
                {user.balance != null && !Number.isNaN(user.balance)
                  ? `R$ ${Number(user.balance).toFixed(2)}`
                  : NOT_INFORMED}
              </p>
              <p className="text-white/70 text-sm">Saldo Atual</p>
            </div>
            <div className="text-center bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
              <p className="text-2xl font-bold text-green-400">{user.totalWins}</p>
              <p className="text-white/70 text-sm">Gols Marcados</p>
            </div>
            <div className="text-center bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
              <p className="text-2xl font-bold text-blue-400">{user.winRate}%</p>
              <p className="text-white/70 text-sm">Precisão</p>
            </div>
            <div className="text-center bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
              <p className="text-2xl font-bold text-purple-400">{user.totalBets}</p>
              <p className="text-white/70 text-sm">Total de Chutes</p>
            </div>
          </div>
        </div>

        {/* Abas de Navegação - Glassmorphism */}
        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-3 px-4 rounded-lg font-bold transition-all duration-200 backdrop-blur-lg border ${
              activeTab === 'info'
                ? 'bg-sky-600/35 text-white border-sky-400/60 shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20 border-white/20'
            }`}
          >
            📋 Informações
          </button>
          <button
            onClick={() => setActiveTab('bets')}
            className={`flex-1 py-3 px-4 rounded-lg font-bold transition-all duration-200 backdrop-blur-lg border ${
              activeTab === 'bets'
                ? 'bg-sky-600/35 text-white border-sky-400/60 shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20 border-white/20'
            }`}
          >
            ⚽ Apostas
          </button>
          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`flex-1 py-3 px-4 rounded-lg font-bold transition-all duration-200 backdrop-blur-lg border ${
              activeTab === 'withdrawals'
                ? 'bg-sky-600/35 text-white border-sky-400/60 shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20 border-white/20'
            }`}
          >
            💰 Saques
          </button>
          <button
            onClick={() => setActiveTab('achievements')}
            className={`flex-1 py-3 px-4 rounded-lg font-bold transition-all duration-200 backdrop-blur-lg border ${
              activeTab === 'achievements'
                ? 'bg-sky-600/35 text-white border-sky-400/60 shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20 border-white/20'
            }`}
          >
            🏆 Conquistas
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 py-3 px-4 rounded-lg font-bold transition-all duration-200 backdrop-blur-lg border ${
              activeTab === 'stats'
                ? 'bg-sky-600/35 text-white border-sky-400/60 shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20 border-white/20'
            }`}
          >
            📊 Estatísticas
          </button>
          <button
            onClick={() => setActiveTab('gamification')}
            className={`flex-1 py-3 px-4 rounded-lg font-bold transition-all duration-200 backdrop-blur-lg border ${
              activeTab === 'gamification'
                ? 'bg-sky-600/35 text-white border-sky-400/60 shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20 border-white/20'
            }`}
          >
            🎮 Gamificação
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex-1 py-3 px-4 rounded-lg font-bold transition-all duration-200 backdrop-blur-lg border ${
              activeTab === 'notifications'
                ? 'bg-sky-600/35 text-white border-sky-400/60 shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20 border-white/20'
            }`}
          >
            🔔 Notificações
          </button>
        </div>

        {/* Conteúdo das Abas - Glassmorphism */}
        {activeTab === 'info' && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Informações Pessoais</h3>
              {!isEditing && (
                <button
                  onClick={handleEdit}
                  className="bg-white/10 backdrop-blur-lg border border-sky-400/45 text-sky-100 hover:bg-white/15 hover:border-sky-400/70 font-bold py-2 px-4 rounded-lg transition-all duration-200"
                >
                  ✏️ Editar
                </button>
              )}
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Nome Completo
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    className="w-full py-3 px-4 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 backdrop-blur-lg"
                  />
                ) : (
                  <input
                    type="text"
                    value={user.name}
                    className="w-full py-3 px-4 bg-white/10 border border-white/20 rounded-lg text-white backdrop-blur-lg"
                    readOnly
                  />
                )}
              </div>
              
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  E-mail
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    className="w-full py-3 px-4 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 backdrop-blur-lg"
                  />
                ) : (
                  <input
                    type="email"
                    value={user.email}
                    className="w-full py-3 px-4 bg-white/10 border border-white/20 rounded-lg text-white backdrop-blur-lg"
                    readOnly
                  />
                )}
              </div>

              {isEditing && (
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={handleSave}
                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200"
                  >
                    💾 Salvar
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex-1 bg-white/10 backdrop-blur-lg border border-white/25 text-white hover:bg-white/20 font-bold py-3 px-6 rounded-lg transition-all duration-200"
                  >
                    ❌ Cancelar
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'bets' && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6">Histórico de Apostas</h3>
            <div className="space-y-3">
              {bettingHistory.map((bet) => (
                <div key={bet.id} className="flex items-center justify-between bg-white/10 backdrop-blur-lg rounded-lg p-4 hover:bg-white/20 transition-colors border border-white/20">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${bet.result === 'Ganhou' ? 'bg-green-400' : 'bg-red-400'}`}></div>
                    <div>
                      <p className="text-white font-medium">R$ {bet.amount.toFixed(2)}</p>
                      <p className="text-white/70 text-sm">{bet.game} • {bet.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${bet.result === 'Ganhou' ? 'text-green-400' : 'text-red-400'}`}>
                      {bet.result}
                    </p>
                    {bet.prize > 0 && (
                      <p className="text-green-400 text-sm">+R$ {bet.prize.toFixed(2)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'withdrawals' && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6">Histórico de Saques</h3>
            <div className="space-y-3">
              {withdrawalHistory.map((withdrawal) => (
                <div key={withdrawal.id} className="flex items-center justify-between bg-white/10 backdrop-blur-lg rounded-lg p-4 hover:bg-white/20 transition-colors border border-white/20">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      withdrawal.status === 'Processado' ? 'bg-green-400' : 'bg-yellow-400'
                    }`}></div>
                    <div>
                      <p className="text-white font-medium">R$ {withdrawal.amount.toFixed(2)}</p>
                      <p className="text-white/70 text-sm">{withdrawal.method} • {withdrawal.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${
                      withdrawal.status === 'Processado' ? 'text-green-400' : 'text-yellow-400'
                    }`}>
                      {withdrawal.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6">Conquistas</h3>
            {localAchievements.length === 0 ? (
              <p className="text-center text-white/70 py-8">
                Nenhuma meta de conquista disponível para exibir.
              </p>
            ) : (
            <div className="grid grid-cols-2 gap-4">
              {localAchievements.map((achievement) => (
                <div key={achievement.id} className={`p-4 rounded-lg border-2 transition-all duration-200 backdrop-blur-lg ${
                  achievement.unlocked 
                    ? 'bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 border-yellow-400/50' 
                    : 'bg-white/10 border-white/20'
                }`}>
                  <div className="text-center">
                    <div className={`text-3xl mb-2 ${achievement.unlocked ? '' : 'grayscale opacity-50'}`}>
                      {achievement.icon}
                    </div>
                    <h4 className={`font-bold ${achievement.unlocked ? 'text-white' : 'text-white/50'}`}>
                      {achievement.name}
                    </h4>
                    <p className={`text-sm ${achievement.unlocked ? 'text-white/70' : 'text-white/40'}`}>
                      {achievement.description}
                    </p>
                    {achievement.unlocked && (
                      <div className="mt-2">
                        <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                          ✓ Desbloqueado
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        )}

        {/* Nova Aba: Estatísticas Avançadas */}
        {activeTab === 'stats' && (
          <AdvancedStats user={user} />
        )}

        {/* Nova Aba: Gamificação */}
        {activeTab === 'gamification' && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6">Sistema de Gamificação</h3>
            
            {/* Informações do Usuário */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 text-center">
                <div className="text-3xl font-bold text-purple-400">{userStats.level}</div>
                <div className="text-white/70 text-sm">Nível Atual</div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 text-center">
                <div className="text-3xl font-bold text-blue-400">{userStats.totalXP.toLocaleString()}</div>
                <div className="text-white/70 text-sm">XP Total</div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 text-center">
                <div className="text-3xl font-bold text-green-400">{userStats.rank}</div>
                <div className="text-white/70 text-sm">Ranking</div>
              </div>
            </div>

            {/* Barra de Progresso XP */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white/80 text-sm">Progresso para o próximo nível</span>
                <span className="text-white/60 text-sm">{userStats.xp}/{userStats.xpToNextLevel} XP</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${(userStats.xp / userStats.xpToNextLevel) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Badges */}
            <div className="mb-6">
              <h4 className="text-white/80 font-medium mb-3">Badges Conquistados</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {badges.slice(0, 8).map((badge, index) => (
                  <div key={index} className="bg-white/10 backdrop-blur-lg rounded-lg p-3 border border-white/20 text-center">
                    <div className="text-2xl mb-1">{badge.icon}</div>
                    <div className="text-white/80 text-xs font-medium">{badge.name}</div>
                    <div className="text-white/50 text-xs">{badge.description}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Estatísticas de Gamificação */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 text-center">
                <div className="text-2xl font-bold text-yellow-400">{userStats.streak}</div>
                <div className="text-white/70 text-sm">Sequência</div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 text-center">
                <div className="text-2xl font-bold text-orange-400">{userStats.weeklyXP}</div>
                <div className="text-white/70 text-sm">XP Semanal</div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 text-center">
                <div className="text-2xl font-bold text-red-400">{userStats.monthlyXP}</div>
                <div className="text-white/70 text-sm">XP Mensal</div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 text-center">
                <div className="text-2xl font-bold text-cyan-400">{badges.length}</div>
                <div className="text-white/70 text-sm">Badges</div>
              </div>
            </div>
          </div>
        )}

        {/* Nova Aba: Notificações */}
        {activeTab === 'notifications' && (
          <NotificationCenter />
        )}
          </>
        ) : null}
      </div>
      </div>
    </div>
    </InternalPageLayout>
  )
}

export default Profile