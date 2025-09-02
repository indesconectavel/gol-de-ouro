import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useSound from '../hooks/useSound';

// Componente de notificação toast
export const ToastNotification = ({ 
  message, 
  type = 'info', 
  duration = 3000, 
  onClose,
  show = true 
}) => {
  const [isVisible, setIsVisible] = useState(show);
  const { sounds } = useSound();

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      sounds.notification();
      
      if (duration > 0) {
        const timer = setTimeout(() => {
          setIsVisible(false);
          setTimeout(() => onClose?.(), 300);
        }, duration);
        
        return () => clearTimeout(timer);
      }
    }
  }, [show, duration, onClose, sounds]);

  const typeStyles = {
    success: 'bg-green-600 border-green-500 text-white',
    error: 'bg-red-600 border-red-500 text-white',
    warning: 'bg-yellow-600 border-yellow-500 text-black',
    info: 'bg-blue-600 border-blue-500 text-white',
    golden: 'bg-gradient-to-r from-yellow-400 to-yellow-600 border-yellow-400 text-black'
  };

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
    golden: '🏆'
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.8 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg border shadow-lg max-w-sm ${typeStyles[type]}`}
        >
          <div className="flex items-center space-x-3">
            <span className="text-xl">{icons[type]}</span>
            <span className="font-medium">{message}</span>
            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(() => onClose?.(), 300);
              }}
              className="ml-2 text-current opacity-70 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Componente de notificação de gol
export const GoalNotification = ({ 
  isGoldenGoal = false, 
  playerName = "Jogador",
  show = false,
  onClose 
}) => {
  const [isVisible, setIsVisible] = useState(show);
  const { sounds } = useSound();

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      if (isGoldenGoal) {
        sounds.goldenGoal();
      } else {
        sounds.goal();
      }
      
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose?.(), 1000);
      }, 4000);
      
      return () => clearTimeout(timer);
    }
  }, [show, isGoldenGoal, onClose, sounds]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        >
          <motion.div
            className={`p-8 rounded-2xl text-center ${
              isGoldenGoal 
                ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black' 
                : 'bg-gradient-to-r from-green-500 to-green-600 text-white'
            }`}
            animate={{
              scale: [1, 1.05, 1],
              rotate: [0, 2, -2, 0]
            }}
            transition={{
              duration: 0.6,
              repeat: 3,
              ease: "easeInOut"
            }}
          >
            <motion.div
              className="text-8xl mb-4"
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 360]
              }}
              transition={{
                duration: 1,
                ease: "easeInOut"
              }}
            >
              {isGoldenGoal ? '🏆' : '⚽'}
            </motion.div>
            
            <motion.h2
              className="text-4xl font-bold mb-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {isGoldenGoal ? 'GOL DE OURO!' : 'GOL!'}
            </motion.h2>
            
            <motion.p
              className="text-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {playerName} marcou!
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Componente de notificação de fila
export const QueueNotification = ({ 
  message, 
  type = 'join',
  show = false,
  onClose 
}) => {
  const [isVisible, setIsVisible] = useState(show);
  const { sounds } = useSound();

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      if (type === 'join') {
        sounds.queueJoin();
      } else {
        sounds.queueLeave();
      }
      
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose?.(), 300);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [show, type, onClose, sounds]);

  const typeStyles = {
    join: 'bg-green-600 text-white',
    leave: 'bg-red-600 text-white',
    full: 'bg-yellow-600 text-black'
  };

  const icons = {
    join: '👥',
    leave: '🚪',
    full: '⚠️'
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={`fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg ${typeStyles[type]}`}
        >
          <div className="flex items-center space-x-3">
            <span className="text-xl">{icons[type]}</span>
            <span className="font-medium">{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Hook para gerenciar notificações
export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (notification) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { ...notification, id }]);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const showToast = (message, type = 'info', duration = 3000) => {
    addNotification({
      type: 'toast',
      message,
      toastType: type,
      duration,
      show: true
    });
  };

  const showGoal = (isGoldenGoal = false, playerName = "Jogador") => {
    addNotification({
      type: 'goal',
      isGoldenGoal,
      playerName,
      show: true
    });
  };

  const showQueue = (message, type = 'join') => {
    addNotification({
      type: 'queue',
      message,
      queueType: type,
      show: true
    });
  };

  return {
    notifications,
    showToast,
    showGoal,
    showQueue,
    removeNotification
  };
};