import React from 'react'

const GameAssets3D = {
  // Goleiro 3D realista
  Goalkeeper: ({ pose = 'idle', className = "w-16 h-20" }) => (
    <div className={`${className} relative`}>
      <div className="w-full h-full relative transform-gpu perspective-1000">
        {/* Corpo do goleiro com efeito 3D */}
        <div className="w-full h-full bg-gradient-to-b from-green-400 via-green-500 to-green-600 rounded-lg relative shadow-2xl transform-gpu">
          {/* Efeito de profundidade */}
          <div className="absolute inset-0 bg-gradient-to-r from-green-300/20 to-green-700/20 rounded-lg"></div>
          
          {/* Cabeça 3D */}
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-gradient-to-b from-yellow-200 to-yellow-300 rounded-full border-2 border-yellow-400 shadow-lg">
            {/* Rosto */}
            <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-black rounded-full"></div>
            <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-black rounded-full ml-1"></div>
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-2 h-1 bg-black rounded-full"></div>
          </div>
          
          {/* Uniforme com listras 3D */}
          <div className="absolute top-2 left-1 w-14 h-1 bg-white opacity-90 shadow-sm"></div>
          <div className="absolute top-4 left-1 w-14 h-1 bg-white opacity-90 shadow-sm"></div>
          <div className="absolute top-6 left-1 w-14 h-1 bg-white opacity-90 shadow-sm"></div>
          
          {/* Luvas 3D */}
          <div className="absolute top-8 left-0 w-4 h-6 bg-gradient-to-b from-white to-gray-100 rounded-l-lg border border-gray-300 shadow-lg">
            <div className="absolute inset-1 bg-gradient-to-b from-gray-200 to-gray-300 rounded-l-md"></div>
          </div>
          <div className="absolute top-8 right-0 w-4 h-6 bg-gradient-to-b from-white to-gray-100 rounded-r-lg border border-gray-300 shadow-lg">
            <div className="absolute inset-1 bg-gradient-to-b from-gray-200 to-gray-300 rounded-r-md"></div>
          </div>
          
          {/* Calção 3D */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-6 bg-gradient-to-b from-green-600 to-green-700 rounded shadow-lg">
            <div className="absolute inset-1 bg-gradient-to-b from-green-500 to-green-600 rounded"></div>
          </div>
          
          {/* Chuteiras 3D */}
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-3 bg-gradient-to-b from-white to-gray-100 rounded border border-gray-300 shadow-lg">
            <div className="absolute inset-1 bg-gradient-to-b from-gray-200 to-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  ),

  // Bola de futebol 3D realista
  Ball: ({ className = "w-6 h-6" }) => (
    <div className={`${className} relative transform-gpu perspective-1000`}>
      <div className="w-full h-full bg-white rounded-full border-2 border-gray-300 relative shadow-2xl transform-gpu">
        {/* Efeito de brilho */}
        <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-100 to-gray-200 rounded-full"></div>
        
        {/* Padrão da bola com hexágonos */}
        <div className="absolute inset-1 bg-black rounded-full">
          <div className="absolute inset-1 bg-white rounded-full">
            {/* Hexágonos pretos */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-black rounded-sm"></div>
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-black rounded-sm"></div>
            <div className="absolute top-1/2 left-0 transform -translate-y-1/2 w-2 h-2 bg-black rounded-sm"></div>
            <div className="absolute top-1/2 right-0 transform -translate-y-1/2 w-2 h-2 bg-black rounded-sm"></div>
            <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-black rounded-sm"></div>
            <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-black rounded-sm"></div>
            <div className="absolute bottom-1/4 left-1/4 w-2 h-2 bg-black rounded-sm"></div>
            <div className="absolute bottom-1/4 right-1/4 w-2 h-2 bg-black rounded-sm"></div>
          </div>
        </div>
        
        {/* Reflexo de luz */}
        <div className="absolute top-1 left-1 w-2 h-2 bg-white/60 rounded-full blur-sm"></div>
      </div>
    </div>
  ),

  // Gol com rede 3D
  GoalPost: ({ className = "w-20 h-40" }) => (
    <div className={`${className} border-4 border-white rounded-l-2xl relative shadow-2xl`}>
      {/* Efeito de profundidade */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-l-2xl"></div>
      
      {/* Rede do gol com padrão hexagonal */}
      <div className="absolute inset-2 bg-gradient-to-r from-blue-200/40 to-transparent rounded-l-xl">
        {/* Padrão hexagonal da rede */}
        <div className="absolute inset-0 opacity-30">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="absolute w-3 h-3 border border-white/40 rounded-full"
              style={{
                left: `${15 + (i % 4) * 20}%`,
                top: `${10 + Math.floor(i / 4) * 20}%`
              }}
            ></div>
          ))}
        </div>
        
        {/* Linhas da rede */}
        <div className="absolute inset-0">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute w-full h-0.5 bg-white/20"
              style={{ top: `${15 + i * 15}%` }}
            ></div>
          ))}
          {[...Array(4)].map((_, i) => (
            <div key={i} className="absolute h-full w-0.5 bg-white/20"
              style={{ left: `${20 + i * 20}%` }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  ),

  // Estádio com holofotes
  StadiumBackground: ({ className = "w-full h-96" }) => (
    <div className={`${className} bg-gradient-to-b from-slate-800 via-slate-700 to-green-600 rounded-2xl relative overflow-hidden`}>
      {/* Holofotes do estádio */}
      <div className="absolute inset-0 opacity-40">
        {/* Holofotes principais */}
        <div className="absolute top-0 left-1/4 w-32 h-32 bg-yellow-200 rounded-full blur-3xl opacity-60"></div>
        <div className="absolute top-0 right-1/4 w-32 h-32 bg-yellow-200 rounded-full blur-3xl opacity-60"></div>
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-40 bg-yellow-200 rounded-full blur-3xl opacity-40"></div>
        
        {/* Raios de luz */}
        <div className="absolute top-0 left-1/4 w-1 h-full bg-gradient-to-b from-yellow-200 to-transparent opacity-40"></div>
        <div className="absolute top-0 right-1/4 w-1 h-full bg-gradient-to-b from-yellow-200 to-transparent opacity-40"></div>
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-yellow-200 to-transparent opacity-30"></div>
        
        {/* Efeito de partículas de luz */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-yellow-200 rounded-full opacity-60 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 50}%`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Gramado com textura */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-b from-green-500 to-green-600">
        {/* Linhas do campo */}
        <div className="absolute inset-4 border-2 border-white rounded-lg opacity-80"></div>
        <div className="absolute top-1/2 left-4 w-16 h-0.5 bg-white transform -translate-y-1/2 opacity-80"></div>
        <div className="absolute top-1/2 right-4 w-16 h-0.5 bg-white transform -translate-y-1/2 opacity-80"></div>
        
        {/* Círculo central */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 border-2 border-white rounded-full opacity-60"></div>
        
        {/* Textura do gramado */}
        <div className="absolute inset-0 opacity-20">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute w-0.5 h-4 bg-green-800 transform rotate-12"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.5 + 0.2
              }}
            />
          ))}
        </div>
      </div>
    </div>
  ),

  // Círculo de alvo 3D
  TargetCircle: ({ isSelected, isActive, className = "w-8 h-8" }) => (
    <div className={`rounded-full border-2 transition-all duration-200 ${className} ${
      isSelected
        ? 'bg-yellow-400 border-yellow-300 pulse-glow shadow-lg shadow-yellow-400/50'
        : isActive
        ? 'bg-white/20 border-white/60 hover:bg-white/40 hover:scale-110 hover:shadow-lg'
        : 'bg-white/10 border-white/30'
    }`}>
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-3 h-3 bg-white rounded-full opacity-80 shadow-sm"></div>
      </div>
    </div>
  ),

  // Texto de Gol 3D
  GoalText: ({ className = "text-4xl font-bold" }) => (
    <div className={`${className} text-yellow-400 transform-gpu perspective-1000`}>
      <div className="relative">
        <span className="text-yellow-400 drop-shadow-lg">G</span>
        <span className="text-white drop-shadow-lg">⚽</span>
        <span className="text-yellow-400 drop-shadow-lg">L</span>
        {/* Efeito de brilho */}
        <div className="absolute inset-0 text-yellow-200 blur-sm opacity-50">G⚽L</div>
      </div>
    </div>
  ),
}

export default GameAssets3D
