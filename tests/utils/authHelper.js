// Utilitário de Autenticação para Testes
// FASE 2.5 - Testes Automatizados

const axios = require('axios');
const testConfig = require('../config/testConfig');

/**
 * Helper para autenticação em testes
 * FASE 2.5.1 - Singleton com cache de tokens para evitar rate limit
 * Cria tokens de teste de forma idempotente
 */
class AuthHelper {
  constructor() {
    this.baseURL = testConfig.staging.baseURL;
    this.tokens = {
      player: null,
      admin: null,
      refreshToken: null,
      playerExpiresAt: null,
      adminExpiresAt: null
    };
    this.loginInProgress = {
      player: false,
      admin: false
    };
  }

  /**
   * Verificar se token está válido (não expirado)
   * Assumindo tokens JWT com expiração de 24h
   */
  isTokenValid(token, expiresAt) {
    if (!token) return false;
    if (!expiresAt) return true; // Se não tem timestamp, assumir válido
    return Date.now() < expiresAt;
  }

  /**
   * Fazer login como player
   * FASE 2.5.1 - Login único com cache para evitar rate limit
   * Retorna token JWT
   */
  async loginPlayer(email = null, password = null, force = false) {
    // Se já tem token válido e não é forçado, retornar token existente
    if (!force && this.tokens.player && this.isTokenValid(this.tokens.player, this.tokens.playerExpiresAt)) {
      if (testConfig.verbose) {
        console.log('♻️ [AuthHelper] Reutilizando token player existente');
      }
      return {
        success: true,
        token: this.tokens.player,
        refreshToken: this.tokens.refreshToken,
        cached: true
      };
    }

    // Evitar múltiplos logins simultâneos
    if (this.loginInProgress.player) {
      // Aguardar login em progresso
      let attempts = 0;
      while (this.loginInProgress.player && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      if (this.tokens.player && this.isTokenValid(this.tokens.player, this.tokens.playerExpiresAt)) {
        return {
          success: true,
          token: this.tokens.player,
          refreshToken: this.tokens.refreshToken,
          cached: true
        };
      }
    }

    this.loginInProgress.player = true;

    try {
      // Tentar carregar credenciais do arquivo .env se disponível
      let playerEmail = email || testConfig.testCredentials.player.email;
      let playerPassword = password || testConfig.testCredentials.player.password;

      // Se não especificado, tentar variáveis de ambiente
      if (!email && process.env.TEST_PLAYER_EMAIL) {
        playerEmail = process.env.TEST_PLAYER_EMAIL;
      }
      if (!password && process.env.TEST_PLAYER_PASSWORD) {
        playerPassword = process.env.TEST_PLAYER_PASSWORD;
      }

      const credentials = {
        email: playerEmail,
        password: playerPassword
      };

      const response = await axios.post(
        `${this.baseURL}/api/auth/login`,
        credentials,
        {
          timeout: testConfig.timeouts.api,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data && response.data.success) {
        // Backend retorna token diretamente em response.data.token ou response.data.accessToken
        const token = response.data.token || response.data.accessToken || response.data.data?.token;
        const refreshToken = response.data.refreshToken || response.data.data?.refreshToken;
        const user = response.data.user || response.data.data?.user;
        
        // Armazenar token com timestamp de expiração (24h = 86400000ms)
        this.tokens.player = token;
        this.tokens.refreshToken = refreshToken;
        this.tokens.playerExpiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 horas
        
        if (testConfig.verbose) {
          console.log('✅ [AuthHelper] Login player bem-sucedido (novo token)');
        }

        return {
          success: true,
          token: token,
          refreshToken: refreshToken,
          user: user,
          cached: false
        };
      }

      return {
        success: false,
        error: 'Resposta inválida do servidor'
      };
    } catch (error) {
      if (testConfig.verbose) {
        console.error('❌ [AuthHelper] Erro no login player:', error.message);
      }

      return {
        success: false,
        error: error.response?.data?.message || error.message,
        status: error.response?.status
      };
    } finally {
      this.loginInProgress.player = false;
    }
  }

  /**
   * Fazer login como admin
   * Retorna token admin
   */
  async loginAdmin(email = null, password = null) {
    try {
      // Tentar carregar credenciais do arquivo .env se disponível
      let adminEmail = email || testConfig.testCredentials.admin.email;
      let adminPassword = password || testConfig.testCredentials.admin.password;

      // Se não especificado, tentar variáveis de ambiente
      if (!email && process.env.TEST_ADMIN_EMAIL) {
        adminEmail = process.env.TEST_ADMIN_EMAIL;
      }
      if (!password && process.env.TEST_ADMIN_PASSWORD) {
        adminPassword = process.env.TEST_ADMIN_PASSWORD;
      }

      const credentials = {
        email: adminEmail,
        password: adminPassword
      };

      const response = await axios.post(
        `${this.baseURL}/api/auth/login`,
        credentials,
        {
          timeout: testConfig.timeouts.api,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data && response.data.success) {
        this.tokens.admin = response.data.data.token;
        
        if (testConfig.verbose) {
          console.log('✅ [AuthHelper] Login admin bem-sucedido');
        }

        return {
          success: true,
          token: response.data.data.token,
          user: response.data.data.user
        };
      }

      return {
        success: false,
        error: 'Resposta inválida do servidor'
      };
    } catch (error) {
      if (testConfig.verbose) {
        console.error('❌ [AuthHelper] Erro no login admin:', error.message);
      }

      return {
        success: false,
        error: error.response?.data?.message || error.message,
        status: error.response?.status
      };
    }
  }

  /**
   * Obter token de player (faz login se necessário)
   * FASE 2.5.1 - Usa cache para evitar múltiplos logins
   */
  async getPlayerToken(force = false) {
    // Verificar se token existe e está válido
    if (!force && this.tokens.player && this.isTokenValid(this.tokens.player, this.tokens.playerExpiresAt)) {
      return this.tokens.player;
    }

    // Fazer login se necessário
    const result = await this.loginPlayer(null, null, force);
    return result.success ? result.token : null;
  }

  /**
   * Obter token de admin (faz login se necessário)
   */
  async getAdminToken() {
    if (this.tokens.admin) {
      return this.tokens.admin;
    }

    const result = await this.loginAdmin();
    return result.success ? result.token : null;
  }

  /**
   * Testar refresh token
   */
  async testRefreshToken(refreshToken = null) {
    try {
      const token = refreshToken || this.tokens.refreshToken;
      
      if (!token) {
        return {
          success: false,
          error: 'Refresh token não disponível'
        };
      }

      const response = await axios.post(
        `${this.baseURL}/api/auth/refresh`,
        { refreshToken: token },
        {
          timeout: testConfig.timeouts.api,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data && response.data.success) {
        this.tokens.player = response.data.data.token;
        this.tokens.refreshToken = response.data.data.refreshToken;

        if (testConfig.verbose) {
          console.log('✅ [AuthHelper] Refresh token bem-sucedido');
        }

        return {
          success: true,
          token: response.data.data.token,
          refreshToken: response.data.data.refreshToken
        };
      }

      return {
        success: false,
        error: 'Resposta inválida do servidor'
      };
    } catch (error) {
      if (testConfig.verbose) {
        console.error('❌ [AuthHelper] Erro no refresh token:', error.message);
      }

      return {
        success: false,
        error: error.response?.data?.message || error.message,
        status: error.response?.status
      };
    }
  }

  /**
   * Limpar tokens (para testes isolados)
   */
  clearTokens() {
    this.tokens = {
      player: null,
      admin: null,
      refreshToken: null
    };
  }
}

module.exports = new AuthHelper();

