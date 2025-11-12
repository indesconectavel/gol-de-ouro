import React from 'react';

const VersionBanner = ({ 
  version = "v1.2.0", 
  deployDate = "25/10/2025", 
  deployTime = "08:50",
  showTime = true,
  className = ""
}) => {
  // Preferir variáveis de ambiente (injetadas no build) quando disponíveis
  const envVersion = typeof import.meta !== 'undefined' ? (import.meta.env?.VITE_BUILD_VERSION || null) : null;
  const envDate = typeof import.meta !== 'undefined' ? (import.meta.env?.VITE_BUILD_DATE || null) : null;
  const envTime = typeof import.meta !== 'undefined' ? (import.meta.env?.VITE_BUILD_TIME || null) : null;

  const resolvedVersion = envVersion || version;
  const resolvedDate = envDate || deployDate || new Date().toLocaleDateString('pt-BR');
  const resolvedTime = envTime || deployTime;

  const currentTime = new Date().toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo'
  });

  return (
    <div className={`fixed top-0 left-0 right-0 bg-green-600 text-white text-center py-2 text-sm font-bold z-50 shadow-lg ${className}`}>
      <div className="flex items-center justify-center space-x-2">
        <span>🚀</span>
        <span>VERSÃO ATUALIZADA {resolvedVersion}</span>
        <span>•</span>
        <span>DEPLOY REALIZADO EM {resolvedDate}</span>
        {showTime && (
          <>
            <span>•</span>
            <span>HORÁRIO: {resolvedTime}</span>
            <span>•</span>
            <span>ACESSO: {currentTime}</span>
          </>
        )}
      </div>
    </div>
  );
};

export default VersionBanner;
 
