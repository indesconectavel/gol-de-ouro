import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Logo from '../components/Logo'
import Navigation from '../components/Navigation'
import { useSidebar } from '../contexts/SidebarContext'

const Dashboard = () => {
  const { isCollapsed } = useSidebar()
  const { user } = useAuth()
  const [balance] = useState(150.00)
  const navigate = useNavigate()

  const recentBets = [
    { id: 1, amount: 10.00, result: 'Ganhou', date: '2024-01-15', prize: 15.00 },
    { id: 2, amount: 5.00, result: 'Perdeu', date: '2024-01-14', prize: 0.00 },
    { id: 3, amount: 20.00, result: 'Ganhou', date: '2024-01-13', prize: 30.00 },
  ]


  return (
    <div className="min-h-screen flex">
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
                  <p className="text-white/70 text-sm">Bem-vindo, Jogador!</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/profile')}
                className="text-white/70 hover:text-white transition-all duration-200 hover:scale-110 p-2 rounded-full hover:bg-white/10"
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
                <div className="mt-2 flex items-center justify-center space-x-2">
                  <span className="text-green-400 text-sm">↗️ +5.2%</span>
                  <span className="text-white/70 text-xs">vs ontem</span>
                </div>
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
                {recentBets.map((bet, index) => (
                  <div 
                    key={bet.id} 
                    className="flex items-center justify-between bg-white/10 backdrop-blur-lg rounded-lg p-3 hover:bg-white/20 transition-all duration-200 border border-white/20"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${bet.result === 'Ganhou' ? 'bg-green-400' : 'bg-red-400'}`}></div>
                      <div>
                        <p className="text-white font-medium">R$ {bet.amount.toFixed(2)}</p>
                        <p className="text-white/70 text-sm">{bet.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold flex items-center space-x-1 ${bet.result === 'Ganhou' ? 'text-green-400' : 'text-red-400'}`}>
                        <span>{bet.result === 'Ganhou' ? '⚽' : '❌'}</span>
                        <span>{bet.result}</span>
                      </p>
                      {bet.prize > 0 && (
                        <p className="text-green-400 text-sm font-medium">+R$ {bet.prize.toFixed(2)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Estatísticas rápidas */}
              <div className="mt-4 pt-4 border-t border-white/20">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-white/10 backdrop-blur-lg rounded-lg p-3 border border-white/20">
                    <p className="text-green-400 font-bold text-lg">2</p>
                    <p className="text-white/70 text-xs">Vitórias</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-lg rounded-lg p-3 border border-white/20">
                    <p className="text-red-400 font-bold text-lg">1</p>
                    <p className="text-white/70 text-xs">Derrotas</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-lg rounded-lg p-3 border border-white/20">
                    <p className="text-yellow-400 font-bold text-lg">66%</p>
                    <p className="text-white/70 text-xs">Taxa de Vitória</p>
                  </div>
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