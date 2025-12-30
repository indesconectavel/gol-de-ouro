// Adaptador de Autenticação
// CRI-001: Migrar token para armazenamento seguro (localStorage → futuro SecureStore)
// CRI-002: Implementar renovação automática de token
// Gol de Ouro Player - Engine V19 Integration
// Data: 18/12/2025

import apiClient from '../services/apiClient';
import errorAdapter from './errorAdapter';

/**
 * Adaptador para gerenciamento seguro de autenticação
 * Migra gradualmente de localStorage para armazenamento seguro
 * Implementa renovação automática de token
 * SEM alterar a UI - apenas gerencia tokens de forma segura
 */
class AuthAdapter {
  constructor() {
    this.tokenKey = 'authToken';
    this.refreshTokenKey = 'refreshToken';
    this.userDataKey = 'userData';
    this.tokenExpiryKey = 'tokenExpiry';
    
    // Flag para evitar múltiplas renovações simultâneas
    this.isRefreshing = false;
    this.refreshPromise = null;

    // Inicializar renovação automática
    this.initializeAutoRefresh();
  }

  /**
   * Obter token do armazenamento
   * Por enquanto usa localStorage, mas preparado para migração futura
   */
  getToken() {
    try {
      return localStorage.getItem(this.tokenKey);
    } catch (error) {
      console.error('❌ [AuthAdapter] Erro ao obter token:', error);
      return null;
    }
  }

  /**
   * Obter refresh token
   */
  getRefreshToken() {
    try {
      return localStorage.getItem(this.refreshTokenKey);
    } catch (error) {
      console.error('❌ [AuthAdapter] Erro ao obter refresh token:', error);
      return null;
    }
  }

  /**
   * Armazenar token de forma segura
   * Por enquanto usa localStorage, mas preparado para migração futura
   */
  setToken(token, expiresIn = 3600) {
    try {
      localStorage.setItem(this.tokenKey, token);
      
      // Calcular e armazenar expiração
      const expiry = Date.now() + (expiresIn * 1000);
      localStorage.setItem(this.tokenExpiryKey, expiry.toString());

      // Em desenvolvimento, logar (sem expor token completo)
      if (import.meta.env.DEV) {
        console.log('✅ [AuthAdapter] Token armazenado (expira em', expiresIn, 'segundos)');
      }
    } catch (error) {
      console.error('❌ [AuthAdapter] Erro ao armazenar token:', error);
      throw error;
    }
  }

  /**
   * Armazenar refresh token
   */
  setRefreshToken(refreshToken) {
    try {
      localStorage.setItem(this.refreshTokenKey, refreshToken);
      
      if (import.meta.env.DEV) {
        console.log('✅ [AuthAdapter] Refresh token armazenado');
      }
    } catch (error) {
      console.error('❌ [AuthAdapter] Erro ao armazenar refresh token:', error);
      throw error;
    }
  }

