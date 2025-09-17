// Hook para gerenciar notificações - Gol de Ouro Player
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';

const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  // Simular WebSocket (será substituído por implementação real)
  useEffect(() => {
    // Simular conexão WebSocket
    const connectWebSocket = () => {
      setIsConnected(true);
      
      // Simular notificações periódicas para demonstração
      const interval = setInterval(() => {
        const randomNotifications = [
          {
            id: Date.now(),
            type: 'payment',
            title: 'Pagamento Aprovado',
            message: 'Seu depósito de R$ 50,00 foi aprovado!',
            timestamp: new Date(),
            read: false
          },
          {
            id: Date.now() + 1,
            type: 'game',
            title: 'Nova Partida',
            message: 'Uma nova partida está disponível!',
            timestamp: new Date(),
            read: false
          },
          {
            id: Date.now() + 2,
            type: 'withdrawal',
            title: 'Saque Processado',
            message: 'Seu saque de R$ 25,00 foi processado!',
            timestamp: new Date(),
            read: false
          }
        ];

        // 10% de chance de receber notificação
        if (Math.random() < 0.1) {
          const notification = randomNotifications[Math.floor(Math.random() * randomNotifications.length)];
          addNotification(notification);
        }
      }, 30000); // Verificar a cada 30 segundos

      return () => {
        clearInterval(interval);
        setIsConnected(false);
      };
    };

    const cleanup = connectWebSocket();
    return cleanup;
  }, []);

  // Adicionar notificação
  const addNotification = useCallback((notification) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
    
    // Mostrar toast
    toast.info(notification.message, {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  }, []);

  // Marcar notificação como lida
  const markAsRead = useCallback((notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // Marcar todas como lidas
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  }, []);

  // Remover notificação
  const removeNotification = useCallback((notificationId) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === notificationId);
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      return prev.filter(n => n.id !== notificationId);
    });
  }, []);

  // Limpar todas as notificações
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Obter notificações não lidas
  const getUnreadNotifications = useCallback(() => {
    return notifications.filter(notification => !notification.read);
  }, [notifications]);

  // Obter notificações por tipo
  const getNotificationsByType = useCallback((type) => {
    return notifications.filter(notification => notification.type === type);
  }, [notifications]);

  // Simular notificação de pagamento
  const notifyPayment = useCallback((amount, status) => {
    const message = status === 'approved' 
      ? `Seu depósito de R$ ${amount.toFixed(2)} foi aprovado!`
      : `Seu depósito de R$ ${amount.toFixed(2)} falhou.`;
    
    addNotification({
      id: Date.now(),
      type: 'payment',
      title: status === 'approved' ? 'Pagamento Aprovado' : 'Pagamento Falhou',
      message,
      timestamp: new Date(),
      read: false
    });
  }, [addNotification]);

  // Simular notificação de saque
  const notifyWithdrawal = useCallback((amount, status) => {
    const message = status === 'processed' 
      ? `Seu saque de R$ ${amount.toFixed(2)} foi processado!`
      : `Seu saque de R$ ${amount.toFixed(2)} falhou.`;
    
    addNotification({
      id: Date.now(),
      type: 'withdrawal',
      title: status === 'processed' ? 'Saque Processado' : 'Saque Falhou',
      message,
      timestamp: new Date(),
      read: false
    });
  }, [addNotification]);

  // Simular notificação de jogo
  const notifyGame = useCallback((message) => {
    addNotification({
      id: Date.now(),
      type: 'game',
      title: 'Nova Atividade no Jogo',
      message,
      timestamp: new Date(),
      read: false
    });
  }, [addNotification]);

  return {
    notifications,
    unreadCount,
    isConnected,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    getUnreadNotifications,
    getNotificationsByType,
    notifyPayment,
    notifyWithdrawal,
    notifyGame
  };
};

export default useNotifications;
