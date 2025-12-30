import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useSidebar } from '../contexts/SidebarContext'
import GameField from '../components/GameField'
import useSimpleSound from '../hooks/useSimpleSound'
import gameService from '../services/gameService'
import './game-shoot.css'

const GameOriginalRestored = () => {
  const navigate = useNavigate()
  const { isCollapsed } = useSidebar()
  const [balance, setBalance] = useState(0)
  const [currentBet, setCurrentBet] = useState(1)
  const [shotsTaken, setShotsTaken] = useState(0)
  const [totalShots] = useState(10)
  const [victories, setVictories] = useState(0)
  const [gameStatus, setGameStatus] = useState('waiting')
  const [selectedZone, setSelectedZone] = useState(null)
  const [isShooting, setIsShooting] = useState(false)
  const [loading, setLoading] = useState(true)

  const { playGoalSound, playDefenseSound, playKickSound } = useSimpleSound()

  const betValues = [1, 2, 5, 10]

  // Inicializar jogo
  useEffect(() => {
    const initializeGame = async () => {
      try {
        setLoading(true)
        const result = await gameService.initialize()
        if (result.success) {
          setBalance(result.userData.saldo)
        } else {
          toast.error(result.error || 'Erro ao carregar dados do jogo')
        }
      } catch (error) {
        toast.error('Erro ao carregar dados do jogo')
      } finally {
        setLoading(false)
      }
    }
    initializeGame()
  }, [])

  const handleShoot = useCallback(async (zoneId) => {
    if (isShooting || balance < currentBet) return

    setIsShooting(true)
    setSelectedZone(zoneId)
    setGameStatus('playing')
    playKickSound()

    // Mapear zoneId para direction
    const zoneIdToDirection = {
      1: 'TL', 2: 'TR', 3: 'C', 4: 'BL', 5: 'BR', 6: 'C'
    }
    const direction = zoneIdToDirection[zoneId] || 'C'

    try {
      const result = await gameService.processShot(direction, currentBet)
      
      if (result.success) {
        const isGoal = result.shot.isWinner
        setBalance(result.user.newBalance)
        setShotsTaken(prev => prev + 1)
        
        if (isGoal) {
          setVictories(prev => prev + 1)
          playGoalSound()
          toast.success(`⚽ GOL! Você ganhou R$ ${result.shot.prize.toFixed(2)}!`)
        } else {
          playDefenseSound()
          toast.info('🥅 Defesa! Tente novamente.')
        }

        setGameStatus('result')
        setTimeout(() => {
          setGameStatus('waiting')
          setSelectedZone(null)
          setIsShooting(false)
        }, 2000)
      } else {
        throw new Error(result.error || 'Erro ao processar chute')
      }
    } catch (error) {
      toast.error(error.message || 'Erro ao processar chute')
      setIsShooting(false)
      setGameStatus('waiting')
    }
  }, [isShooting, balance, currentBet, playKickSound, playGoalSound, playDefenseSound])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Carregando jogo...</div>
      </div>
    )
  }

  return (
    <div className="gs-wrapper">
      <div className="gs-stage" style={{ 
        backgroundImage: 'url(/images/game/stadium-background.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
        {/* HUD NO TOPO - EXATAMENTE COMO NA IMAGEM */}
        <div className="gs-hud">
          {/* Esquerda: Logo GOL DE OURO */}
          <div className="hud-left">
            <div className="brand">
              <img 
                src="/images/Gol_de_Ouro_logo.png" 
                alt="Gol de Ouro"
                className="brand-logo"
                style={{ width: '100px', height: '100px', objectFit: 'contain' }}
              />
              <div className="brand-info">
                <span className="brand-name">GOL DE OURO</span>
                <span className="brand-subtitle">Futebol Virtual</span>
              </div>
            </div>
          </div>

          {/* Centro: Estatísticas (Saldo, Chutes, Vitórias) */}
          <div className="hud-center">
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-icon">💰</div>
                <div className="stat-content">
                  <span className="stat-label">SALDO</span>
                  <strong className="stat-value">R$ {balance.toFixed(2)}</strong>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon">⚽</div>
                <div className="stat-content">
                  <span className="stat-label">CHUTES</span>
                  <strong className="stat-value">{shotsTaken}/{totalShots}</strong>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon">🏆</div>
                <div className="stat-content">
                  <span className="stat-label">VITÓRIAS</span>
                  <strong className="stat-value">{victories}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Direita: Botões de Aposta e Dashboard */}
          <div className="hud-right">
            <div className="betting-section">
              <div className="bet-label">Aposta:</div>
              <div className="bet-buttons">
                {betValues.map((value) => (
                  <button
                    key={value}
                    onClick={() => setCurrentBet(value)}
                    disabled={balance < value || isShooting}
                    className={`bet-btn ${currentBet === value ? 'active' : ''} ${balance < value ? 'disabled' : ''}`}
                  >
                    R${value}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="hud-btn primary"
            >
              <span className="btn-icon">📊</span>
              <span className="btn-text">Dashboard</span>
            </button>
          </div>
        </div>

        {/* Campo de Jogo - Usando GameField do backup */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
          <GameField
            onShoot={handleShoot}
            gameStatus={gameStatus}
            selectedZone={selectedZone}
            currentShot={shotsTaken}
            totalShots={totalShots}
          />
        </div>

        {/* Overlay Inferior Direito - Botões de Som, Chat e Novato */}
        <div className="hud-bottom-right">
          <div className="control-panel">
            <div className="control-buttons">
              <button className="control-btn" title="Som">
                <span className="btn-icon">🔊</span>
              </button>
              <button className="control-btn" title="Chat">
                <span className="btn-icon">💬</span>
              </button>
              <button className="control-btn" title="Novato">
                <span className="btn-icon">Y</span>
                <span className="btn-text">NOVATO</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GameOriginalRestored

