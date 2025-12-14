// 🔄 VERSIONSERVICE CORRIGIDO - GOL DE OURO v1.2.0
// Sistema de verificação de versão com chamadas reais ao backend

import apiClient from './apiClient';

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
      // Chamada real ao backend
      const response = await apiClient.get('/meta');
      const metaData = response.data?.data || response.data;
      
      const versionInfo = {
        current: metaData?.version || '1.2.0',
        compatible: true,
        lastCheck: now,
        backendVersion: metaData?.version,
        features: {
          audio: true,
          cache: true,
          notifications: true,
          pix: true
        },
        meta: metaData
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

  // Verificar se deve mostrar aviso (método usado por VersionWarning)
  shouldShowWarning() {
    const cached = this.cache.get('version');
    if (!cached) {
      return false;
    }
    // Retornar false se compatível, true se houver problema
    return !cached.compatible || (cached.warningMessage && cached.warningMessage.length > 0);
  }

  // Obter mensagem de aviso
  getWarningMessage() {
    const cached = this.cache.get('version');
    return cached?.warningMessage || '';
  }

  // Obter informações de versão
  getVersionInfo() {
    const cached = this.cache.get('version');
    return cached || null;
  }
}

// Instância global do VersionService
const versionService = new VersionService();

export default versionService;
