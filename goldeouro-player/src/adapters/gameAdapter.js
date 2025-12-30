// Adaptador de Jogo
// CRI-006: Validação de saldo antes de chute
// CRI-005: Tratamento de lote completo/encerrado
// Gol de Ouro Player - Engine V19 Integration
// Data: 18/12/2025

import apiClient from '../services/apiClient';
import dataAdapter from './dataAdapter';
import errorAdapter from './errorAdapter';
import authAdapter from './authAdapter';

/**
 * Adaptador para lógica de jogo
 * Valida saldo antes de permitir chute
 * Trata lotes completos/encerrados automaticamente
 * SEM alterar a UI - apenas gerencia lógica de jogo
 */
class GameAdapter {
  constructor() {
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 segundo
  }

  /**
   * Validar saldo antes de permitir chute
   * CRI-006: Garantir que usuário tenha saldo suficiente
   */
  async validateShot(amount) {
    try {
      // Obter token válido (renovado se necessário)
      const token = await authAdapter.getValidToken();
      if (!token) {
        return {
          valid: false,
          error: 'Sessão expirada. Faça login novamente.',
          requiresAuth: true
        };
      }

      // Buscar perfil do usuário para obter saldo atual
      const response = await apiClient.get('/api/user/profile', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const normalizedResponse = dataAdapter.normalizeResponse(response);
      
      if (!normalizedResponse.success || !normalizedResponse.data) {
        return {
          valid: false,
          error: 'Erro ao validar saldo. Tente novamente.',
          saldo: 0
        };
      }

      const userData = dataAdapter.normalizeUser(normalizedResponse.data);
      const saldo = userData?.saldo || 0;

      if (saldo < amount) {
        return {
          valid: false,
          error: `Saldo insuficiente. Você tem R$ ${saldo.toFixed(2)} e precisa de R$ ${amount.toFixed(2)}.`,
          saldo
        };
      }

      return {
        valid: true,
        saldo
      };
    } catch (error) {
      errorAdapter.logError(error, { context: 'validateShot' });
      
      // Se é erro de autenticação, indicar que precisa fazer login
      if (errorAdapter.requiresAuth(error)) {
        return {
          valid: false,
          error: 'Sessão expirada. Faça login novamente.',
          requiresAuth: true
        };
      }

      return {
        valid: false,
        error: errorAdapter.getUserMessage(error),
        saldo: 0
      };
    }
  }

  /**
   * Processar chute com validação e tratamento de lotes
   * CRI-006: Valida saldo antes de chutar
   * CRI-005: Trata lotes completos/encerrados
   */
  async processShot(direction, amount) {
    // Validar saldo primeiro
    const validation = await this.validateShot(amount);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
        saldo: validation.saldo,
        requiresAuth: validation.requiresAuth || false
      };
    }

    // Tentar processar chute com retry em caso de lote completo/encerrado
    return await this._processShotWithRetry(direction, amount, 0);
  }

  /**
   * Processar chute com retry automático para lotes completos/encerrados
   */
  async _processShotWithRetry(direction, amount, retryCount) {
    try {
      const response = await apiClient.post('/api/games/shoot', {
        direction,
        amount
      });

      const normalizedResponse = dataAdapter.normalizeResponse(response);

      if (!normalizedResponse.success) {
        // Verificar se é erro de lote completo/encerrado
        const errorMessage = normalizedResponse.message || '';
        
        if (errorMessage.includes('Lote completo') || 
            errorMessage.includes('Lote encerrado') ||
            errorMessage.includes('lote completo') ||
            errorMessage.includes('lote encerrado')) {
          
          // Se ainda não excedeu tentativas, retentar
          if (retryCount < this.maxRetries) {
            if (import.meta.env.DEV) {
              console.log(`🔄 [GameAdapter] Lote completo/encerrado, retentando (${retryCount + 1}/${this.maxRetries})...`);
            }
            
            // Aguardar antes de retentar
            await new Promise(resolve => setTimeout(resolve, this.retryDelay));
            
            // Retentar processamento (novo lote será criado automaticamente pelo backend)
            return await this._processShotWithRetry(direction, amount, retryCount + 1);
          } else {
            return {
              success: false,
              error: 'Não foi possível processar o chute. Tente novamente em alguns instantes.',
              isLoteIssue: true
            };
          }
        }

        // Outro tipo de erro
        return {
          success: false,
          error: normalizedResponse.message || 'Erro ao processar chute'
        };
      }

      // Sucesso - normalizar dados do resultado
      const gameData = dataAdapter.normalizeGameResult(normalizedResponse.data);

      return {
        success: true,
        data: {
          result: gameData.result,
          premio: gameData.premio,
          premioGolDeOuro: gameData.premioGolDeOuro,
          loteProgress: gameData.loteProgress,
          novoSaldo: gameData.novoSaldo,
          contadorGlobal: gameData.contadorGlobal,
          isGolDeOuro: gameData.isGolDeOuro,
          shotsUntilGoldenGoal: gameData.shotsUntilGoldenGoal,
          isLoteComplete: normalizedResponse.data?.isLoteComplete || false
        }
      };
    } catch (error) {
      errorAdapter.logError(error, { context: 'processShot', retryCount });

      // Se é erro de rede, pode ser que backend esteja offline
      const classification = errorAdapter.classifyError(error);
      if (classification.type === 'network' && retryCount < this.maxRetries) {
        // Aguardar antes de retentar
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * (retryCount + 1)));
        
        return await this._processShotWithRetry(direction, amount, retryCount + 1);
      }

      return {
        success: false,
        error: errorAdapter.getUserMessage(error),
        requiresAuth: errorAdapter.requiresAuth(error)
      };
    }
  }

  /**
   * Obter métricas globais (sempre do backend)
   * CRI-004: Usar contador global do backend, nunca calcular localmente
   */
  async getGlobalMetrics() {
    try {
      const response = await apiClient.get('/api/metrics');
      const normalizedResponse = dataAdapter.normalizeResponse(response);

      if (!normalizedResponse.success) {
        return {
          success: false,
          error: normalizedResponse.message || 'Erro ao carregar métricas'
        };
      }

      const metrics = dataAdapter.normalizeGlobalMetrics(normalizedResponse.data);

      return {
        success: true,
        data: {
          contadorGlobal: metrics.contadorGlobal,
          ultimoGolDeOuro: metrics.ultimoGolDeOuro,
          shotsUntilGoldenGoal: metrics.shotsUntilGoldenGoal
        }
      };
    } catch (error) {
      errorAdapter.logError(error, { context: 'getGlobalMetrics' });
      
      return {
        success: false,
        error: errorAdapter.getUserMessage(error)
      };
    }
  }

  /**
   * Obter status do jogo atual
   */
  async getGameStatus() {
    try {
      const response = await apiClient.get('/api/games/status');
      const normalizedResponse = dataAdapter.normalizeResponse(response);

      if (!normalizedResponse.success) {
        return {
          success: false,
          error: normalizedResponse.message || 'Erro ao carregar status do jogo'
        };
      }

      return {
        success: true,
        data: dataAdapter.normalizeData(normalizedResponse.data)
      };
    } catch (error) {
      errorAdapter.logError(error, { context: 'getGameStatus' });
      
      return {
        success: false,
        error: errorAdapter.getUserMessage(error)
      };
    }
  }
}

export default new GameAdapter();

