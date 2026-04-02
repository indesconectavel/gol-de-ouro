import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import Navigation from '../components/Navigation'
import VersionBanner from '../components/VersionBanner'
import { useSidebar } from '../contexts/SidebarContext'
import apiClient from '../services/apiClient'
import { API_ENDPOINTS } from '../config/api'
import { retryDataRequest } from '../utils/retryLogic'
import { quickDashboardTest } from '../utils/dashboardTest'

/** Mapeia linha da API de chutes para exibição em “Apostas Recentes” */
function mapChuteToRecentBet(row) {
  if (!row || !row.id) return null
  const created = row.created_at ? new Date(row.created_at) : null
  const dataStr =
    created && !Number.isNaN(created.getTime())
      ? created.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
      : '—'
  const isGoal = row.resultado === 'goal'
  const valor = Number(row.valor_aposta) || 0
  const premioTotal = (Number(row.premio) || 0) + (Number(row.premio_gol_de_ouro) || 0)
  return {
    id: row.id,
    valor,
    data: dataStr,
    status: isGoal ? 'Gol' : 'Defesa',
    statusKey: isGoal ? 'goal' : 'miss',
    tipo: `Chute · ${row.direcao || '?'}`,
    premioGanho: premioTotal
  }
}

const Dashboard = () => {
  const { isCollapsed } = useSidebar()
  const [balance, setBalance] = useState(0.00)
  const [user, setUser] = useState(null)
  const [recentBets, setRecentBets] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    // Executar teste rápido e carregar dados
    const initializeDashboard = async () => {
      // Teste rápido em desenvolvimento
      if (import.meta.env.DEV) {
        const testResult = await quickDashboardTest()
        console.log('🧪 [DASHBOARD] Teste rápido:', testResult);
      }
      
      // Carregar dados do usuário
      await loadUserData()
    }
    
    initializeDashboard()
  }, [])

  const loadUserData = async () => {
    try {
      setLoading(true)
      
      // Buscar perfil do usuário - COM RETRY LOGIC
      const profileResponse = await retryDataRequest(() => 
        apiClient.get(API_ENDPOINTS.PROFILE)
      )
      if (profileResponse.data.success) {
        setUser(profileResponse.data.data)
        setBalance(profileResponse.data.data.saldo || 0)
      }

      // Apostas Recentes = chutes do jogador (não PIX)
      try {
        const chutesRes = await retryDataRequest(() =>
          apiClient.get(API_ENDPOINTS.GAMES_CHUTES_RECENTES, { params: { limit: 20 } })
        )
        if (chutesRes.data.success && chutesRes.data.data?.items) {
          const mapped = chutesRes.data.data.items
            .map(mapChuteToRecentBet)
            .filter(Boolean)
          setRecentBets(mapped)
        } else {
          setRecentBets([])
        }
      } catch (chutesErr) {
        console.warn('⚠️ [DASHBOARD] Erro ao carregar chutes recentes:', chutesErr.message)
        setRecentBets([])
      }

    } catch (error) {
      console.error('❌ [DASHBOARD] Erro ao carregar dados do usuário após retry:', error)
      // Fallback para dados mínimos em caso de erro
      setUser({
        id: 3,
        email: 'free10signer@gmail.com',
        nome: 'free10signer',
        saldo: 0
      })
      setBalance(0)
      setRecentBets([])
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('authToken')
      
      if (token) {
        // Chamar endpoint de logout no backend
        await apiClient.post('/auth/logout', { token })
      }
      
      // Limpar dados locais
      localStorage.removeItem('authToken')
      localStorage.removeItem('user')
      
      // Redirecionar para login
      navigate('/')
      
    } catch (error) {
      console.error('Erro no logout:', error)
      // Mesmo com erro, fazer logout local
      localStorage.removeItem('authToken')
      localStorage.removeItem('user')
      navigate('/')
    }
  }


  return (
    <div className="min-h-screen flex">
      {/* Banner de Versão */}
      <VersionBanner showTime={true} />
      
      {/* Menu de Navegação */}
      <Navigation />
      
      {/* Conteúdo Principal */}
      <div 
        className={`flex-1 relative overflow-hidden transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-72'}`}
      >
        
        <div
          className="min-h-screen"
          style={{
            backgroundImage: 'url(/images/Gol_de_Ouro_Bg02.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed'
          }}
        >
          {/* Overlay escuro para melhorar legibilidade */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
          
          {/* Header */}
          <div className="bg-white/10 backdrop-blur-lg p-4 relative overflow-hidden border-b border-white/20">
            {/* Efeito de partículas */}
            <div className="absolute inset-0 opacity-20">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-pulse"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`
                  }}
                />
              ))}
            </div>
            
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center space-x-3">
                <Logo size="medium" className="w-24 h-24" />
                <div className="slide-in-up">
                  <h1 className="text-xl font-bold text-white">Gol de Ouro</h1>
                  <p className="text-white/70 text-sm">
                    Bem-vindo, {user?.nome || user?.email?.split('@')[0] || 'Jogador'}!
                  </p>
                </div>
              </div>
                       <button
                         onClick={handleLogout}
                         className="text-white/70 hover:text-white transition-all duration-200 hover:scale-110 p-2 rounded-full hover:bg-white/10"
                         title="Sair"
                       >
                         👤
                       </button>
            </div>
          </div>

          <div className="relative z-10 p-4 space-y-6">
            {/* Saldo */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-center relative overflow-hidden border border-white/20 shadow-2xl">
              <div className="relative z-10">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <span className="text-2xl">💰</span>
                  <h2 className="text-white/80 text-lg font-medium">Saldo Disponível</h2>
                </div>
                <p className="text-4xl font-bold text-yellow-400 mb-2">R$ {balance.toFixed(2)}</p>
                {/* Dados reais serão implementados quando houver histórico */}
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => navigate('/game')}
                className="bg-white/10 backdrop-blur-lg rounded-xl py-4 px-6 transition-all duration-200 transform hover:scale-105 hover:bg-white/20 group border border-white/20 shadow-lg"
              >
                <div className="text-2xl mb-2 group-hover:animate-bounce">⚽</div>
                <div className="text-white font-bold">Jogar</div>
                <div className="text-xs text-white/70 mt-1">Penalty Shootout</div>
              </button>
              
              <button
                onClick={() => navigate('/pagamentos')}
                className="bg-white/10 backdrop-blur-lg rounded-xl py-4 px-6 transition-all duration-200 transform hover:scale-105 hover:bg-white/20 group border border-white/20 shadow-lg"
              >
                <div className="text-2xl mb-2 group-hover:animate-bounce">💰</div>
                <div className="text-white font-bold">Depositar</div>
                <div className="text-xs text-white/70 mt-1">PIX Instantâneo</div>
              </button>
              
              <button
                onClick={() => navigate('/withdraw')}
                className="bg-white/10 backdrop-blur-lg rounded-xl py-4 px-6 transition-all duration-200 transform hover:scale-105 hover:bg-white/20 group border border-white/20 shadow-lg"
              >
                <div className="text-2xl mb-2 group-hover:animate-bounce">💸</div>
                <div className="text-white font-bold">Sacar</div>
                <div className="text-xs text-white/70 mt-1">PIX 24h</div>
              </button>
              
              <button
                onClick={() => navigate('/profile')}
                className="bg-white/10 backdrop-blur-lg rounded-xl py-4 px-6 transition-all duration-200 transform hover:scale-105 hover:bg-white/20 group border border-white/20 shadow-lg"
              >
                <div className="text-2xl mb-2 group-hover:animate-bounce">👤</div>
                <div className="text-white font-bold">Perfil</div>
                <div className="text-xs text-white/70 mt-1">Estatísticas</div>
              </button>
            </div>

            {/* Apostas Recentes */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Apostas Recentes</h3>
                <button 
                  onClick={() => alert('Histórico completo será implementado em breve!')}
                  className="text-yellow-400 text-sm hover:text-yellow-300 transition-colors"
                >
                  Ver todas →
                </button>
              </div>
              <div className="space-y-3">
                {loading ? (
                  <div className="text-center text-white/70">Carregando...</div>
                ) : recentBets.length > 0 ? (
                  recentBets.map((bet, index) => (
                    <div 
                      key={bet.id} 
                      className="flex items-center justify-between bg-white/10 backdrop-blur-lg rounded-lg p-3 hover:bg-white/20 transition-all duration-200 border border-white/20"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${bet.statusKey === 'goal' ? 'bg-green-400' : 'bg-amber-400'}`}></div>
                        <div>
                          <p className="text-white font-medium">R$ {bet.valor.toFixed(2)}</p>
                          <p className="text-white/70 text-sm">{bet.data}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold flex items-center space-x-1 ${bet.statusKey === 'goal' ? 'text-green-400' : 'text-amber-300'}`}>
                          <span>{bet.statusKey === 'goal' ? '⚽' : '🥅'}</span>
                          <span>{bet.status}</span>
                        </p>
                        <p className="text-white/70 text-sm">{bet.tipo}</p>
                        {bet.premioGanho > 0 && (
                          <p className="text-green-400 text-xs mt-0.5">+R$ {bet.premioGanho.toFixed(2)}</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-white/70">Nenhuma jogada ainda</div>
                )}
              </div>
              
              {/* Estatísticas serão implementadas com dados reais */}
              <div className="mt-4 pt-4 border-t border-white/20">
                <div className="text-center text-white/70">
                  <p className="text-sm">Estatísticas serão exibidas quando houver jogos realizados</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard