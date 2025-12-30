import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePWA } from '../hooks/usePWA';
import useSound from '../hooks/useSound';

const PWAInstallPrompt = () => {
  const { isInstallable, isInstalled, installApp, updateAvailable, updateApp } = usePWA();
  const { sounds } = useSound();
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Mostrar prompt se instalável e não foi dispensado
    if (isInstallable && !isInstalled && !dismissed) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000); // Mostrar após 3 segundos

      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled, dismissed]);

  const handleInstall = async () => {
    sounds.buttonClick();
    const success = await installApp();
    if (success) {
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    sounds.buttonClick();
    setShowPrompt(false);
    setDismissed(true);
    // Salvar no localStorage para não mostrar novamente
    localStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  const handleUpdate = async () => {
    sounds.buttonClick();
    await updateApp();
  };

  // Verificar se foi dispensado anteriormente
  useEffect(() => {
    const wasDismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (wasDismissed) {
      setDismissed(true);
    }
  }, []);

  // Não mostrar se já instalado ou dispensado
  if (isInstalled || dismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto"
        >
          <div className="bg-[#1A202C] border border-yellow-400 rounded-lg p-4 shadow-xl">
            <div className="flex items-start space-x-3">
              {/* Ícone */}
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-yellow-400 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📱</span>
                </div>
              </div>

              {/* Conteúdo */}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-white mb-1">
                  Instalar Gol de Ouro
                </h3>
                <p className="text-sm text-gray-300 mb-3">
                  Instale o app para uma experiência mais rápida e acesso offline!
                </p>

                {/* Botões */}
                <div className="flex space-x-2">
                  <motion.button
                    onClick={handleInstall}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-4 rounded text-sm transition-colors"
                  >
                    📱 Instalar
                  </motion.button>
                  
                  <motion.button
                    onClick={handleDismiss}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded text-sm transition-colors"
                  >
                    ✕
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Prompt de atualização */}
      {updateAvailable && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed top-4 left-4 right-4 z-50 max-w-md mx-auto"
        >
          <div className="bg-green-600 border border-green-500 rounded-lg p-4 shadow-xl">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <span className="text-2xl">🔄</span>
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-1">
                  Atualização Disponível
                </h3>
                <p className="text-sm text-green-100 mb-3">
                  Uma nova versão do app está disponível!
                </p>
                
                <motion.button
                  onClick={handleUpdate}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-white hover:bg-gray-100 text-green-600 font-bold py-2 px-4 rounded text-sm transition-colors"
                >
                  🔄 Atualizar Agora
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PWAInstallPrompt;
