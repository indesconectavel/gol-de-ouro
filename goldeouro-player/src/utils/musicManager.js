// 🎵 SISTEMA DE MÚSICA DE FUNDO - GOL DE OURO
// Gerenciador de música de fundo para diferentes páginas

class MusicManager {
  constructor() {
    this.audioContext = null;
    this.currentMusic = null;
    this.isPlaying = false;
    this.volume = 0.173; // Volume reduzido em mais 20% (de 0.216 para 0.173)
    this.enabled = true;
    this.playRequestId = 0;
    this.pendingStartTimer = null;
    
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
    const requestId = ++this.playRequestId;
    
    // Aguardar um pouco para garantir que a música anterior parou
    this.pendingStartTimer = setTimeout(() => {
      if (!this.isRequestValid(requestId)) return;
      this.playAudioFile('/sounds/torcida_2.mp3', 'gameplay', requestId);
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
    const requestId = ++this.playRequestId;
    
    // Aguardar um pouco para garantir que a música anterior parou
    this.pendingStartTimer = setTimeout(() => {
      if (!this.isRequestValid(requestId)) return;
      this.playAudioFile('/sounds/music.mp3', 'page', requestId);
    }, 100);
  }

  // Tocar som de defesa
  playDefenseSound() {
    if (!this.enabled) return;
    
    this.playAudioFile('/sounds/defesa.mp3', 'defense');
  }

  isRequestValid(requestId) {
    return requestId == null || requestId === this.playRequestId;
  }

  // Método genérico para tocar arquivos de áudio
  async playAudioFile(src, type, requestId = null) {
    try {
      // Verificar se o arquivo existe antes de tentar carregar
      const fileExists = await this.checkAudioFileExists(src);
      if (!this.isRequestValid(requestId)) return;
      if (!fileExists) {
        console.warn(`⚠️ Arquivo de áudio não encontrado: ${src}`);
        if (type === 'defense') {
          this.playDefenseFallback();
        } else if (type === 'page') {
          this.playPageMusicFallback();
        }
        return;
      }

      const audio = new Audio(src);
      audio.volume = type === 'defense' ? 0.6 : this.volume;
      audio.loop = type !== 'defense';
      
      // Timeout para carregamento
      const loadTimeout = setTimeout(() => {
        if (!this.isRequestValid(requestId)) return;
        console.warn(`⏰ Timeout ao carregar áudio: ${src}`);
        if (type === 'defense') {
          this.playDefenseFallback();
        } else if (type === 'page') {
          this.playPageMusicFallback();
        }
      }, 5000); // 5 segundos timeout
      
      audio.addEventListener('canplaythrough', () => {
        clearTimeout(loadTimeout);
        if (!this.isRequestValid(requestId)) {
          audio.pause();
          return;
        }
        if (type !== 'defense') {
          this.currentMusic = audio;
          this.isPlaying = true;
          if (this.pendingStartTimer) {
            clearTimeout(this.pendingStartTimer);
            this.pendingStartTimer = null;
          }
        }
        audio.play().catch(e => {
          console.warn('Erro ao reproduzir áudio:', e);
          if (type === 'defense') {
            this.playDefenseFallback();
          } else if (type === 'page') {
            this.playPageMusicFallback();
          }
        });
      });

      audio.addEventListener('ended', () => {
        clearTimeout(loadTimeout);
        if (type === 'defense') {
          audio.remove();
        }
      });

      audio.addEventListener('error', (e) => {
        clearTimeout(loadTimeout);
        if (!this.isRequestValid(requestId)) return;
        console.warn(`❌ Erro ao carregar áudio ${src}:`, e);
        // Fallback para som programático se o arquivo não existir
        if (type === 'defense') {
          this.playDefenseFallback();
        } else if (type === 'page') {
          this.playPageMusicFallback();
        }
      });

      // Adicionar listener para timeout de carregamento
      audio.addEventListener('loadstart', () => {
        console.log(`🎵 Iniciando carregamento de áudio: ${src}`);
      });

      audio.addEventListener('loadeddata', () => {
        console.log(`🎵 Dados de áudio carregados: ${src}`);
      });

      audio.load();
    } catch (error) {
      console.warn(`❌ Erro ao criar áudio ${src}:`, error);
      if (type === 'defense') {
        this.playDefenseFallback();
      } else if (type === 'page') {
        this.playPageMusicFallback();
      }
    }
  }

  // Verificar se arquivo de áudio existe - CORREÇÃO ULTRA ROBUSTA
  async checkAudioFileExists(src) {
    // CORREÇÃO CRÍTICA: Verificar se já foi testado nesta sessão
    const sessionKey = `audio_checked_${src}`;
    const alreadyChecked = sessionStorage.getItem(sessionKey);
    
    if (alreadyChecked === 'true') {
      return true;
    }
    
    if (alreadyChecked === 'false') {
      return false;
    }

    try {
      // Usar GET em vez de HEAD para arquivos de áudio
      const response = await fetch(src, { 
        method: 'GET',
        cache: 'no-cache',
        headers: {
          'Range': 'bytes=0-1' // Apenas os primeiros bytes
        }
      });
      
      const exists = response.ok || response.status === 206; // 206 = Partial Content
      sessionStorage.setItem(sessionKey, exists.toString());
      return exists;
    } catch (error) {
      console.warn(`⚠️ Erro ao verificar arquivo de áudio ${src}:`, error);
      sessionStorage.setItem(sessionKey, 'false');
      return false;
    }
  }

  // Fallback para música de página (programático)
  playPageMusicFallback() {
    if (!this.audioContext) return;
    
    console.log('🎵 Usando música de fundo sintética como fallback');
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    // Melodia suave para música de fundo
    oscillator.frequency.setValueAtTime(220, this.audioContext.currentTime);
    oscillator.frequency.setValueAtTime(330, this.audioContext.currentTime + 2);
    oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime + 4);
    
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, this.audioContext.currentTime + 0.1);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 6);
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
    this.playRequestId += 1;
    if (this.pendingStartTimer) {
      clearTimeout(this.pendingStartTimer);
      this.pendingStartTimer = null;
    }
    if (this.currentMusic) {
      this.currentMusic.pause();
      this.currentMusic.currentTime = 0;
      this.currentMusic = null;
    }
    this.isPlaying = false;
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
