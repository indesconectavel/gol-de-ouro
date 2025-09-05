import React from 'react'

const TestGameField = () => {
  return (
    <div className="w-full h-96 bg-gradient-to-b from-blue-500 to-green-500 rounded-2xl relative overflow-hidden">
      {/* Teste simples com elementos visíveis */}
      <div className="absolute top-4 left-4 text-white text-2xl font-bold">
        TESTE GAMEFIELD
      </div>
      
      {/* Goleiro simples */}
      <div className="absolute right-8 top-1/2 transform -translate-y-1/2 w-16 h-20 bg-green-400 rounded-lg shadow-lg">
        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-yellow-200 rounded-full"></div>
        <div className="absolute top-2 left-1 w-14 h-1 bg-white"></div>
        <div className="absolute top-4 left-1 w-14 h-1 bg-white"></div>
      </div>
      
      {/* Bola simples */}
      <div className="absolute left-1/4 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-white rounded-full border-2 border-gray-300 shadow-lg">
        <div className="absolute inset-1 bg-black rounded-full">
          <div className="absolute inset-1 bg-white rounded-full">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-black rounded-full"></div>
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-black rounded-full"></div>
          </div>
        </div>
      </div>
      
      {/* Gol simples */}
      <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-20 h-40 border-4 border-white rounded-l-2xl bg-white/20">
        <div className="absolute inset-2 bg-blue-200/40 rounded-l-xl">
          <div className="absolute top-4 left-4 w-4 h-4 bg-white rounded-full"></div>
          <div className="absolute top-4 right-4 w-4 h-4 bg-white rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full"></div>
        </div>
      </div>
      
      {/* Texto de teste */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-lg font-bold">
        Se você vê isso, o componente está funcionando!
      </div>
    </div>
  )
}

export default TestGameField
