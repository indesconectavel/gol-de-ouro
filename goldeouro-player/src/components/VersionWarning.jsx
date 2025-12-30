// Componente para exibir aviso de versão
import { useState, useEffect } from 'react';
import versionService from '../services/versionService';

const VersionWarning = () => {
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [versionInfo, setVersionInfo] = useState(null);

  useEffect(() => {
    // Verificar compatibilidade ao montar o componente
    checkVersionCompatibility();
    
    // Iniciar verificação periódica
    versionService.startPeriodicCheck();
    
    // Verificar periodicamente se há avisos (usando método correto)
    const interval = setInterval(async () => {
      try {
        const result = await versionService.checkCompatibility();
        if (result && !result.compatible) {
          setShowWarning(true);
          setWarningMessage(result.warningMessage || 'Versão incompatível detectada');
          setVersionInfo(result);
        } else {
          setShowWarning(false);
          setWarningMessage('');
        }
      } catch (error) {
        // Silenciar erro - não é crítico
        console.debug('Erro ao verificar versão:', error);
      }
    }, 60000); // Verificar a cada 1 minuto em vez de 1 segundo

    return () => {
      clearInterval(interval);
      versionService.stopPeriodicCheck();
    };
  }, []);

  const checkVersionCompatibility = async () => {
    try {
      const result = await versionService.checkCompatibility();
      
      if (result.warningMessage) {
        setShowWarning(true);
        setWarningMessage(result.warningMessage);
        setVersionInfo(result);
      } else {
        setShowWarning(false);
        setWarningMessage('');
      }
    } catch (error) {
      console.error('Erro ao verificar compatibilidade:', error);
    }
  };

  const handleDismiss = () => {
    setShowWarning(false);
  };

  const handleUpdate = () => {
    // Redirecionar para página de atualização ou recarregar
    window.location.reload();
  };

  if (!showWarning) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <div className="bg-yellow-500/90 backdrop-blur-sm border border-yellow-400 rounded-lg p-4 shadow-lg">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <span className="text-yellow-800 text-xl">⚠️</span>
          </div>
          
          <div className="flex-1">
            <h3 className="text-sm font-medium text-yellow-800 mb-1">
              Aviso de Versão
            </h3>
            
            <p className="text-sm text-yellow-700 mb-3">
              {warningMessage}
            </p>
            
            {versionInfo && (
              <div className="text-xs text-yellow-600 mb-3">
                <p>Versão atual: {versionInfo.currentVersion}</p>
                <p>Versão mínima: {versionInfo.minRequiredVersion}</p>
              </div>
            )}
            
            <div className="flex space-x-2">
              <button
                onClick={handleUpdate}
                className="text-xs bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded transition-colors"
              >
                Atualizar
              </button>
              
              <button
                onClick={handleDismiss}
                className="text-xs bg-yellow-400 hover:bg-yellow-500 text-yellow-800 px-3 py-1 rounded transition-colors"
              >
                Ignorar
              </button>
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-yellow-600 hover:text-yellow-800 transition-colors"
          >
            <span className="sr-only">Fechar</span>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default VersionWarning;

