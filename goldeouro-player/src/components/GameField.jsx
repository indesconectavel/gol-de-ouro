import React, { useState, useEffect, useCallback, useMemo } from 'react'
import OptimizedImage from './OptimizedImage'
import ImageLoader from './ImageLoader'
import useSimpleSound from '../hooks/useSimpleSound'
import usePerformance from '../hooks/usePerformance'

const GameField = ({ onShoot, gameStatus, selectedZone, currentShot, totalShots }) => {
  const [goalkeeperPose, setGoalkeeperPose] = useState('idle')
  const [ballPosition, setBallPosition] = useState('ready')
  const [showGoal, setShowGoal] = useState(false)
  const [animationKey, setAnimationKey] = useState(0)
  const [shootDirection, setShootDirection] = useState(null)

  const {
    playKickSound,
    playGoalSound,
    playMissSound,
    playDefenseSound,
    playHoverSound,
    playCrowdSound,
    isMuted
  } = useSimpleSound()

  const { optimizedSettings } = usePerformance()

  const goalZones = useMemo(() => [
    { id: 1, name: 'Canto Superior Esquerdo', x: 15, y: 15, multiplier: 2.0, difficulty: 'hard' },
    { id: 2, name: 'Canto Superior Direito', x: 85, y: 15, multiplier: 2.0, difficulty: 'hard' },
    { id: 3, name: 'Centro Superior', x: 50, y: 20, multiplier: 1.5, difficulty: 'medium' },
    { id: 4, name: 'Canto Inferior Esquerdo', x: 15, y: 70, multiplier: 1.8, difficulty: 'medium' },
    { id: 5, name: 'Canto Inferior Direito', x: 85, y: 70, multiplier: 1.8, difficulty: 'medium' },
    { id: 6, name: 'Centro Inferior', x: 50, y: 80, multiplier: 1.2, difficulty: 'easy' },
  ], [])

  const handleZoneClick = useCallback((zoneId) => {
    if (gameStatus === 'waiting' && currentShot < totalShots) {
      playKickSound()
      setShootDirection(zoneId)
      setGoalkeeperPose('diving')
      setBallPosition('shooting')
      setAnimationKey(prev => prev + 1)
      onShoot(zoneId)
    }
  }, [gameStatus, currentShot, totalShots, playKickSound, onShoot])

  const handleZoneHover = useCallback(() => {
    if (gameStatus === 'waiting' && currentShot < totalShots) {
      playHoverSound()
  }
  }, [gameStatus, currentShot, totalShots, playHoverSound])

  // Efeito de gol
  useEffect(() => {
    if (gameStatus === 'result' && selectedZone) {
      setShowGoal(true)
      playGoalSound() // Já inclui torcida
      setTimeout(() => setShowGoal(false), 2000)
    }
  }, [gameStatus, selectedZone, playGoalSound])

  // Efeito de erro/defesa
  useEffect(() => {
    if (gameStatus === 'result' && !selectedZone) {
      // 70% chance de vaia, 30% chance de som de defesa
      const useDefense = Math.random() > 0.7
      if (useDefense) {
        playDefenseSound()
      } else {
        playMissSound() // Toca vaia
      }
    }
  }, [gameStatus, selectedZone, playMissSound, playDefenseSound])

  // Toca torcida aleatória durante o jogo
  useEffect(() => {
    if (gameStatus === 'waiting') {
      // 20% chance de tocar torcida quando está esperando
      if (Math.random() > 0.8) {
        playCrowdSound()
      }
    }
  }, [gameStatus, playCrowdSound])

  // Reset do goleiro após animação
  useEffect(() => {
    if (goalkeeperPose === 'diving') {
      setTimeout(() => {
        setGoalkeeperPose('idle')
        setBallPosition('ready')
        setShootDirection(null)
      }, 2000)
    }
  }, [goalkeeperPose])

  // Lista de imagens para pré-carregar
  const imageSources = useMemo(() => [
    '/images/game/stadium-background.jpg',
    '/images/game/goalkeeper-3d.png',
    '/images/game/ball.png',
    '/images/game/goal-net-3d.png'
  ], [])

  return (
    <ImageLoader imageSources={imageSources}>
    <div className="relative w-full h-96 overflow-hidden rounded-2xl shadow-2xl">
      {/* Fundo do Estádio - Perspectiva de Primeira Pessoa */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
        {/* Holofotes do estádio - exatamente como na imagem */}
        <div className="absolute inset-0 opacity-80">
          {/* Holofote superior esquerdo */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-yellow-300 rounded-full blur-3xl opacity-90 animate-pulse"></div>
          {/* Holofote superior direito */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-300 rounded-full blur-3xl opacity-90 animate-pulse" style={{animationDelay: '0.5s'}}></div>
          {/* Holofotes distantes no fundo */}
          <div className="absolute top-0 left-1/4 w-24 h-24 bg-blue-300 rounded-full blur-2xl opacity-60 animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-0 right-1/4 w-24 h-24 bg-blue-300 rounded-full blur-2xl opacity-60 animate-pulse" style={{animationDelay: '1.5s'}}></div>
        </div>
        
        {/* Arquibancadas desfocadas no fundo */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-800/60 via-transparent to-slate-900/40"></div>
      </div>

      {/* Campo de Futebol - Gramado Realista */}
      <div className="absolute bottom-0 left-0 right-0 h-3/4 bg-gradient-to-t from-green-800 via-green-600 to-green-500">
        {/* Textura do gramado */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjMDA4MDAwIi8+CjxwYXRoIGQ9Ik0wIDIwSDQwTTIwIDBWMzAiIHN0cm9rZT0iIzAwNjAwMCIgc3Ryb2tlLXdpZHRoPSIxIiBvcGFjaXR5PSIwLjMiLz4KPC9zdmc+')] bg-repeat opacity-40"></div>
        </div>
        
        {/* Linhas do campo - exatamente como na imagem */}
        <div className="absolute inset-0">
          {/* Linha de fundo */}
          <div className="absolute bottom-0 left-0 w-full h-1 bg-white/90"></div>
          {/* Linha central */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-white/90"></div>
          {/* Ponto central */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full"></div>
          {/* Círculo central */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-16 border border-white/90 rounded-full"></div>
          {/* Área de pênalti */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 h-16 border border-white/90 rounded-t-lg"></div>
          {/* Pequena área */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-8 border border-white/90 rounded-t-lg"></div>
        </div>
      </div>

      {/* Gol com Rede - Exatamente como na imagem */}
      <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-20 h-40 z-10">
        {/* Estrutura do gol */}
        <div className="w-full h-full border-4 border-white rounded-l-2xl bg-gradient-to-r from-white to-white/90 shadow-2xl">
          {/* Rede do gol */}
          <div className="absolute inset-2 bg-gradient-to-r from-white/40 to-transparent rounded-l-xl">
            {/* Malha da rede */}
            <div className="absolute inset-0 opacity-60">
              {[...Array(20)].map((_, i) => (
                <div key={i} className="absolute w-3 h-3 border border-white/70 rounded-full"
                  style={{
                    left: `${8 + (i % 5) * 20}%`,
                    top: `${5 + Math.floor(i / 5) * 18}%`
                  }}
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Goleiro Realista - Uniforme Vermelho */}
      <div className={`absolute right-10 top-1/2 transform -translate-y-1/2 z-20 transition-all duration-500 ${
        goalkeeperPose === 'diving' ? 'goalkeeper-dive' : ''
      }`}>
        <div className={`w-16 h-20 relative transition-all duration-300 ${
          shootDirection === 1 || shootDirection === 4 ? 'transform -rotate-12' : 
          shootDirection === 2 || shootDirection === 5 ? 'transform rotate-12' : 
          shootDirection === 3 ? 'transform -translate-y-2' : ''
        }`}>
          {/* Corpo do goleiro */}
          <div className="w-full h-full bg-gradient-to-b from-red-500 via-red-600 to-red-700 rounded-xl relative shadow-2xl">
            {/* Detalhes do uniforme */}
            <div className="absolute inset-0 bg-gradient-to-r from-red-400/30 to-red-800/30 rounded-xl"></div>
            <div className="absolute top-2 left-1 w-2 h-8 bg-black/40 rounded"></div>
            <div className="absolute top-2 right-1 w-2 h-8 bg-black/40 rounded"></div>
            
            {/* Cabeça do goleiro */}
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-gradient-to-b from-yellow-200 to-yellow-300 rounded-full border-2 border-yellow-400 shadow-xl">
              <div className="absolute top-1.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-black rounded-full"></div>
              <div className="absolute top-1.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-black rounded-full ml-1.5"></div>
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-2 h-0.5 bg-black rounded-full"></div>
            </div>
            
            {/* Braços do goleiro */}
            <div className="absolute top-1.5 left-0 w-5 h-6 bg-gradient-to-b from-red-400 to-red-600 rounded-full transform -rotate-12"></div>
            <div className="absolute top-1.5 right-0 w-5 h-6 bg-gradient-to-b from-red-400 to-red-600 rounded-full transform rotate-12"></div>
            
            {/* Luvas do goleiro */}
            <div className="absolute top-1 left-0 w-5 h-6 bg-gradient-to-b from-gray-300 to-gray-400 rounded-full transform -rotate-12"></div>
            <div className="absolute top-1 right-0 w-5 h-6 bg-gradient-to-b from-gray-300 to-gray-400 rounded-full transform rotate-12"></div>
            
            {/* Pernas do goleiro */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-6 bg-gradient-to-b from-red-300 to-red-500 rounded-full"></div>
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-3 bg-gradient-to-b from-red-400 to-red-600 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Bola de Futebol - No centro do campo */}
      <div className={`absolute left-1/4 top-1/2 transform -translate-y-1/2 z-20 transition-all duration-500 ${
        ballPosition === 'shooting' ? 'ball-kick' : ''
      }`}>
        <div className={`w-6 h-6 relative transition-all duration-300 ${
          shootDirection === 1 || shootDirection === 4 ? 'transform translate-x-20 -translate-y-6' : 
          shootDirection === 2 || shootDirection === 5 ? 'transform translate-x-20 translate-y-6' : 
          shootDirection === 3 ? 'transform translate-x-20' : ''
        }`}>
          <div className="w-full h-full bg-white rounded-full border-2 border-gray-300 relative shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-100 to-gray-200 rounded-full"></div>
            {/* Padrão da bola */}
            <div className="absolute inset-1 bg-black rounded-full">
              <div className="absolute inset-1 bg-white rounded-full">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-black rounded-sm"></div>
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-black rounded-sm"></div>
                <div className="absolute top-1/2 left-0 transform -translate-y-1/2 w-1 h-1 bg-black rounded-sm"></div>
                <div className="absolute top-1/2 right-0 transform -translate-y-1/2 w-1 h-1 bg-black rounded-sm"></div>
              </div>
            </div>
            <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-white/80 rounded-full blur-sm"></div>
          </div>
        </div>
      </div>

      {/* Alvos do gol - 6 círculos exatamente como na imagem */}
      {goalZones.map((zone) => (
        <button
          key={zone.id}
          onClick={() => handleZoneClick(zone.id)}
          onMouseEnter={handleZoneHover}
          disabled={gameStatus !== 'waiting' || currentShot >= totalShots}
          className={`absolute w-8 h-8 rounded-full border-2 transition-all duration-300 z-30 ${
            selectedZone === zone.id
              ? 'bg-yellow-400 border-yellow-300 zone-pulse shadow-2xl shadow-yellow-400/60'
              : gameStatus === 'waiting' && currentShot < totalShots
              ? 'bg-black/70 border-white/90 hover:bg-yellow-400/70 hover:scale-110 hover:shadow-xl hover:shadow-yellow-400/30'
              : 'bg-black/50 border-white/60'
          }`}
          style={{
            right: `${zone.x}%`,
            top: `${zone.y}%`,
            transform: 'translate(50%, -50%)'
          }}
        >
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full opacity-90 shadow-sm"></div>
          </div>
        </button>
      ))}

      {/* Efeito de gol */}
      {showGoal && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
          <div className="text-8xl font-bold goal-effect">
            <span className="text-yellow-400 drop-shadow-2xl">G</span>
            <span className="text-white drop-shadow-2xl">⚽</span>
            <span className="text-yellow-400 drop-shadow-2xl">L</span>
          </div>
        </div>
      )}

      {/* Efeito de confetti para gol */}
      {showGoal && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                backgroundColor: ['#fbbf24', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444'][Math.floor(Math.random() * 5)],
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Debug: Mostrar status do jogo */}
      <div className="absolute top-2 left-2 text-white text-xs bg-black/50 p-2 rounded z-50">
        <div>Goleiro: {goalkeeperPose}</div>
        <div>Bola: {ballPosition}</div>
        <div>Zona: {selectedZone || 'Nenhuma'}</div>
        <div>Direção: {shootDirection || 'Nenhuma'}</div>
      </div>
    </div>
    </ImageLoader>
  )
}

export default GameField