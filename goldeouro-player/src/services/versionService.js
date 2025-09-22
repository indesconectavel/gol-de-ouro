// Serviço de verificação de versão (handshake)
import apiClient from './apiClient';
import { validateEnvironment } from '../config/environments';

const env = validateEnvironment();

class VersionService {
  constructor() {
    this.currentVersion = '1.0.0'; // Versão atual do cliente
    this.minRequiredVersion = env.MIN_CLIENT_VERSION || '1.0.0';
    this.checkInterval = 300000; // 5 minutos
    this.lastCheck = null;
    this.isCompatible = true;
    this.warningMessage = null;
  }

  // Verificar compatibilidade com o backend
  async checkCompatibility() {
    try {
      console.log('[VersionService] Verificando compatibilidade de versão...');
      
      // Fazer requisição para o endpoint de versão do backend
      const response = await apiClient.get('/meta', {
        timeout: 10000
      });

      const backendInfo = response.data;
      
      if (backendInfo.minClientVersion) {
        this.minRequiredVersion = backendInfo.minClientVersion;
        this.isCompatible = this.isVersionCompatible(this.currentVersion, this.minRequiredVersion);
        
        if (!this.isCompatible) {
          this.warningMessage = `Versão do cliente (${this.currentVersion}) é menor que a versão mínima exigida (${this.minRequiredVersion}). Algumas funcionalidades podem não funcionar corretamente.`;
          console.warn('[VersionService]', this.warningMessage);
        } else {
          this.warningMessage = null;
          console.log('[VersionService] Versão compatível');
        }
      }

      this.lastCheck = new Date();
      
      return {
        isCompatible: this.isCompatible,
        currentVersion: this.currentVersion,
        minRequiredVersion: this.minRequiredVersion,
        warningMessage: this.warningMessage,
        backendInfo: backendInfo
      };

    } catch (error) {
      console.error('[VersionService] Erro ao verificar compatibilidade:', error);
      
      // Em caso de erro, assumir compatibilidade para não bloquear o usuário
      this.isCompatible = true;
      this.warningMessage = null;
      
      return {
        isCompatible: true,
        currentVersion: this.currentVersion,
        minRequiredVersion: this.minRequiredVersion,
        warningMessage: null,
        error: error.message
      };
    }
  }

  // Verificar se a versão atual é compatível com a versão mínima
  isVersionCompatible(currentVersion, minVersion) {
    try {
      const current = this.parseVersion(currentVersion);
      const minimum = this.parseVersion(minVersion);
      
      // Comparar versões (major.minor.patch)
      if (current.major > minimum.major) return true;
      if (current.major < minimum.major) return false;
      
      if (current.minor > minimum.minor) return true;
      if (current.minor < minimum.minor) return false;
      
      return current.patch >= minimum.patch;
    } catch (error) {
      console.error('[VersionService] Erro ao comparar versões:', error);
      return true; // Em caso de erro, assumir compatibilidade
    }
  }

  // Parsear versão no formato semver
  parseVersion(version) {
    const parts = version.split('.').map(Number);
    return {
      major: parts[0] || 0,
      minor: parts[1] || 0,
      patch: parts[2] || 0
    };
  }

  // Iniciar verificação periódica de versão
  startPeriodicCheck() {
    // Verificar imediatamente
    this.checkCompatibility();
    
    // Configurar verificação periódica
    setInterval(() => {
      this.checkCompatibility();
    }, this.checkInterval);
  }

  // Obter informações de versão
  getVersionInfo() {
    return {
      currentVersion: this.currentVersion,
      minRequiredVersion: this.minRequiredVersion,
      isCompatible: this.isCompatible,
      warningMessage: this.warningMessage,
      lastCheck: this.lastCheck
    };
  }

  // Verificar se há aviso de versão
  hasWarning() {
    return !this.isCompatible && this.warningMessage;
  }

  // Obter mensagem de aviso
  getWarningMessage() {
    return this.warningMessage;
  }

  // Verificar se deve mostrar aviso (não bloquear, apenas avisar)
  shouldShowWarning() {
    return this.hasWarning();
  }
}

// Exportar instância única
const versionService = new VersionService();
export default versionService;

