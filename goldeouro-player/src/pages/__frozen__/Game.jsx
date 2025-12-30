import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import Logo from '../components/Logo'
import Navigation from '../components/Navigation'
import { useSidebar } from '../contexts/SidebarContext'
import GameField from '../components/GameField'
import BettingControls from '../components/BettingControls'
import SoundControls from '../components/SoundControls'
import AudioTest from '../components/AudioTest'
import useSimpleSound from '../hooks/useSimpleSound'
import useGamification from '../hooks/useGamification'
import usePlayerAnalytics from '../hooks/usePlayerAnalytics'
import RecommendationsPanel from '../components/RecommendationsPanel'
import gameService from '../services/gameService'

const Game = () => {
  // ✅ LOG OBRIGATÓRIO EM PRODUÇÃO - TELA OFICIAL ATIVA
  console.log('🎮 GAME PRINCIPAL ATIVO — TELA OFICIAL (Game.jsx + GameField.jsx)')
  console.log('✅ Componente Game renderizado corretamente')
  
  const { isCollapsed } = useSidebar()
  const [playerShots, setPlayerShots] = useState(0)
  const [totalShots, setTotalShots] = useState(0)
  const [gameStatus, setGameStatus] = useState('waiting')
  const [gameResults, setGameResults] = useState([])
  const [currentShot, setCurrentShot] = useState(0)
  const [selectedZone, setSelectedZone] = useState(null)
  const [gameResult, setGameResult] = useState(null)
  const [balance, setBalance] = useState(0)
  const [betAmount] = useState(1.00)
  const [isShooting, setIsShooting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [gameStats, setGameStats] = useState({
    totalGoals: 0,
    totalBets: 0,
    currentWinStreak: 0,
    dailyWinnings: 0,
    totalReferrals: 0,
    nightGames: 0,
    goalsPerZone: []
  })
  const navigate = useNavigate()
  
  const { 
    playButtonClick, 
    playCelebrationSound, 
    playCrowdSound,
    playBackgroundMusic 
  } = useSimpleSound()

  const {
    addExperience,
    updateUserStats,
    getUserStats
  } = useGamification()

  const {
    updatePlayerData,
    getCurrentRecommendations
  } = usePlayerAnalytics()

  const goalZones = useMemo(() => [
    { id: 1, name: 'Canto Superior Esquerdo', x: 15, y: 15, multiplier: 2.0, difficulty: 'hard' },
    { id: 2, name: 'Canto Superior Direito', x: 85, y: 15, multiplier: 2.0, difficulty: 'hard' },
    { id: 3, name: 'Centro Superior', x: 50, y: 20, multiplier: 1.5, difficulty: 'medium' },
    { id: 4, name: 'Canto Inferior Esquerdo', x: 15, y: 70, multiplier: 1.8, difficulty: 'medium' },
    { id: 5, name: 'Canto Inferior Direito', x: 85, y: 70, multiplier: 1.8, difficulty: 'medium' },
  ], [])

  // Mapeamento zoneId → direction (backend)
  const zoneIdToDirection = useMemo(() => ({
    1: 'TL',  // Canto Superior Esquerdo
    2: 'TR',  // Canto Superior Direito
    3: 'C',   // Centro Superior
    4: 'BL',  // Canto Inferior Esquerdo
    5: 'BR',  // Canto Inferior Direito
    6: 'C'    // Centro Inferior → mapeia para C (não existe no backend)
  }), [])

  // Inicializar jogo - carregar saldo real do backend
  useEffect(() => {
    const initializeGame = async () => {
      try {
        setLoading(true)
        setError('')
        
        const result = await gameService.initialize()
        
        if (result.success) {
          setBalance(result.userData.saldo)
          console.log('✅ [GAME] Jogo inicializado com sucesso')
          console.log(`💰 [GAME] Saldo: R$ ${result.userData.saldo}`)
        } else {
          const errorMsg = result.error || 'Erro ao carregar dados do jogo'
          setError(errorMsg)
          toast.error(errorMsg)
          console.error('❌ [GAME] Erro ao inicializar:', errorMsg)
        }
      } catch (error) {
        const errorMsg = error.message || 'Erro ao carregar dados do jogo'
        setError(errorMsg)
        toast.error(errorMsg)
        console.error('❌ [GAME] Erro ao inicializar:', error)
      } finally {
        setLoading(false)
      }
    }
    
    initializeGame()
  }, [])

  // Toca música de fundo no início do jogo
  useEffect(() => {
    if (totalShots > 0 && gameStatus === 'waiting') {
      // Toca música de fundo suave quando o jogo começa
      setTimeout(() => playBackgroundMusic(), 1000)
    }
  }, [totalShots, gameStatus, playBackgroundMusic])

  const handleShoot = useCallback(async (zoneId) => {
    if (isShooting) return
    
    // Validar saldo antes de processar
    if (balance < betAmount) {
      toast.error(`Saldo insuficiente. Você tem R$ ${balance.toFixed(2)} e precisa de R$ ${betAmount.toFixed(2)}.`)
      return
    }

    // Mapear zoneId para direction do backend
    let direction = zoneIdToDirection[zoneId]
    if (!direction) {
      console.warn(`⚠️ [GAME] Zona ${zoneId} não mapeada. Usando 'C' como fallback.`)
      // Zona 6 não existe no backend, mapear para 'C'
      if (zoneId === 6) {
        direction = 'C'
      } else {
        toast.error('Zona inválida')
        return
      }
    }
    
    setSelectedZone(zoneId)
    setGameStatus('playing')
    setIsShooting(true)
    setError('')

    // Atualizar estatísticas de apostas
    setGameStats(prev => ({
      ...prev,
      totalBets: prev.totalBets + 1
    }))

    try {
      // Processar chute no backend real
      const result = await gameService.processShot(direction, betAmount)
      
      if (result.success) {
        const zone = goalZones.find(z => z.id === zoneId)
        const isGoal = result.shot.isWinner
        const totalWin = result.shot.prize + (result.shot.goldenGoalPrize || 0)
        
        const gameResult = {
          zone: zoneId,
          isGoal,
          amount: betAmount,
          multiplier: zone.multiplier,
          totalWin
        }

        // Atualizar estados com valores do backend
        setGameResult(gameResult)
        setGameResults(prev => [...prev, gameResult])
        setCurrentShot(prev => prev + 1)
        setGameStatus('result')
        setIsShooting(false)
        
        // Saldo vem do backend (sempre sincronizado)
        setBalance(result.user.newBalance)
        
        // Atualizar totalShots com progresso do lote (se disponível)
        if (result.lote?.progress?.total) {
          setTotalShots(result.lote.progress.total)
        }

        // Lógica visual mantida (sem alteração)
        if (isGoal) {
          createConfetti()
          playCelebrationSound()
          
          // Verificar se é Gol de Ouro
          if (result.isGoldenGoal) {
            toast.success(`🏆 GOL DE OURO! Você ganhou R$ ${totalWin.toFixed(2)}!`)
          } else {
            toast.success(`⚽ GOL! Você ganhou R$ ${totalWin.toFixed(2)}!`)
          }
          
          // Atualizar estatísticas de gol
          setGameStats(prev => {
            const newStats = {
              ...prev,
              totalGoals: prev.totalGoals + 1,
              currentWinStreak: prev.currentWinStreak + 1,
              dailyWinnings: prev.dailyWinnings + totalWin,
              goalsPerZone: [...prev.goalsPerZone, zoneId]
            }
            
            // Adicionar experiência por gol
            addExperience(10, 'Gol marcado!')
            
            // Verificar conquistas
            updateUserStats(newStats)
            
            return newStats
          })
        } else {
          // Resetar sequência de vitórias
          setGameStats(prev => ({
            ...prev,
            currentWinStreak: 0
          }))
          toast.info('🥅 Defesa! Tente novamente.')
        }

        // Atualizar analytics do jogador
        updatePlayerData({
          zone: zoneId,
          isGoal,
          amount: betAmount,
          multiplier: zone.multiplier,
          totalWin: gameResult.totalWin
        })

        // Resetar estado após mostrar resultado
        setTimeout(() => {
          setGameStatus('waiting')
          setGameResult(null)
        }, 2000)
      } else {
        // Erro do backend
        throw new Error(result.error || 'Erro ao processar chute')
      }
    } catch (error) {
      console.error('❌ [GAME] Erro ao processar chute:', error)
      setError(error.message)
      setIsShooting(false)
      setGameStatus('waiting')
      
      // Mostrar mensagem de erro
      toast.error(error.message || 'Erro ao processar chute. Tente novamente.')
    }
  }, [isShooting, balance, betAmount, goalZones, zoneIdToDirection, playCelebrationSound, addExperience, updateUserStats, updatePlayerData])

  const createConfetti = () => {
    const colors = ['#fbbf24', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444']
    for (let i = 0; i < 50; i++) {
      setTimeout(() => {
        const confetti = document.createElement('div')
        confetti.className = 'fixed w-2 h-2 confetti pointer-events-none z-50'
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)]
        confetti.style.left = Math.random() * 100 + 'vw'
        confetti.style.top = '100vh'
        document.body.appendChild(confetti)

        setTimeout(() => {
          confetti.remove()
        }, 3000)
      }, i * 10)
    }
  }

  const resetGame = useCallback(() => {
    playButtonClick()
    setSelectedZone(null)
    setGameStatus('waiting')
    setGameResult(null)
    setCurrentShot(0)
    setGameResults([])
    setPlayerShots(0)
    setTotalShots(0)
    setIsShooting(false)
  }, [playButtonClick])

  const addShots = useCallback((shots) => {
    if (totalShots + shots <= 10) {
      playButtonClick()
      setPlayerShots(prev => prev + shots)
      setTotalShots(prev => prev + shots)
    }
  }, [totalShots, playButtonClick])

  const removeShots = useCallback((shots) => {
    if (playerShots - shots >= 0) {
      playButtonClick()
      setPlayerShots(prev => prev - shots)
      setTotalShots(prev => prev - shots)
    }
  }, [playerShots, playButtonClick])

  const totalWinnings = useMemo(() => 
    gameResults.reduce((sum, result) => sum + result.totalWin, 0), 
    [gameResults]
  )
  const totalInvestment = useMemo(() => 
    gameResults.reduce((sum, result) => sum + result.amount, 0), 
    [gameResults]
  )

  return (
    <div className="min-h-screen flex">
      {/* Menu de Navegação */}
      <Navigation />
      
      {/* Conteúdo Principal */}
      <div className={`flex-1 bg-slate-900 p-4 transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-72'}`}>
        {/* Controles de Som */}
        <SoundControls />
        
        {/* Teste de Áudio */}
        <AudioTest />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-white/70 hover:text-white text-2xl transition-colors"
        >
          ←
        </button>
        <div className="flex items-center space-x-3">
          <Logo size="medium" style={{ width: '150px', height: '150px' }} />
          <h1 className="text-2xl font-bold text-white">Gol de Ouro</h1>
        </div>
        <div className="w-8"></div>
      </div>

      {/* Status da Partida */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 mb-6 shadow-2xl">
        <div className="text-center mb-4">
          <h2 className="text-3xl font-bold text-white mb-2">CHUTAR</h2>
          <p className="text-white/90 text-lg">Escolha um local para chutar</p>
        </div>

        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-4">
            <span className="text-white font-medium">Aposta:</span>
            <div className="flex items-center space-x-2">
              <button className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white font-bold transition-colors">
                -
              </button>
              <div className="bg-white/20 px-4 py-2 rounded-lg">
                <span className="text-white font-bold">R$ {betAmount.toFixed(2)}</span>
              </div>
              <button className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white font-bold transition-colors">
                +
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-white font-medium">Saldo:</span>
            <div className="bg-white/20 px-4 py-2 rounded-lg">
              <span className="text-white font-bold">R$ {balance.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <p className="text-white/70 text-sm">Seus Chutes</p>
            <p className="text-2xl font-bold text-yellow-400">{playerShots}</p>
          </div>
          <div className="text-center">
            <p className="text-white/70 text-sm">Total Partida</p>
            <p className="text-2xl font-bold text-green-400">{totalShots}/10</p>
          </div>
          <div className="text-center">
            <p className="text-white/70 text-sm">Investimento</p>
            <p className="text-2xl font-bold text-green-400">R$ {totalInvestment.toFixed(2)}</p>
          </div>
        </div>

        {/* Barra de Progresso */}
        <div className="w-full bg-white/20 rounded-full h-3 mb-4">
          <div
            className="bg-gradient-to-r from-yellow-400 to-green-400 h-3 rounded-full transition-all duration-500"
            style={{ width: `${(totalShots / 10) * 100}%` }}
          ></div>
        </div>

        <div className="text-center">
          <p className="text-white font-bold">
            {totalShots >= 10 ? 'Partida Completa!' : `${10 - totalShots} chutes restantes`}
          </p>
        </div>
      </div>

      {/* Controles de Chutes */}
      <BettingControls
        playerShots={playerShots}
        totalShots={totalShots}
        onAddShots={addShots}
        onRemoveShots={removeShots}
        balance={balance}
        betAmount={betAmount}
      />

      {/* Campo de Jogo */}
      <div className="mb-6">
        <GameField
          onShoot={handleShoot}
          gameStatus={gameStatus}
          selectedZone={selectedZone}
          currentShot={currentShot}
          totalShots={playerShots}
        />
      </div>

      {/* Painel de Recomendações da IA */}
      <div className="mb-6">
        <RecommendationsPanel />
      </div>

      {/* Status do Jogo */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6">
        {gameStatus === 'waiting' && (
          <div className="text-center">
            {currentShot < playerShots ? (
              <>
                <p className="text-white font-bold">Chute {currentShot + 1} de {playerShots}</p>
                <p className="text-white/70 text-sm mt-1">Escolha uma zona para chutar!</p>
              </>
            ) : (
              <p className="text-white font-bold">Adicione chutes para começar a jogar!</p>
            )}
          </div>
        )}
        {gameStatus === 'playing' && (
          <div className="text-center bounce-in">
            <p className="text-yellow-400 font-bold animate-pulse">Chutando...</p>
            <div className="mt-2 flex justify-center space-x-1">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.2}s` }}></div>
              ))}
            </div>
          </div>
        )}
        {gameStatus === 'result' && gameResult && (
          <div className={`text-center ${gameResult.isGoal ? 'goal-celebration' : 'bounce-in'}`}>
            {gameResult.isGoal ? (
              <p className="text-4xl font-bold text-green-400 text-shadow-lg">⚽ GOL!</p>
            ) : (
              <p className="text-4xl font-bold text-red-400">❌ Errou!</p>
            )}
            {gameResult.isGoal && (
              <p className="text-green-400 font-medium mt-2">Ganhou R$ {gameResult.totalWin.toFixed(2)}!</p>
            )}
            {!gameResult.isGoal && (
              <p className="text-red-400 text-sm mt-2">Perdeu R$ {gameResult.amount.toFixed(2)}</p>
            )}
          </div>
        )}
      </div>

      {/* Resultados */}
      {gameResults.length > 0 && (
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6">
          <h3 className="text-xl font-bold text-white mb-4">Seus Resultados</h3>
          <div className="space-y-3 mb-4">
            {gameResults.map((result, index) => (
              <div key={index} className="flex justify-between items-center bg-white/5 p-3 rounded-lg">
                <p className="text-white/70">Chute {index + 1} (Zona {result.zone})</p>
                <p className={`font-bold ${result.isGoal ? 'text-green-400' : 'text-red-400'}`}>
                  {result.isGoal ? `+ R$ ${result.totalWin.toFixed(2)}` : `- R$ ${result.amount.toFixed(2)}`}
                </p>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center border-t border-white/20 pt-4">
            <p className="text-white font-bold">Ganhos Totais</p>
            <p className="text-2xl font-bold text-yellow-400">R$ {totalWinnings.toFixed(2)}</p>
          </div>
        </div>
      )}

      {/* Botões de Ação */}
      {(currentShot >= playerShots || totalShots >= 10) && (
        <div className="flex space-x-4 mt-6">
          <button
            onClick={resetGame}
            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200"
          >
            Nova Partida
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200"
          >
            Voltar ao Dashboard
          </button>
        </div>
      )}

      {/* Botão Menu no canto inferior esquerdo */}
      <button
        onClick={() => navigate('/dashboard')}
        className="fixed bottom-6 left-6 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-bold py-3 px-6 rounded-full shadow-lg transition-all duration-200 z-50 flex items-center space-x-2"
      >
        <span className="text-xl">🏠</span>
        <span>Menu</span>
      </button>
      </div>
    </div>
  )
}

// ✅ BLINDAGEM: Garantir que este é o componente Game oficial
if (process.env.NODE_ENV === 'production') {
  console.log('🛡️ [BLINDAGEM] Componente Game exportado corretamente')
  console.log('🛡️ [BLINDAGEM] Nome do componente:', Game.name || 'Game')
}

export default Game