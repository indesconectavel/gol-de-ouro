import { useState, useEffect } from 'react'

const useGame = () => {
  const [gameStatus, setGameStatus] = useState('waiting') // waiting, playing, finished
  const [playerQueue, setPlayerQueue] = useState([])
  const [currentGame, setCurrentGame] = useState(null)
  const [playerStats, setPlayerStats] = useState({
    totalBets: 0,
    totalWins: 0,
    winRate: 0,
    balance: 150.00
  })

  // Simular dados de fila
  useEffect(() => {
    const mockQueue = [
      { id: 1, name: 'João Silva', position: 1 },
      { id: 2, name: 'Maria Santos', position: 2 },
      { id: 3, name: 'Pedro Costa', position: 3 },
    ]
    setPlayerQueue(mockQueue)
  }, [])

  const joinQueue = () => {
    // Simular entrada na fila
    const newPlayer = {
      id: Date.now(),
      name: 'Você',
      position: playerQueue.length + 1
    }
    setPlayerQueue([...playerQueue, newPlayer])
    return true
  }

  const leaveQueue = () => {
    // Simular saída da fila
    setPlayerQueue(playerQueue.filter(player => player.name !== 'Você'))
    return true
  }

  const makeShot = (zone, betAmount) => {
    // Simular chute
    setGameStatus('playing')
    
    // Simular resultado após 2 segundos
    setTimeout(() => {
      const isGoal = Math.random() > 0.3 // 70% de chance de gol
      const result = {
        zone,
        isGoal,
        betAmount,
        prize: isGoal ? betAmount * 1.5 : 0
      }
      
      setCurrentGame(result)
      setGameStatus('finished')
      
      // Atualizar estatísticas
      setPlayerStats(prev => ({
        ...prev,
        totalBets: prev.totalBets + 1,
        totalWins: prev.totalWins + (isGoal ? 1 : 0),
        winRate: ((prev.totalWins + (isGoal ? 1 : 0)) / (prev.totalBets + 1)) * 100,
        balance: prev.balance + (isGoal ? result.prize - betAmount : -betAmount)
      }))
    }, 2000)
    
    return true
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
    joinQueue,
    leaveQueue,
    makeShot,
    resetGame
  }
}

export default useGame