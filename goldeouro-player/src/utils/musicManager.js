// 🎵 SISTEMA DE MÚSICA DE FUNDO - GOL DE OURO
// Gerenciador de música de fundo para diferentes páginas

class MusicManager {
  constructor() {
    this.audioContext = null;
    this.currentMusic = null;
    this.isPlaying = false;
    this.volume = 0.173; // Volume reduzido em mais 20% (de 0.216 para 0.173)
    this.enabled = true;
    
    this.init();
  }

  init() {
    try {
      // Criar contexto de áudio
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      console.log("🎵 MusicManager inicializado com sucesso!");
    } catch (error) {
      console.warn("⚠️ MusicManager não pôde ser inicializado:", error);
      this.enabled = false;
    }
  }

  // Tocar música de fundo do gameplay
  playGameplayMusic() {
    if (!this.enabled) return;
    
    // Parar música atual se estiver tocando
    this.stopMusic();
    
    // Aguardar um pouco para garantir que a música anterior parou
    setTimeout(() => {
      this.playAudioFile('/sounds/torcida_2.mp3', 'gameplay');
    }, 100);
  }

  // Tocar música de fundo das outras páginas
  playPageMusic() {
    if (!this.enabled) return;
    
    // Verificar se já está tocando a mesma música
    if (this.isPlaying && this.currentMusic && this.currentMusic.src.includes('music.mp3')) {
      console.log('🎵 Música de página já está tocando, evitando duplicação');
      return;
    }
    
    // Parar música atual se estiver tocando
    this.stopMusic();
    
    // Aguardar um pouco para garantir que a música anterior parou
    setTimeout(() => {
      this.playAudioFile('/sounds/music.mp3', 'page');
    }, 100);
  }

  // Tocar som de defesa
  playDefenseSound() {
    if (!this.enabled) return;
    
    this.playAudioFile('/sounds/defesa.mp3', 'defense');
  }

  // Método genérico para tocar arquivos de áudio
  playAudioFile(src, type) {
    try {
      const audio = new Audio(src);
      audio.volume = type === 'defense' ? 0.6 : this.volume;
      audio.loop = type !== 'defense';
      
      audio.addEventListener('canplaythrough', () => {
        if (type !== 'defense') {
          this.currentMusic = audio;
          this.isPlaying = true;
        }
        audio.play().catch(e => console.warn('Erro ao reproduzir áudio:', e));
      });

      audio.addEventListener('ended', () => {
        if (type === 'defense') {
          audio.remove();
        }
      });

      audio.addEventListener('error', (e) => {
        console.warn(`Erro ao carregar áudio ${src}:`, e);
        // Fallback para som programático se o arquivo não existir
        if (type === 'defense') {
          this.playDefenseFallback();
        }
      });

      audio.load();
    } catch (error) {
      console.warn(`Erro ao criar áudio ${src}:`, error);
      if (type === 'defense') {
        this.playDefenseFallback();
      }
    }
  }

  // Fallback para som de defesa (programático)
  playDefenseFallback() {
    if (!this.audioContext) return;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    // Som grave para defesa
    oscillator.frequency.setValueAtTime(120, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(80, this.audioContext.currentTime + 0.3);
    
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.3);
  }

  // Parar música atual
  stopMusic() {
    if (this.currentMusic) {
      this.currentMusic.pause();
      this.currentMusic.currentTime = 0;
      this.currentMusic = null;
      this.isPlaying = false;
    }
  }

  // Pausar música
  pauseMusic() {
    if (this.currentMusic && this.isPlaying) {
      this.currentMusic.pause();
      this.isPlaying = false;
    }
  }

  // Retomar música
  resumeMusic() {
    if (this.currentMusic && !this.isPlaying) {
      this.currentMusic.play().catch(e => console.warn('Erro ao retomar música:', e));
      this.isPlaying = true;
    }
  }

  // Definir volume
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.currentMusic) {
      this.currentMusic.volume = this.volume;
    }
  }

  // Ativar/desativar música
  toggle() {
    this.enabled = !this.enabled;
    if (!this.enabled) {
      this.stopMusic();
    }
    return this.enabled;
  }

  // Verificar se está tocando
  isMusicPlaying() {
    return this.isPlaying;
  }

  // Resumir contexto de áudio
  resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }
}

// Instância singleton
const musicManager = new MusicManager();

export default musicManager;
