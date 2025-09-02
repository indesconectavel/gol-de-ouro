import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import FootballField from '../components/FootballField';
import useSocket from '../hooks/useSocket';

const Game = () => {
  const [gameState, setGameState] = useState({
    isInQueue: false,
    queuePosition: 0,
    gameId: null,
    gameStatus: 'waiting', // waiting, active, finished
    playersCount: 0,
    shotOptions: [],
    userBalance: 0,
    isShooting: false,
    lastShotResult: null,
    isGoldenGoal: false
  });

  const [showGoldenGoal, setShowGoldenGoal] = useState(false);
  const [nextGoldenGoal, setNextGoldenGoal] = useState(0);

  // Hook do Socket.io
  const { isConnected, joinQueue, leaveQueue, joinGame, leaveGame, notifyShot, useSocketEvent } = useSocket();

  // Carregar opções de chute e dados iniciais
  useEffect(() => {
    loadInitialData();
  }, []);

  // Escutar eventos de WebSocket
  useSocketEvent('queue-updated', () => {
    console.log('🔄 Fila atualizada via WebSocket');
    checkQueueStatus();
  });

  useSocketEvent('shot-result', (data) => {
    console.log('⚽ Resultado de chute recebido:', data);
    // Atualizar interface com resultado de outro jogador
  });

  const loadInitialData = async () => {
    try {
      // Carregar opções de chute
      const shotOptionsResponse = await api.get('/games/opcoes-chute');
      setGameState(prev => ({
        ...prev,
        shotOptions: shotOptionsResponse.data.data || []
      }));

      // Carregar estatísticas do usuário
      const statsResponse = await api.get('/games/estatisticas');
      if (statsResponse.data.success) {
        setNextGoldenGoal(statsResponse.data.data.next_golden_goal || 0);
      }
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
    }
  };

  // Entrar na fila
  const enterQueue = async () => {
    try {
      const response = await api.post('/games/fila/entrar', {
        user_id: 1 // TODO: Pegar do contexto de autenticação
      });

      if (response.data.success) {
        setGameState(prev => ({
          ...prev,
          isInQueue: true,
          queuePosition: response.data.data.position,
          gameId: response.data.data.game_id
        }));
      }
    } catch (error) {
      console.error('Erro ao entrar na fila:', error);
      alert(error.response?.data?.message || 'Erro ao entrar na fila');
    }
  };

  // Executar chute
  const executeShot = async (shotOptionId) => {
    if (!gameState.gameId || gameState.isShooting) return;

    setGameState(prev => ({ ...prev, isShooting: true }));

    try {
      const response = await api.post('/games/chutar', {
        user_id: 1, // TODO: Pegar do contexto
        game_id: gameState.gameId,
        shot_option_id: shotOptionId
      });

      if (response.data.success) {
        const result = response.data.data;
        const shotResult = result.is_winner ? 'goal' : 'miss';
        
        setGameState(prev => ({
          ...prev,
          lastShotResult: shotResult,
          isGoldenGoal: result.is_golden_goal || false,
          isShooting: false
        }));

        // Verificar se é Gol de Ouro
        if (result.is_golden_goal) {
          setShowGoldenGoal(true);
          setTimeout(() => setShowGoldenGoal(false), 5000);
        }

        // Notificar resultado via WebSocket
        notifyShot(gameState.gameId, shotResult, result.is_golden_goal);

        // Atualizar estatísticas
        loadInitialData();
      }
    } catch (error) {
      console.error('Erro ao executar chute:', error);
      setGameState(prev => ({ ...prev, isShooting: false }));
      alert(error.response?.data?.message || 'Erro ao executar chute');
    }
  };

  // Verificar status da fila
  const checkQueueStatus = async () => {
    if (!gameState.isInQueue) return;

    try {
      const response = await api.post('/games/fila/status', {
        user_id: 1 // TODO: Pegar do contexto
      });

      if (response.data.success) {
        const data = response.data.data;
        setGameState(prev => ({
          ...prev,
          gameStatus: data.game_status,
          playersCount: data.players_count,
          queuePosition: data.position
        }));
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    }
  };

  // Verificar status periodicamente
  useEffect(() => {
    if (gameState.isInQueue) {
      const interval = setInterval(checkQueueStatus, 2000);
      return () => clearInterval(interval);
    }
  }, [gameState.isInQueue]);

  return (
    <div className="bg-[#000717] p-8 rounded shadow-md max-w-7xl mx-auto mt-10 text-white">
      {/* Header com informações do jogo */}
      <div className="mb-6">
        <div className="bg-[#1A202C] rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-yellow-400 mb-2">⚽ Gol de Ouro</h1>
              <p className="text-gray-400">Sistema de apostas com prêmios especiais</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-yellow-400">
                Próximo Gol de Ouro: {nextGoldenGoal}
              </div>
              <div className="text-sm text-gray-400">
                Prêmio especial: R$ 50,00
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel de Status */}
        <div className="lg:col-span-1">
          <div className="bg-[#1A202C] rounded-lg p-6 border border-gray-700 mb-6">
            <h2 className="text-xl font-bold text-white mb-4">📊 Status da Partida</h2>
            
            {gameState.isInQueue ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-yellow-400">Status:</span>
                  <span className={`px-4 py-2 rounded-full text-sm font-bold text-center ${
                    gameState.gameStatus === 'active' 
                      ? 'bg-green-500 text-white' 
                      : 'bg-yellow-500 text-black'
                  }`}>
                    {gameState.gameStatus === 'active' ? 'Ativa' : 'Aguardando'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-yellow-400">Jogadores:</span>
                  <span className="text-white font-bold">{gameState.playersCount}/10</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-yellow-400">Sua posição:</span>
                  <span className="text-white font-bold">#{gameState.queuePosition}</span>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-gray-400 mb-4">Você não está em uma partida</p>
                <button
                  onClick={enterQueue}
                  className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
                >
                  🏃🏽‍♂️ Entrar na Fila
                </button>
              </div>
            )}
          </div>

          {/* Resultado do último chute */}
          {gameState.lastShotResult && (
            <div className="bg-[#1A202C] rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-bold text-white mb-3">🎯 Último Chute</h3>
              <div className={`text-center p-4 rounded-lg ${
                gameState.lastShotResult.is_goal 
                  ? 'bg-green-500/20 border border-green-500' 
                  : 'bg-red-500/20 border border-red-500'
              }`}>
                <div className="text-2xl mb-2">
                  {gameState.lastShotResult.is_goal ? '⚽ GOL!' : '❌ Errou'}
                </div>
                {gameState.lastShotResult.is_golden_goal && (
                  <div className="text-yellow-400 font-bold text-lg">
                    🏆 GOL DE OURO! +R$ 50,00
                  </div>
                )}
                {gameState.lastShotResult.prize_amount && (
                  <div className="text-green-400 font-bold">
                    Prêmio: R$ {gameState.lastShotResult.prize_amount.toFixed(2)}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Campo de Futebol */}
        <div className="lg:col-span-2">
          <div className="bg-[#1A202C] rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-6 text-center">
              ⚽ Campo de Futebol
            </h2>
            
            <FootballField
              shotOptions={gameState.shotOptions}
              onShotSelect={executeShot}
              gameStatus={gameState.gameStatus}
              isShooting={gameState.isShooting}
              shotResult={gameState.lastShotResult}
              isGoldenGoal={gameState.isGoldenGoal}
            />
          </div>
        </div>
      </div>

      {/* Modal do Gol de Ouro */}
      <AnimatePresence>
        {showGoldenGoal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.5, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0.5, rotate: 180 }}
              className="bg-gradient-to-r from-yellow-400 to-yellow-600 p-8 rounded-xl text-center max-w-md mx-4"
            >
              <div className="text-6xl mb-4">🏆</div>
              <h2 className="text-3xl font-bold text-white mb-2">GOL DE OURO!</h2>
              <p className="text-xl text-white mb-4">Parabéns! Você marcou o milésimo chute!</p>
              <div className="text-2xl font-bold text-white">+ R$ 50,00</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Game;
