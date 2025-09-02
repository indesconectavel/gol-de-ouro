import { useRef, useCallback } from 'react';

const useSound = () => {
  const audioRefs = useRef({});

  // Função para carregar e tocar um som
  const playSound = useCallback((soundName, volume = 0.7) => {
    try {
      // Se o áudio já foi carregado, apenas toca
      if (audioRefs.current[soundName]) {
        audioRefs.current[soundName].currentTime = 0;
        audioRefs.current[soundName].volume = volume;
        audioRefs.current[soundName].play().catch(console.warn);
        return;
      }

      // Carrega o áudio pela primeira vez
      const audio = new Audio(`/sounds/${soundName}.mp3`);
      audio.volume = volume;
      audio.preload = 'auto';
      
      // Armazena a referência
      audioRefs.current[soundName] = audio;
      
      // Toca o som
      audio.play().catch(console.warn);
    } catch (error) {
      console.warn(`Erro ao tocar som ${soundName}:`, error);
    }
  }, []);

  // Função para parar um som
  const stopSound = useCallback((soundName) => {
    if (audioRefs.current[soundName]) {
      audioRefs.current[soundName].pause();
      audioRefs.current[soundName].currentTime = 0;
    }
  }, []);

  // Função para parar todos os sons
  const stopAllSounds = useCallback(() => {
    Object.values(audioRefs.current).forEach(audio => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
  }, []);

  // Função para definir volume global
  const setVolume = useCallback((volume) => {
    Object.values(audioRefs.current).forEach(audio => {
      if (audio) {
        audio.volume = Math.max(0, Math.min(1, volume));
      }
    });
  }, []);

  // Sons específicos do jogo
  const sounds = {
    // Sons de resultado
    goal: () => playSound('goal', 0.8),
    miss: () => playSound('miss', 0.6),
    goldenGoal: () => playSound('golden-goal', 0.9),
    
    // Sons de interface
    buttonClick: () => playSound('button-click', 0.5),
    buttonHover: () => playSound('button-hover', 0.3),
    notification: () => playSound('notification', 0.6),
    
    // Sons de jogo
    queueJoin: () => playSound('queue-join', 0.7),
    queueLeave: () => playSound('queue-leave', 0.5),
    gameStart: () => playSound('game-start', 0.8),
    gameEnd: () => playSound('game-end', 0.7),
    
    // Sons de animação
    ballKick: () => playSound('ball-kick', 0.7),
    goalkeeperSave: () => playSound('goalkeeper-save', 0.6),
    crowdCheer: () => playSound('crowd-cheer', 0.8),
    crowdDisappoint: () => playSound('crowd-disappoint', 0.5),
  };

  return {
    playSound,
    stopSound,
    stopAllSounds,
    setVolume,
    sounds
  };
};

export default useSound;
