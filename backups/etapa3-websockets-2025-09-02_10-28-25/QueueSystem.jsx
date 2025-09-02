import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import useSocket from '../hooks/useSocket';

const QueueSystem = () => {
  const [queueData, setQueueData] = useState({
    currentGame: null,
    waitingPlayers: [],
    activeGames: [],
    userInQueue: false,
    userPosition: 0
  });

  const [isLoading, setIsLoading] = useState(true);
  
  // Hook do Socket.io
  const { isConnected, joinQueue, leaveQueue, useSocketEvent } = useSocket();

  useEffect(() => {
    loadQueueData();
    
    // Atualizar dados da fila a cada 10 segundos (menos frequente com WebSockets)
    const interval = setInterval(loadQueueData, 10000);

    return () => clearInterval(interval);
  }, []);

  // Escutar atualizações da fila via WebSocket
  useSocketEvent('queue-updated', () => {
    console.log('🔄 Fila atualizada via WebSocket');
    loadQueueData();
  });

  const loadQueueData = async () => {
    try {
      // TODO: Implementar endpoint para dados da fila
      // Por enquanto, vamos simular dados
      setQueueData({
        currentGame: {
          id: 1,
          status: 'waiting',
          playersCount: 7,
          maxPlayers: 10,
          startTime: null
        },
        waitingPlayers: [
          { id: 1, name: 'Jogador 1', position: 1, joinedAt: new Date() },
          { id: 2, name: 'Jogador 2', position: 2, joinedAt: new Date() },
          { id: 3, name: 'Jogador 3', position: 3, joinedAt: new Date() },
          { id: 4, name: 'Jogador 4', position: 4, joinedAt: new Date() },
          { id: 5, name: 'Jogador 5', position: 5, joinedAt: new Date() },
          { id: 6, name: 'Jogador 6', position: 6, joinedAt: new Date() },
          { id: 7, name: 'Jogador 7', position: 7, joinedAt: new Date() },
        ],
        activeGames: [],
        userInQueue: false,
        userPosition: 0
      });
    } catch (error) {
      console.error('Erro ao carregar dados da fila:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const enterQueue = async () => {
    try {
      const response = await api.post('/games/fila/entrar', {
        user_id: 1 // TODO: Pegar do contexto de autenticação
      });

      if (response.data.success) {
        setQueueData(prev => ({
          ...prev,
          userInQueue: true,
          userPosition: response.data.data.position
        }));
        
        // Entrar na sala de fila via WebSocket
        joinQueue();
      }
    } catch (error) {
      console.error('Erro ao entrar na fila:', error);
      alert(error.response?.data?.message || 'Erro ao entrar na fila');
    }
  };

  const handleLeaveQueue = async () => {
    try {
      // TODO: Implementar endpoint para sair da fila
      setQueueData(prev => ({
        ...prev,
        userInQueue: false,
        userPosition: 0
      }));
      
      // Sair da sala de fila via WebSocket
      leaveQueue();
    } catch (error) {
      console.error('Erro ao sair da fila:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-[#1A202C] rounded-lg p-6 border border-gray-700">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-600 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-600 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status da Fila Atual */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#1A202C] rounded-lg p-4 border border-gray-700"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <h3 className="text-xl font-bold text-white">🎮 Fila de Jogadores</h3>
            {/* Indicador de conexão WebSocket */}
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
              isConnected ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-white' : 'bg-white animate-pulse'
              }`}></div>
              <span>{isConnected ? 'Online' : 'Offline'}</span>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-full text-sm font-bold text-center ${
            queueData.currentGame?.status === 'active' 
              ? 'bg-green-500 text-white' 
              : 'bg-yellow-500 text-black'
          }`}>
            {queueData.currentGame?.status === 'active' ? 'Partida Ativa' : 'Aguardando Jogadores'}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-white">
              {queueData.currentGame?.playersCount || 0}
            </div>
            <div className="text-yellow-400 text-sm">Jogadores na Fila</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white">
              {queueData.currentGame?.maxPlayers - queueData.currentGame?.playersCount || 0}
            </div>
            <div className="text-yellow-400 text-sm">Vagas Restantes</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white">
              {queueData.currentGame?.maxPlayers || 10}
            </div>
            <div className="text-yellow-400 text-sm">Total de Vagas</div>
          </div>
        </div>

        {/* Barra de Progresso */}
        <div className="w-full bg-gray-700 rounded-full h-4 mb-4">
          <motion.div
            className="bg-gradient-to-r from-green-500 to-green-600 h-4 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(queueData.currentGame?.playersCount / queueData.currentGame?.maxPlayers) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-4">
          {!queueData.userInQueue ? (
            <motion.button
              onClick={enterQueue}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200"
            >
              🏃🏽‍♂️ Entrar na Fila
            </motion.button>
          ) : (
            <motion.button
              onClick={leaveQueue}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200"
            >
              🚪 Sair da Fila
            </motion.button>
          )}
        </div>

        {queueData.userInQueue && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg"
          >
            <div className="text-center">
              <div className="text-yellow-400 font-bold text-lg">
                Você está na posição #{queueData.userPosition}
              </div>
              <div className="text-yellow-400 text-sm">
                <span className="font-bold">Aguardando mais {queueData.currentGame?.maxPlayers - queueData.currentGame?.playersCount} jogadores</span>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Lista de Jogadores na Fila */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-[#1A202C] rounded-lg p-4 border border-gray-700"
      >
        <h3 className="text-xl font-bold text-white mb-4">👥 Jogadores na Fila</h3>
        
        <div className="space-y-1">
          <AnimatePresence>
            {queueData.waitingPlayers.map((player, index) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center justify-between p-2 rounded-lg ${
                  player.id === 1 ? 'bg-yellow-500/20 border border-yellow-500/30' : 'bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    player.id === 1 ? 'bg-yellow-500 text-black' : 'bg-gray-600 text-white'
                  }`}>
                    {player.position}
                  </div>
                  <div>
                    <div className="text-white font-medium">{player.name}</div>
                    <div className="text-yellow-400 text-xs">
                      Entrou há {Math.floor(Math.random() * 5) + 1} min
                    </div>
                  </div>
                </div>
                <div className="text-yellow-400 text-sm">
                  <span className="font-bold">{player.id === 1 ? 'Você' : 'Aguardando'}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Vagas vazias */}
        {queueData.waitingPlayers.length < queueData.currentGame?.maxPlayers && (
          <div className="mt-4">
            <div className="text-yellow-400 text-sm mb-2">
              Vagas disponíveis:
            </div>
            <div className="flex gap-2">
              {Array.from({ length: queueData.currentGame?.maxPlayers - queueData.waitingPlayers.length }).map((_, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-sm text-gray-400"
                >
                  ?
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default QueueSystem;
