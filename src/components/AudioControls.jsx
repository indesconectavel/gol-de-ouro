import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useSound from '../hooks/useSound';

const AudioControls = () => {
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [showControls, setShowControls] = useState(false);
  const { setVolume, sounds } = useSound();

  // Carregar preferências do localStorage
  useEffect(() => {
    const savedMuted = localStorage.getItem('audio-muted');
    const savedVolume = localStorage.getItem('audio-volume');
    
    if (savedMuted !== null) {
      setIsMuted(JSON.parse(savedMuted));
    }
    if (savedVolume !== null) {
      const vol = parseFloat(savedVolume);
      setVolume(vol);
      setVolume(vol);
    }
  }, [setVolume]);

  // Salvar preferências no localStorage
  useEffect(() => {
    localStorage.setItem('audio-muted', JSON.stringify(isMuted));
    localStorage.setItem('audio-volume', volume.toString());
  }, [isMuted, volume]);

  // Atualizar volume quando mudar
  useEffect(() => {
    setVolume(isMuted ? 0 : volume);
  }, [isMuted, volume, setVolume]);

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (!isMuted) {
      sounds.buttonClick();
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const testSound = () => {
    sounds.notification();
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Botão principal */}
      <motion.button
        onClick={() => setShowControls(!showControls)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="bg-yellow-400 hover:bg-yellow-500 text-black p-3 rounded-full shadow-lg transition-colors"
        title="Controles de Áudio"
      >
        <motion.div
          animate={{ 
            scale: isMuted ? 0.8 : 1,
            opacity: isMuted ? 0.5 : 1 
          }}
          transition={{ duration: 0.2 }}
        >
          {isMuted ? '🔇' : '🔊'}
        </motion.div>
      </motion.button>

      {/* Painel de controles */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-16 right-0 bg-[#1A202C] border border-gray-700 rounded-lg p-4 shadow-xl min-w-[200px]"
          >
            <div className="space-y-3">
              {/* Título */}
              <h3 className="text-white font-bold text-sm">🎵 Controles de Áudio</h3>
              
              {/* Botão de mute */}
              <div className="flex items-center justify-between">
                <span className="text-white text-sm">Som:</span>
                <motion.button
                  onClick={toggleMute}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    isMuted 
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {isMuted ? '🔇 Mutado' : '🔊 Ativo'}
                </motion.button>
              </div>

              {/* Controle de volume */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-white text-sm">Volume:</span>
                  <span className="text-yellow-400 text-sm font-bold">
                    {Math.round(volume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #FCD34D 0%, #FCD34D ${(isMuted ? 0 : volume) * 100}%, #374151 ${(isMuted ? 0 : volume) * 100}%, #374151 100%)`
                  }}
                />
              </div>

              {/* Botão de teste */}
              <motion.button
                onClick={testSound}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-sm font-medium transition-colors"
              >
                🎵 Testar Som
              </motion.button>

              {/* Informações */}
              <div className="text-xs text-gray-400 text-center">
                Sons: Gol, Erro, Gol de Ouro, Interface
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Estilos para o slider */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #FCD34D;
          cursor: pointer;
          border: 2px solid #1A202C;
        }
        
        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #FCD34D;
          cursor: pointer;
          border: 2px solid #1A202C;
        }
      `}</style>
    </div>
  );
};

export default AudioControls;
