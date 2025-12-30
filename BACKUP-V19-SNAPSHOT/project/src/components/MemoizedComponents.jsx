import React, { memo, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';

// Componente de card memoizado
export const MemoizedCard = memo(({ 
  title, 
  value, 
  icon, 
  color = 'blue',
  className = '' 
}) => {
  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    yellow: 'bg-yellow-600',
    red: 'bg-red-600',
    purple: 'bg-purple-600'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${colorClasses[color]} rounded-lg p-4 text-white ${className}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium opacity-90">{title}</h3>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <div className="text-3xl opacity-80">{icon}</div>
      </div>
    </motion.div>
  );
});

MemoizedCard.displayName = 'MemoizedCard';

// Componente de botão memoizado
export const MemoizedButton = memo(({ 
  children, 
  onClick, 
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  ...props 
}) => {
  const baseClasses = 'font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-yellow-500 hover:bg-yellow-600 text-black focus:ring-yellow-500',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const disabledClasses = disabled || loading ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.05 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.95 }}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`}
      {...props}
    >
      {loading ? 'Carregando...' : children}
    </motion.button>
  );
});

MemoizedButton.displayName = 'MemoizedButton';

// Componente de lista memoizada
export const MemoizedList = memo(({ 
  items, 
  renderItem, 
  keyExtractor,
  className = '',
  emptyMessage = 'Nenhum item encontrado'
}) => {
  const memoizedItems = useMemo(() => {
    return items.map((item, index) => ({
      key: keyExtractor ? keyExtractor(item, index) : index,
      item,
      index
    }));
  }, [items, keyExtractor]);

  if (items.length === 0) {
    return (
      <div className={`text-center text-gray-500 py-8 ${className}`}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={className}>
      {memoizedItems.map(({ key, item, index }) => (
        <div key={key}>
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
});

MemoizedList.displayName = 'MemoizedList';

// Hook para memoizar dados pesados
export const useMemoizedData = (data, dependencies = []) => {
  return useMemo(() => {
    // Aqui você pode adicionar lógica de processamento pesado
    return data;
  }, dependencies);
};

// Hook para memoizar callbacks
export const useMemoizedCallback = (callback, dependencies = []) => {
  return useCallback(callback, dependencies);
};

// Componente de estatística memoizada
export const MemoizedStatCard = memo(({ 
  title, 
  value, 
  change, 
  changeType = 'neutral',
  icon,
  className = '' 
}) => {
  const changeColor = {
    positive: 'text-green-400',
    negative: 'text-red-400',
    neutral: 'text-gray-400'
  };

  const changeIcon = {
    positive: '↗️',
    negative: '↘️',
    neutral: '→'
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-[#1A202C] rounded-lg p-4 border border-gray-700 ${className}`}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-400">{title}</h3>
        {icon && <span className="text-xl">{icon}</span>}
      </div>
      
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      
      {change && (
        <div className={`text-sm flex items-center ${changeColor[changeType]}`}>
          <span className="mr-1">{changeIcon[changeType]}</span>
          {change}
        </div>
      )}
    </motion.div>
  );
});

MemoizedStatCard.displayName = 'MemoizedStatCard';
