// Componente de estado vazio
import React from 'react';

const EmptyState = ({ 
  title = "Nenhum item encontrado", 
  description = "Não há dados para exibir no momento.",
  icon = "📭",
  action = null,
  className = '' 
}) => {
  return (
    <div className={`bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-8 text-center ${className}`}>
      <div className="flex flex-col items-center space-y-4">
        <div className="text-4xl opacity-60">{icon}</div>
        <div>
          <h3 className="text-white/80 text-lg font-semibold mb-2">{title}</h3>
          <p className="text-white/60 text-sm">{description}</p>
        </div>
        {action && (
          <div className="mt-4">
            {action}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmptyState;

