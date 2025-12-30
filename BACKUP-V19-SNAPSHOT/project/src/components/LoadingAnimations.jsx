import React from 'react';
import { motion } from 'framer-motion';

// Loading spinner animado
export const LoadingSpinner = ({ size = 'md', color = 'yellow' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const colorClasses = {
    yellow: 'border-yellow-400',
    white: 'border-white',
    blue: 'border-blue-400',
    green: 'border-green-400'
  };

  return (
    <motion.div
      className={`${sizeClasses[size]} ${colorClasses[color]} border-4 border-t-transparent rounded-full`}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: "linear"
      }}
    />
  );
};

// Loading com pontos pulsantes
export const LoadingDots = ({ color = 'yellow' }) => {
  const colorClasses = {
    yellow: 'bg-yellow-400',
    white: 'bg-white',
    blue: 'bg-blue-400',
    green: 'bg-green-400'
  };

  return (
    <div className="flex space-x-2">
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className={`w-3 h-3 ${colorClasses[color]} rounded-full`}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: index * 0.2,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
};

// Loading com barra de progresso
export const LoadingBar = ({ progress = 0, color = 'yellow' }) => {
  const colorClasses = {
    yellow: 'bg-yellow-400',
    white: 'bg-white',
    blue: 'bg-blue-400',
    green: 'bg-green-400'
  };

  return (
    <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
      <motion.div
        className={`h-full ${colorClasses[color]} rounded-full`}
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      />
    </div>
  );
};

// Loading com texto animado
export const LoadingText = ({ text = "Carregando...", color = 'white' }) => {
  const colorClasses = {
    white: 'text-white',
    yellow: 'text-yellow-400',
    blue: 'text-blue-400',
    green: 'text-green-400'
  };

  return (
    <motion.div
      className={`${colorClasses[color]} font-medium`}
      animate={{
        opacity: [0.5, 1, 0.5]
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      {text}
    </motion.div>
  );
};

// Loading completo com spinner e texto
export const LoadingComplete = ({ 
  text = "Carregando...", 
  size = 'md', 
  spinnerColor = 'yellow',
  textColor = 'white',
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
      <LoadingSpinner size={size} color={spinnerColor} />
      <LoadingText text={text} color={textColor} />
    </div>
  );
};

// Loading para botões
export const ButtonLoading = ({ text = "Carregando...", className = '' }) => {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <LoadingSpinner size="sm" color="white" />
      <span className="text-sm">{text}</span>
    </div>
  );
};

// Loading com animação de futebol
export const FootballLoading = () => {
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <motion.div
        className="text-6xl"
        animate={{
          rotate: [0, 360],
          scale: [1, 1.1, 1]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        ⚽
      </motion.div>
      <LoadingText text="Preparando o jogo..." color="yellow" />
    </div>
  );
};

// Loading com animação de gol
export const GoalLoading = () => {
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <motion.div
        className="text-6xl"
        animate={{
          scale: [1, 1.3, 1],
          rotate: [0, 10, -10, 0]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        🥅
      </motion.div>
      <LoadingText text="Processando resultado..." color="yellow" />
    </div>
  );
};
