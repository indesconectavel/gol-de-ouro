// Componente de mensagem de erro
import React from 'react';

const ErrorMessage = ({ message, onRetry, className = '' }) => {
  return (
    <div className={`bg-red-500/20 border border-red-500/50 rounded-lg p-6 text-center ${className}`}>
      <div className="flex flex-col items-center space-y-4">
        <div className="text-red-400 text-4xl">❌</div>
        <div>
          <h3 className="text-red-300 text-lg font-semibold mb-2">Erro</h3>
          <p className="text-red-200 text-sm">{message}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
          >
            Tentar Novamente
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;

