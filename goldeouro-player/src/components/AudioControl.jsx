// 🎵 COMPONENTE DE CONTROLE DE ÁUDIO - GOL DE OURO
// Componente reutilizável para controle de áudio em todas as páginas

import React, { useState, useEffect } from 'react';
import audioManager from '../utils/audioManager';
import musicManager from '../utils/musicManager';

const AudioControl = ({ className = '', showText = true }) => {
  const [audioEnabled, setAudioEnabled] = useState(true);

  useEffect(() => {
    // Verificar estado inicial do áudio
    setAudioEnabled(audioManager.isEnabled());
  }, []);

  const toggleAudio = () => {
    const newAudioState = !audioEnabled;
    setAudioEnabled(newAudioState);
    
    // Usar o audioManager para controlar o áudio
    if (newAudioState) {
      audioManager.resume(); // Resumir contexto de áudio
      audioManager.toggle(); // Ativar áudio
    } else {
      audioManager.toggle(); // Desativar áudio
    }
    
    // Controlar música de fundo
    if (newAudioState) {
      musicManager.resume();
    } else {
      musicManager.stopMusic();
    }
    
    // Aplicar controle de áudio global
    if (typeof window !== 'undefined') {
      const audioElements = document.querySelectorAll('audio, video');
      audioElements.forEach(el => {
        el.muted = !newAudioState;
        el.volume = newAudioState ? 0.5 : 0; // Volume fixo em 50%
      });
    }
  };

  return (
    <button 
      className={`audio-control-btn ${className}`}
      onClick={toggleAudio} 
      title={audioEnabled ? "Desativar Áudio" : "Ativar Áudio"}
    >
      <span className="btn-icon">{audioEnabled ? "🔊" : "🔇"}</span>
      {showText && (
        <span className="btn-text">
          {audioEnabled ? "Áudio" : "Mudo"}
        </span>
      )}
    </button>
  );
};

export default AudioControl;
