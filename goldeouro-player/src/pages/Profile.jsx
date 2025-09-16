import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Logo from '../components/Logo'
import Navigation from '../components/Navigation'
import ImageUpload from '../components/ImageUpload'
import { useSidebar } from '../contexts/SidebarContext'

const Profile = () => {
  const { isCollapsed } = useSidebar()
  const { user: authUser, updateProfile } = useAuth()
  const [user, setUser] = useState({
    name: 'João Silva',
    email: 'joao.silva@email.com',
    balance: 150.00,
    totalBets: 25,
    totalWins: 18,
    winRate: 72,
    joinDate: '2024-01-01',
    level: 'Ouro',
    avatar: '👤'
  })
  const [activeTab, setActiveTab] = useState('info')
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: user.name,
    email: user.email
  })
  const [profileImage, setProfileImage] = useState(null)
  const navigate = useNavigate()

  const bettingHistory = [
    { id: 1, amount: 10.00, result: 'Ganhou', date: '2024-01-15', prize: 15.00, game: 'Gol de Ouro' },
    { id: 2, amount: 5.00, result: 'Perdeu', date: '2024-01-14', prize: 0.00, game: 'Gol de Ouro' },
    { id: 3, amount: 20.00, result: 'Ganhou', date: '2024-01-13', prize: 30.00, game: 'Gol de Ouro' },
    { id: 4, amount: 15.00, result: 'Ganhou', date: '2024-01-12', prize: 22.50, game: 'Gol de Ouro' },
    { id: 5, amount: 8.00, result: 'Perdeu', date: '2024-01-11', prize: 0.00, game: 'Gol de Ouro' },
  ]

  const withdrawalHistory = [
    { id: 1, amount: 50.00, date: '2024-01-10', status: 'Processado', method: 'PIX' },
    { id: 2, amount: 25.00, date: '2024-01-05', status: 'Pendente', method: 'PIX' },
    { id: 3, amount: 30.00, date: '2024-01-01', status: 'Processado', method: 'PIX' },
  ]

  const achievements = [
    { id: 1, name: 'Primeiro Gol', description: 'Marque seu primeiro gol', icon: '⚽', unlocked: true },
    { id: 2, name: 'Goleiro Vencido', description: 'Marque 10 gols', icon: '🥅', unlocked: true },
    { id: 3, name: 'Artilheiro', description: 'Marque 50 gols', icon: '👑', unlocked: false },
    { id: 4, name: 'Lenda', description: 'Marque 100 gols', icon: '🏆', unlocked: false },
  ]

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSave = () => {
    // Aqui você salvaria as alterações no backend
    setIsEditing(false)
    // Atualizar o estado do usuário com os novos dados
  }

  const handleCancel = () => {
    setEditForm({
      name: user.name,
      email: user.email
    })
    setIsEditing(false)
  }

  const handleImageSelect = (file) => {
    setProfileImage(file)
    // Aqui você pode implementar o upload para o servidor
    console.log('Imagem selecionada:', file)
  }

  const getLevelColor = (level) => {
    switch(level) {
      case 'Bronze': return 'text-orange-400'
      case 'Prata': return 'text-gray-300'
      case 'Ouro': return 'text-yellow-400'
      case 'Diamante': return 'text-blue-400'
      default: return 'text-yellow-400'
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Menu de Navegação */}
      <Navigation />
      
      {/* Conteúdo Principal */}
      <div 
        className={`flex-1 relative overflow-hidden p-4 transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-72'}`}
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
              <ImageUpload
                onImageSelect={handleImageSelect}
                currentImage={profileImage ? URL.createObjectURL(profileImage) : null}
                className="w-20 h-20"
              />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            </div>
          </div>

          {/* Estatísticas Principais */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
              <p className="text-2xl font-bold text-yellow-400">R$ {user.balance.toFixed(2)}</p>
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
                ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-900 shadow-lg border-yellow-400/50'
                : 'bg-white/10 text-white hover:bg-white/20 border-white/20'
            }`}
          >
            📋 Informações
          </button>
          <button
            onClick={() => setActiveTab('bets')}
            className={`flex-1 py-3 px-4 rounded-lg font-bold transition-all duration-200 backdrop-blur-lg border ${
              activeTab === 'bets'
                ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-900 shadow-lg border-yellow-400/50'
                : 'bg-white/10 text-white hover:bg-white/20 border-white/20'
            }`}
          >
            ⚽ Apostas
          </button>
          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`flex-1 py-3 px-4 rounded-lg font-bold transition-all duration-200 backdrop-blur-lg border ${
              activeTab === 'withdrawals'
                ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-900 shadow-lg border-yellow-400/50'
                : 'bg-white/10 text-white hover:bg-white/20 border-white/20'
            }`}
          >
            💰 Saques
          </button>
          <button
            onClick={() => setActiveTab('achievements')}
            className={`flex-1 py-3 px-4 rounded-lg font-bold transition-all duration-200 backdrop-blur-lg border ${
              activeTab === 'achievements'
                ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-900 shadow-lg border-yellow-400/50'
                : 'bg-white/10 text-white hover:bg-white/20 border-white/20'
            }`}
          >
            🏆 Conquistas
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
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 backdrop-blur-lg border border-blue-400/50"
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
                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 backdrop-blur-lg border border-green-400/50"
                  >
                    💾 Salvar
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 backdrop-blur-lg border border-gray-400/50"
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
            <div className="grid grid-cols-2 gap-4">
              {achievements.map((achievement) => (
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
          </div>
        )}
      </div>
      </div>
    </div>
  )
}

export default Profile