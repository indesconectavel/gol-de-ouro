import React from 'react';

const VersionBanner = ({ 
  version = "v1.2.0", 
  deployDate = "25/10/2025", 
  deployTime = "08:50",
  showTime = true,
  className = ""
}) => {
  const currentTime = new Date().toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo'
  });

  return (
    <div className={`fixed top-0 left-0 right-0 bg-green-600 text-white text-center py-2 text-sm font-bold z-50 shadow-lg ${className}`}>
      <div className="flex items-center justify-center space-x-2">
        <span>🚀</span>
        <span>VERSÃO ATUALIZADA {version}</span>
        <span>•</span>
        <span>DEPLOY REALIZADO EM {deployDate}</span>
        {showTime && (
          <>
            <span>•</span>
            <span>HORÁRIO: {deployTime}</span>
            <span>•</span>
            <span>ACESSO: {currentTime}</span>
          </>
        )}
      </div>
    </div>
  );
};

export default VersionBanner;

