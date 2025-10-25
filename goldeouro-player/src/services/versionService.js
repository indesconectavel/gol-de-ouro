// 🔄 VERSIONSERVICE OTIMIZADO - GOL DE OURO v1.2.0
// Sistema de verificação de versão com cache para evitar chamadas duplicadas

class VersionService {
  constructor() {
    this.cache = new Map();
    this.lastCheck = 0;
    this.cacheDuration = 60000; // 1 minuto
    this.isChecking = false;
  }

  // Verificar compatibilidade de versão com cache
  async checkVersionCompatibility() {
    const now = Date.now();
    
    // Verificar cache
    if (this.cache.has('version') && (now - this.lastCheck) < this.cacheDuration) {
      const cached = this.cache.get('version');
      console.log('📦 [VersionService] Usando dados do cache');
      return cached;
    }

    // Evitar múltiplas verificações simultâneas
    if (this.isChecking) {
      console.log('⏳ [VersionService] Verificação já em andamento, aguardando...');
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (!this.isChecking && this.cache.has('version')) {
            clearInterval(checkInterval);
            resolve(this.cache.get('version'));
          }
        }, 100);
      });
    }

    this.isChecking = true;
    console.log('🔄 [VersionService] Verificando compatibilidade de versão...');

    try {
      // Simular verificação de versão (pode ser substituído por chamada real)
      const versionInfo = {
        current: '1.2.0',
        compatible: true,
        lastCheck: now,
        features: {
          audio: true,
          cache: true,
          notifications: true
        }
      };

      // Armazenar no cache
      this.cache.set('version', versionInfo);
      this.lastCheck = now;
      
      console.log('✅ [VersionService] Compatibilidade verificada:', versionInfo);
      return versionInfo;

    } catch (error) {
      console.error('❌ [VersionService] Erro na verificação:', error);
      return {
        current: '1.2.0',
        compatible: true,
        error: error.message,
        lastCheck: now
      };
    } finally {
      this.isChecking = false;
    }
  }

  // Limpar cache
  clearCache() {
    this.cache.clear();
    this.lastCheck = 0;
    console.log('🧹 [VersionService] Cache limpo');
  }

  // Obter estatísticas do cache
  getCacheStats() {
    return {
      hasCache: this.cache.has('version'),
      lastCheck: this.lastCheck,
      cacheAge: Date.now() - this.lastCheck,
      isChecking: this.isChecking
    };
  }

  // Método de compatibilidade (alias para checkVersionCompatibility)
  async checkCompatibility() {
    return await this.checkVersionCompatibility();
  }

  // Iniciar verificação periódica
  startPeriodicCheck(interval = 300000) { // 5 minutos por padrão
    if (this.periodicCheckInterval) {
      clearInterval(this.periodicCheckInterval);
    }
    
    this.periodicCheckInterval = setInterval(async () => {
      try {
        await this.checkVersionCompatibility();
        console.log('🔄 [VersionService] Verificação periódica executada');
      } catch (error) {
        console.error('❌ [VersionService] Erro na verificação periódica:', error);
      }
    }, interval);
    
    console.log(`🔄 [VersionService] Verificação periódica iniciada (${interval}ms)`);
  }

  // Parar verificação periódica
  stopPeriodicCheck() {
    if (this.periodicCheckInterval) {
      clearInterval(this.periodicCheckInterval);
      this.periodicCheckInterval = null;
      console.log('⏹️ [VersionService] Verificação periódica parada');
    }
  }
}

// Instância global do VersionService
const versionService = new VersionService();

export default versionService;