  /**
   * Remover tokens
   */
  clearTokens() {
    try {
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.refreshTokenKey);
      localStorage.removeItem(this.userDataKey);
      localStorage.removeItem(this.tokenExpiryKey);
      
      if (import.meta.env.DEV) {
        console.log('✅ [AuthAdapter] Tokens removidos');
      }
    } catch (error) {
      console.error('❌ [AuthAdapter] Erro ao remover tokens:', error);
    }
  }

  /**
   * Verificar se token está expirado
   */
  isTokenExpired() {
    try {
      const expiry = localStorage.getItem(this.tokenExpiryKey);
      if (!expiry) {
        return true; // Se não tem expiração, considerar expirado
      }

      const expiryTime = parseInt(expiry, 10);
      const now = Date.now();
      
      // Considerar expirado se faltam menos de 5 minutos
      const bufferTime = 5 * 60 * 1000; // 5 minutos
      return (now + bufferTime) >= expiryTime;
    } catch (error) {
      console.error('❌ [AuthAdapter] Erro ao verificar expiração:', error);
      return true; // Em caso de erro, considerar expirado
    }
  }

  /**
   * Renovar token usando refresh token
   */
  async refreshToken() {
    // Evitar múltiplas renovações simultâneas
    if (this.isRefreshing) {
      return this.refreshPromise;
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return {
        success: false,
        error: 'Refresh token não encontrado'
      };
    }

    this.isRefreshing = true;
    this.refreshPromise = this._performRefresh(refreshToken);

    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  /**
   * Executar renovação de token
   */
  async _performRefresh(refreshToken) {
    try {
      const response = await apiClient.post('/api/auth/refresh', {
        refreshToken
      });

      if (response.data && response.data.success) {
        // FASE 2.6: Aceitar múltiplas estruturas de resposta
        // Backend pode retornar:
        // - response.data.token (compatibilidade)
        // - response.data.accessToken (novo formato)
        // - response.data.data.token (estrutura aninhada)
        // - response.data.data.accessToken (estrutura aninhada)
        const token = response.data.token || 
                      response.data.accessToken || 
                      response.data.data?.token ||
                      response.data.data?.accessToken;

        // Refresh token novo (se fornecido)
        const newRefreshToken = response.data.refreshToken || 
                                response.data.data?.refreshToken;

        if (!token) {
          if (import.meta.env.DEV) {
            console.error('❌ [AuthAdapter] Token não encontrado na resposta:', response.data);
          }
          return {
            success: false,
            error: 'Token não encontrado na resposta do servidor'
          };
        }

        // Armazenar novos tokens
        this.setToken(token, 3600); // 1 hora
        if (newRefreshToken) {
          this.setRefreshToken(newRefreshToken);
        }

        if (import.meta.env.DEV) {
          console.log('✅ [AuthAdapter] Token renovado com sucesso');
        }

        return {
          success: true,
          token
        };
      }

      return {
        success: false,
        error: 'Resposta inválida do servidor'
      };
    } catch (error) {
      errorAdapter.logError(error, { context: 'refreshToken' });
      
      // Log detalhado para debug (apenas em desenvolvimento)
      if (import.meta.env.DEV) {
        console.error('❌ [AuthAdapter] Erro ao renovar token:', {
          status: error.response?.status,
          message: error.response?.data?.message || error.message,
          url: error.config?.url
        });
      }
      
      // Se refresh token é inválido, limpar tudo
      if (error.response?.status === 401) {
        this.clearTokens();
        
        // Emitir evento para UI reagir (sem alterar UI diretamente)
        window.dispatchEvent(new CustomEvent('auth:token-expired'));
      }

      return {
        success: false,
        error: errorAdapter.getUserMessage(error)
      };
    }
  }

  /**
   * Obter token válido (renovando se necessário)
   */
  async getValidToken() {
    const token = this.getToken();
    
    if (!token) {
      return null;
    }

    // Se token está expirado ou próximo de expirar, renovar
    if (this.isTokenExpired()) {
      const refreshResult = await this.refreshToken();
      if (refreshResult.success) {
        return refreshResult.token;
      }
      return null; // Se não conseguiu renovar, retornar null
    }

    return token;
  }

  /**
   * Inicializar renovação automática
   * Verifica periodicamente se token precisa ser renovado
   */
  initializeAutoRefresh() {
    // Verificar a cada 5 minutos se token precisa ser renovado
    setInterval(async () => {
      const token = this.getToken();
      if (token && this.isTokenExpired()) {
        if (import.meta.env.DEV) {
          console.log('🔄 [AuthAdapter] Renovando token automaticamente...');
        }
        await this.refreshToken();
      }
    }, 5 * 60 * 1000); // 5 minutos

    // Verificar imediatamente ao carregar
    if (this.getToken() && this.isTokenExpired()) {
      this.refreshToken().catch(error => {
        console.error('❌ [AuthAdapter] Erro na renovação automática inicial:', error);
      });
    }
  }

  /**
   * Validar token (verificar se é válido no servidor)
   */
  async validateToken() {
    const token = this.getToken();
    if (!token) {
      return {
        valid: false,
        error: 'Token não encontrado'
      };
    }

    try {
      const response = await apiClient.get('/api/user/profile', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data && response.data.success) {
        return {
          valid: true,
          user: response.data.data
        };
      }

      return {
        valid: false,
        error: 'Token inválido'
      };
    } catch (error) {
      errorAdapter.logError(error, { context: 'validateToken' });
      
      // Se é 401, token é inválido
      if (error.response?.status === 401) {
        return {
          valid: false,
          error: 'Token inválido ou expirado'
        };
      }

      return {
        valid: false,
        error: errorAdapter.getUserMessage(error)
      };
    }
  }
}

export default new AuthAdapter();

