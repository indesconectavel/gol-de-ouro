import React from 'react';

const AsyncWrapper = ({ 
  loading = false, 
  error = null, 
  empty = false, 
  emptyMessage = 'Nenhum item encontrado',
  children 
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
        <span className="ml-3 text-white">Carregando...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <div className="text-red-500 text-4xl mb-4">❌</div>
        <p className="text-red-300 mb-4">Erro ao carregar dados</p>
        <p className="text-gray-400 text-sm">{error.message}</p>
      </div>
    );
  }

  if (empty) {
    return (
      <div className="text-center p-8">
        <div className="text-gray-500 text-4xl mb-4">📭</div>
        <p className="text-gray-300">{emptyMessage}</p>
      </div>
    );
  }

  return children;
};

export default AsyncWrapper;
