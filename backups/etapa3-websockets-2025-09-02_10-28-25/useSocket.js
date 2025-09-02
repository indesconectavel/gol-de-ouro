import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    // Obter token do localStorage
    const token = localStorage.getItem('token');
    
    if (!token) {
      setConnectionError('Token de autenticação não encontrado');
      return;
    }

    // URL do backend (usar variável de ambiente ou fallback)
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    // Criar conexão Socket.io
    const newSocket = io(backendUrl, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });

    // Eventos de conexão
    newSocket.on('connect', () => {
      console.log('🔌 Conectado ao servidor WebSocket');
      setIsConnected(true);
      setConnectionError(null);
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 Desconectado do servidor WebSocket');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Erro de conexão WebSocket:', error);
      setConnectionError(error.message);
      setIsConnected(false);
    });

    // Eventos de autenticação
    newSocket.on('auth_error', (error) => {
      console.error('❌ Erro de autenticação WebSocket:', error);
      setConnectionError('Erro de autenticação');
      setIsConnected(false);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Cleanup na desmontagem
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

  // Funções utilitárias
  const joinQueue = () => {
    if (socket && isConnected) {
      socket.emit('join-queue');
    }
  };

  const leaveQueue = () => {
    if (socket && isConnected) {
      socket.emit('leave-queue');
    }
  };

  const joinGame = (gameId) => {
    if (socket && isConnected) {
      socket.emit('join-game', gameId);
    }
  };

  const leaveGame = (gameId) => {
    if (socket && isConnected) {
      socket.emit('leave-game', gameId);
    }
  };

  const notifyShot = (gameId, shotResult, isGoldenGoal) => {
    if (socket && isConnected) {
      socket.emit('shot-taken', {
        gameId,
        shotResult,
        isGoldenGoal
      });
    }
  };

  // Hook para escutar eventos específicos
  const useSocketEvent = (eventName, callback) => {
    useEffect(() => {
      if (socket && isConnected) {
        socket.on(eventName, callback);

        return () => {
          socket.off(eventName, callback);
        };
      }
    }, [socket, isConnected, eventName, callback]);
  };

  return {
    socket,
    isConnected,
    connectionError,
    joinQueue,
    leaveQueue,
    joinGame,
    leaveGame,
    notifyShot,
    useSocketEvent
  };
};

export default useSocket;
