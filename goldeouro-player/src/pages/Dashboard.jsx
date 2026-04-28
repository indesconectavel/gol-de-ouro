import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import InternalPageLayout from '../components/InternalPageLayout'
import VersionBanner from '../components/VersionBanner'
import { useAuth } from '../contexts/AuthContext'
import apiClient from '../services/apiClient'
import { API_ENDPOINTS } from '../config/api'
import { retryDataRequest } from '../utils/retryLogic'
import { quickDashboardTest } from '../utils/dashboardTest'

const Dashboard = () => {
  const { logout } = useAuth()
  const [balance, setBalance] = useState(null)
  const [user, setUser] = useState(null)
  /** Linhas do histórico PIX (depósitos) — mesmo payload de /api/payments/pix/usuario; não são apostas/chutes. */
  const [recentPixDeposits, setRecentPixDeposits] = useState([])
  const [loading, setLoading] = useState(true)
  const [profileLoadError, setProfileLoadError] = useState(null)
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
      setProfileLoadError(null)

      // Buscar perfil do usuário - COM RETRY LOGIC
      const profileResponse = await retryDataRequest(() => 
        apiClient.get(API_ENDPOINTS.PROFILE)
      )
      if (profileResponse.data.success) {
        setUser(profileResponse.data.data)
        setBalance(profileResponse.data.data.saldo ?? 0)
      } else {
        setUser(null)
        setBalance(null)
        setProfileLoadError('Não foi possível carregar os dados do perfil.')
      }

      // Buscar dados PIX do usuário (inclui histórico) - COM RETRY LOGIC E TRATAMENTO DE ERRO ROBUSTO
      try {
        const pixResponse = await retryDataRequest(() => 
          apiClient.get(API_ENDPOINTS.PIX_USER)
        )
        if (pixResponse.data.success) {
          setRecentPixDeposits(pixResponse.data.data.historico_pagamentos || [])
        }
      } catch (pixError) {
        console.warn('⚠️ [DASHBOARD] Erro ao carregar dados PIX após retry:', pixError.message)
        setRecentPixDeposits([])
      }

    } catch (error) {
      console.error('❌ [DASHBOARD] Erro ao carregar dados do usuário após retry:', error)
      setUser(null)
      setBalance(null)
      setRecentPixDeposits([])
      setProfileLoadError('Não foi possível carregar os dados. Verifique a conexão e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }


  return (
    <InternalPageLayout title="Início">
    <div className="min-h-screen flex flex-col">
      <VersionBanner showTime={true} />
      <div className="flex-1 relative overflow-hidden">
        
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
                {loading ? (
                  <p className="text-4xl font-bold text-yellow-400/80 mb-2">Carregando…</p>
                ) : profileLoadError ? (
                  <div className="space-y-3">
                    <p className="text-white/90 text-sm mb-2">{profileLoadError}</p>
                    <button
                      type="button"
                      onClick={() => loadUserData()}
                      className="text-sm font-semibold text-yellow-400 hover:text-yellow-300 underline"
                    >
                      Tentar novamente
                    </button>
                  </div>
                ) : (
                  <p className="text-4xl font-bold text-yellow-400 mb-2">
                    R$ {(balance ?? 0).toFixed(2)}
                  </p>
                )}
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

            {/* Depósitos PIX recentes (fonte: GET /api/payments/pix/usuario → historico_pagamentos) */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Depósitos Recentes</h3>
                <button 
                  type="button"
                  onClick={() => navigate('/pagamentos')}
                  className="text-yellow-400 text-sm hover:text-yellow-300 transition-colors"
                >
                  Ver todas →
                </button>
              </div>
              <div className="space-y-3">
                {loading ? (
                  <div className="text-center text-white/70">Carregando...</div>
                ) : recentPixDeposits.length > 0 ? (
                  recentPixDeposits.map((row, index) => (
                    <div 
                      key={row.id} 
                      className="flex items-center justify-between bg-white/10 backdrop-blur-lg rounded-lg p-3 hover:bg-white/20 transition-all duration-200 border border-white/20"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${row.status === 'processado' ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                        <div>
                          <p className="text-white font-medium">R$ {row.valor.toFixed(2)}</p>
                          <p className="text-white/70 text-sm">{row.data}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold flex items-center space-x-1 ${row.status === 'processado' ? 'text-green-400' : 'text-yellow-400'}`}>
                          <span>{row.status === 'processado' ? '✅' : '⏳'}</span>
                          <span>{row.status}</span>
                        </p>
                        <p className="text-white/70 text-sm">{row.tipo}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-white/70">Nenhum depósito PIX recente</div>
                )}
              </div>
              
              <div className="mt-4 pt-4 border-t border-white/20">
                <div className="text-center text-white/70">
                  <p className="text-sm">Histórico de partidas aparece ao jogar; aqui apenas depósitos via PIX.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </InternalPageLayout>
  )
}

export default Dashboard