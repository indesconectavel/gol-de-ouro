import React from 'react'

const BettingControls = ({ 
  playerShots, 
  totalShots, 
  onAddShots, 
  onRemoveShots, 
  balance = 21.00,
  betAmount = 1.00 
}) => {
  return (
    <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-6 mb-6 shadow-xl">
      {/* Header com título */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">CHUTAR</h2>
        <p className="text-white/80 text-sm">Escolha um local para chutar</p>
      </div>

      {/* Controles de aposta */}
      <div className="flex justify-between items-center mb-6">
        {/* Aposta */}
        <div className="flex items-center space-x-3">
          <span className="text-white font-medium">Aposta:</span>
          <button
            onClick={() => onRemoveShots(1)}
            disabled={playerShots <= 0}
            className="w-8 h-8 bg-red-500 hover:bg-red-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold rounded-full transition-all duration-200 flex items-center justify-center"
          >
            -
          </button>
          <div className="bg-white/20 rounded-lg px-4 py-2 min-w-[80px] text-center">
            <span className="text-white font-bold text-lg">R$ {betAmount.toFixed(2)}</span>
          </div>
          <button
            onClick={() => onAddShots(1)}
            disabled={totalShots >= 10}
            className="w-8 h-8 bg-green-500 hover:bg-green-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold rounded-full transition-all duration-200 flex items-center justify-center"
          >
            +
          </button>
        </div>

        {/* Saldo */}
        <div className="flex items-center space-x-3">
          <span className="text-white font-medium">Saldo:</span>
          <div className="bg-white/20 rounded-lg px-4 py-2 min-w-[80px] text-center">
            <span className="text-white font-bold text-lg">R$ {balance.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Informações da partida */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="bg-white/10 rounded-lg p-3">
          <p className="text-white/70 text-sm">Seus Chutes</p>
          <p className="text-yellow-400 font-bold text-xl">{playerShots}</p>
        </div>
        <div className="bg-white/10 rounded-lg p-3">
          <p className="text-white/70 text-sm">Total Partida</p>
          <p className="text-green-400 font-bold text-xl">{totalShots}/10</p>
        </div>
        <div className="bg-white/10 rounded-lg p-3">
          <p className="text-white/70 text-sm">Investimento</p>
          <p className="text-blue-400 font-bold text-xl">R$ {(playerShots * betAmount).toFixed(2)}</p>
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="mt-4">
        <div className="w-full bg-white/20 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-yellow-400 to-green-400 h-3 rounded-full transition-all duration-500"
            style={{ width: `${(totalShots / 10) * 100}%` }}
          ></div>
        </div>
        <p className="text-white/70 text-sm mt-2 text-center">
          {totalShots >= 10 ? 'Partida Completa!' : `${10 - totalShots} chutes restantes`}
        </p>
      </div>
    </div>
  )
}

export default BettingControls
