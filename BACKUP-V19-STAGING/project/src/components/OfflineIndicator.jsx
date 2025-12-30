import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePWA } from '../hooks/usePWA';

const OfflineIndicator = () => {
  const { isOnline } = usePWA();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white py-2 px-4 text-center"
        >
          <div className="flex items-center justify-center space-x-2">
            <span className="text-lg">📡</span>
            <span className="font-medium">Sem conexão com a internet</span>
            <span className="text-sm opacity-75">Algumas funcionalidades podem estar limitadas</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineIndicator;
