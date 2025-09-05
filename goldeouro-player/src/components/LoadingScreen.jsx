import React from 'react'

const LoadingScreen = () => {
  return (
    <div className="min-h-screen bg-stadium-dark flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background com efeito de estádio */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-green-900"></div>
      
      {/* Logo principal */}
      <div className="relative z-10 mb-8 animate-pulse">
        {/* Escudo dourado */}
        <div className="relative">
          <div className="w-32 h-40 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-lg transform rotate-12 shadow-2xl">
            {/* Interior azul do escudo */}
            <div className="absolute inset-2 bg-gradient-to-b from-blue-900 to-blue-700 rounded-md">
              {/* Efeito de luzes */}
              <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-transparent rounded-md"></div>
              
              {/* Troféu central */}
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                <div className="w-8 h-12 bg-gradient-to-t from-yellow-400 to-yellow-300 rounded-t-lg">
                  <div className="w-6 h-6 bg-white rounded-full mx-auto mt-1 relative">
                    <div className="absolute inset-1 bg-black rounded-full"></div>
                    <div className="absolute inset-2 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>
              
              {/* Campo verde na base */}
              <div className="absolute bottom-0 left-0 right-0 h-2 bg-green-500 rounded-b-md"></div>
            </div>
          </div>
          
          {/* Estrelas acima do escudo */}
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-3 h-3 bg-yellow-400 transform rotate-45"
              ></div>
            ))}
          </div>
        </div>
        
        {/* Banner com texto */}
        <div className="mt-6 bg-gradient-to-r from-yellow-400 to-yellow-600 px-6 py-3 rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-blue-900 text-center">
            GOL DE OURO
          </h1>
        </div>
        
        {/* Texto ESTD 2024 */}
        <div className="flex justify-between items-center mt-2 text-xs text-white/70">
          <span>ESTD</span>
          <span>2024</span>
        </div>
      </div>
      
      {/* Texto Carregando */}
      <div className="relative z-10">
        <h2 className="text-3xl font-bold text-white mb-4">Carregando...</h2>
        
        {/* Barra de progresso */}
        <div className="w-64 h-2 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full animate-pulse"></div>
        </div>
      </div>
      
      {/* Campo de futebol na parte inferior */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-green-600 to-green-500">
        {/* Linha branca */}
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-32 h-0.5 bg-white"></div>
        
        {/* Bola de futebol */}
        <div className="absolute top-12 right-1/3 w-8 h-8 bg-white rounded-full relative animate-bounce">
          <div className="absolute inset-1 bg-black rounded-full">
            <div className="absolute inset-1 bg-white rounded-full"></div>
          </div>
        </div>
      </div>
      
      {/* Versão */}
      <div className="absolute top-4 right-4 text-yellow-400 text-sm font-medium">
        Versão 1.0
      </div>
    </div>
  )
}

export default LoadingScreen