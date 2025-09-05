import React from 'react'

const GameAssets = {
  // Bola de futebol
  Ball: ({ className = "w-6 h-6" }) => (
    <div className={`${className} bg-white rounded-full border-2 border-gray-300 relative`}>
      <div className="absolute inset-1 bg-black rounded-full">
        <div className="absolute inset-1 bg-white rounded-full"></div>
      </div>
    </div>
  ),

  // Goleiro
  Goalkeeper: ({ pose = 'idle', className = "w-16 h-20" }) => (
    <div className={`${className} relative`}>
      {pose === 'idle' && (
        <div className="w-full h-full bg-green-500 rounded-lg relative">
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-yellow-300 rounded-full"></div>
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-6 bg-green-600 rounded"></div>
        </div>
      )}
      {pose === 'dive-left' && (
        <div className="w-full h-full bg-green-500 rounded-lg relative transform -rotate-12">
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-yellow-300 rounded-full"></div>
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-6 bg-green-600 rounded"></div>
        </div>
      )}
      {pose === 'dive-right' && (
        <div className="w-full h-full bg-green-500 rounded-lg relative transform rotate-12">
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-yellow-300 rounded-full"></div>
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-6 bg-green-600 rounded"></div>
        </div>
      )}
    </div>
  ),

  // Trave do gol
  GoalPost: ({ className = "w-16 h-32" }) => (
    <div className={`${className} border-2 border-white rounded-l-lg relative`}>
      <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-8 h-16 border-2 border-white rounded-l-lg"></div>
      <div className="absolute inset-2 bg-white/10 rounded-l-md"></div>
    </div>
  ),

  // Fundo do estádio
  StadiumBackground: ({ className = "w-full h-full" }) => (
    <div className={`${className} bg-gradient-to-b from-green-600 to-green-700 relative overflow-hidden`}>
      {/* Efeito de gramado */}
      <div className="absolute inset-0 opacity-20">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-8 bg-green-800 transform rotate-12"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.5 + 0.2
            }}
          />
        ))}
      </div>
      
      {/* Linhas do campo */}
      <div className="absolute inset-4 border-2 border-white rounded-lg"></div>
      <div className="absolute top-1/2 left-4 w-16 h-0.5 bg-white transform -translate-y-1/2"></div>
      <div className="absolute top-1/2 right-4 w-16 h-0.5 bg-white transform -translate-y-1/2"></div>
    </div>
  ),

  // Efeito de confetti
  Confetti: ({ className = "w-2 h-2" }) => (
    <div className={`${className} bg-yellow-400 rounded-full animate-bounce`}></div>
  ),

  // Texto "GOAL!"
  GoalText: ({ className = "text-4xl font-bold" }) => (
    <div className={`${className} text-green-400 animate-bounce`}>
      ⚽ GOL!
    </div>
  ),

  // Círculos de alvo
  TargetCircle: ({ className = "w-6 h-6", isSelected = false, isActive = true }) => (
    <div className={`${className} rounded-full border-2 transition-all duration-200 ${
      isSelected
        ? 'bg-yellow-400 border-yellow-300 pulse-glow'
        : isActive
        ? 'bg-white/20 border-white/50 hover:bg-white/40 hover:scale-110'
        : 'bg-white/10 border-white/30'
    }`}>
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-2 h-2 bg-white rounded-full"></div>
      </div>
    </div>
  )
}

export default GameAssets
