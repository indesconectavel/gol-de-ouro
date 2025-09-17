import { useState, useEffect, useCallback } from 'react'
import gameService from '../services/gameService'
import { useAuth } from '../contexts/AuthContext'

const useGame = () => {
  const { user } = useAuth()
  const [gameStatus, setGameStatus] = useState('waiting') // waiting, playing, finished
  const [playerQueue, setPlayerQueue] = useState([])
  const [currentGame, setCurrentGame] = useState(null)
  const [playerStats, setPlayerStats] = useState({
    totalBets: 0,
    totalWins: 0,
    winRate: 0,
    balance: 150.00
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Carregar dados iniciais
  useEffect(() => {
    loadGameData()
  }, [])

  const loadGameData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Carregar estatísticas do jogador
      const statsResult = await gameService.getPlayerStats()
      if (statsResult.success) {
        setPlayerStats(statsResult.stats)
      }

      // Carregar status do jogo atual
      const statusResult = await gameService.getGameStatus()
      if (statusResult.success) {
        setGameStatus(statusResult.status)
        setCurrentGame(statusResult.game)
      }
    } catch (err) {
      console.error('Erro ao carregar dados do jogo:', err)
      setError('Erro ao carregar dados do jogo')
    } finally {
      setIsLoading(false)
    }
  }

  const joinQueue = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const result = await gameService.joinQueue()
      if (result.success) {
        setGameStatus('in_queue')
        setCurrentGame(result.game)
        return true
      } else {
        setError(result.error)
        return false
      }
    } catch (err) {
      console.error('Erro ao entrar na fila:', err)
      setError('Erro ao entrar na fila')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const leaveQueue = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const result = await gameService.leaveQueue()
      if (result.success) {
        setGameStatus('waiting')
        setCurrentGame(null)
        return true
      } else {
        setError(result.error)
        return false
      }
    } catch (err) {
      console.error('Erro ao sair da fila:', err)
      setError('Erro ao sair da fila')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const makeShot = async (zone, betAmount) => {
    try {
      setIsLoading(true)
      setError(null)

      // Validar zona e valor da aposta
      if (!gameService.validateShotZone(zone)) {
        setError('Zona de chute inválida')
        return false
      }

      if (!gameService.validateBetAmount(betAmount)) {
        setError('Valor da aposta inválido')
        return false
      }

      setGameStatus('playing')

      const result = await gameService.makeShot(zone, betAmount)
      if (result.success) {
        setCurrentGame(result.result)
        setGameStatus('finished')
        
        // Atualizar estatísticas
        setPlayerStats(prev => ({
          ...prev,
          totalBets: prev.totalBets + 1,
          totalWins: prev.totalWins + (result.goal ? 1 : 0),
          winRate: prev.totalBets > 0 ? ((prev.totalWins + (result.goal ? 1 : 0)) / (prev.totalBets + 1)) * 100 : 0,
          balance: prev.balance + (result.prize - betAmount)
        }))

        return true
      } else {
        setError(result.error)
        setGameStatus('waiting')
        return false
      }
    } catch (err) {
      console.error('Erro ao fazer chute:', err)
      setError('Erro ao fazer chute')
      setGameStatus('waiting')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const resetGame = () => {
    setGameStatus('waiting')
    setCurrentGame(null)
  }

  return {
    gameStatus,
    playerQueue,
    currentGame,
    playerStats,
    isLoading,
    error,
    joinQueue,
    leaveQueue,
    makeShot,
    resetGame,
    loadGameData
  }
}

export default useGame