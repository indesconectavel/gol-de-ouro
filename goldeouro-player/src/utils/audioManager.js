// 🎵 SISTEMA DE ÁUDIO - GOL DE OURO
// Gerenciador de efeitos sonoros para o jogo

class AudioManager {
  constructor() {
    this.audioContext = null;
    this.sounds = {};
    this.masterVolume = 0.7;
    this.sfxVolume = 0.8;
    this.musicVolume = 0.5;
    this.enabled = true;
    
    this.init();
  }

  init() {
    try {
      // Criar contexto de áudio
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Criar sons programaticamente
      this.createSounds();
      
      console.log("🎵 AudioManager inicializado com sucesso!");
    } catch (error) {
      console.warn("⚠️ AudioManager não pôde ser inicializado:", error);
      this.enabled = false;
    }
  }

  createSounds() {
    // Som de chute
    this.sounds.kick = this.createKickSound();
    
    // Som de gol
    this.sounds.goal = this.createGoalSound();
    
    // Som de defesa
    this.sounds.save = this.createSaveSound();
    
    // Som de erro
    this.sounds.miss = this.createMissSound();
    
    // Som de interface
    this.sounds.click = this.createClickSound();
    
    // Som de vitória
    this.sounds.victory = this.createVictorySound();
    
    // Som de derrota
    this.sounds.defeat = this.createDefeatSound();
  }

  // Método para tocar som de chute com arquivo MP3
  playKickSound() {
    this.playAudioFile('/sounds/kick.mp3', 'kick');
  }

  // Método para tocar arquivos de áudio MP3
  playAudioFile(url, soundName) {
    if (!this.enabled) return;
    
    try {
      const audio = new Audio(url);
      audio.volume = this.sfxVolume * this.masterVolume;
      audio.play().catch(error => {
        console.warn(`Erro ao reproduzir arquivo de áudio ${url}:`, error);
      });
    } catch (error) {
      console.warn(`Erro ao criar áudio ${url}:`, error);
    }
  }

  createKickSound() {
    return () => {
      if (!this.enabled) return;
      
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.3);
      
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(this.sfxVolume * 0.3, this.audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.3);
    };
  }

  createGoalSound() {
    return () => {
      if (!this.enabled) return;
      
      // Som de gol com múltiplas frequências
      const frequencies = [440, 554, 659, 880]; // A, C#, E, A
      
      frequencies.forEach((freq, index) => {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime + index * 0.1);
        oscillator.frequency.exponentialRampToValueAtTime(freq * 1.5, this.audioContext.currentTime + index * 0.1 + 0.2);
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime + index * 0.1);
        gainNode.gain.linearRampToValueAtTime(this.sfxVolume * 0.4, this.audioContext.currentTime + index * 0.1 + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + index * 0.1 + 0.5);
        
        oscillator.start(this.audioContext.currentTime + index * 0.1);
        oscillator.stop(this.audioContext.currentTime + index * 0.1 + 0.5);
      });
    };
  }

  createSaveSound() {
    return () => {
      if (!this.enabled) return;
      
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(this.sfxVolume * 0.25, this.audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.2);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.2);
    };
  }

  createMissSound() {
    return () => {
      if (!this.enabled) return;
      
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.setValueAtTime(100, this.audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.3);
      
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(this.sfxVolume * 0.2, this.audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.3);
    };
  }

  createClickSound() {
    return () => {
      if (!this.enabled) return;
      
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(this.sfxVolume * 0.1, this.audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.1);
    };
  }

  createVictorySound() {
    return () => {
      if (!this.enabled) return;
      
      // Melodia de vitória
      const melody = [523, 659, 784, 1047]; // C, E, G, C
      
      melody.forEach((freq, index) => {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime + index * 0.15);
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime + index * 0.15);
        gainNode.gain.linearRampToValueAtTime(this.sfxVolume * 0.3, this.audioContext.currentTime + index * 0.15 + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + index * 0.15 + 0.3);
        
        oscillator.start(this.audioContext.currentTime + index * 0.15);
        oscillator.stop(this.audioContext.currentTime + index * 0.15 + 0.3);
      });
    };
  }

  createDefeatSound() {
    return () => {
      if (!this.enabled) return;
      
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.5);
      
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(this.sfxVolume * 0.2, this.audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.5);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.5);
    };
  }

  // Métodos públicos
  play(soundName) {
    if (this.sounds[soundName] && this.enabled) {
      try {
        this.sounds[soundName]();
      } catch (error) {
        console.warn(`Erro ao reproduzir som ${soundName}:`, error);
      }
    }
  }

  setMasterVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  setSfxVolume(volume) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
  }

  setMusicVolume(volume) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  enable() {
    this.enabled = true;
    console.log('🔊 AudioManager habilitado');
  }

  disable() {
    this.enabled = false;
    console.log('🔇 AudioManager desabilitado');
  }

  isEnabled() {
    return this.enabled;
  }

  // Resumir contexto de áudio (necessário para alguns navegadores)
  resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }
}

// Instância singleton
const audioManager = new AudioManager();

export default audioManager;
