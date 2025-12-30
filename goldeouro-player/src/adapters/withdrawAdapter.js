// Adaptador de Saques
// CRI-008: Validação de saldo antes de saque
// Gol de Ouro Player - Engine V19 Integration
// Data: 18/12/2025

import apiClient from '../services/apiClient';
import dataAdapter from './dataAdapter';
import errorAdapter from './errorAdapter';
import authAdapter from './authAdapter';

/**
 * Adaptador para saques
 * Valida saldo antes de permitir saque
 * SEM alterar a UI - apenas gerencia lógica de saques
 */
class WithdrawAdapter {
  constructor() {
    this.minWithdrawAmount = 10.00; // Valor mínimo de saque (pode ser configurável)
    this.maxWithdrawAmount = 10000.00; // Valor máximo de saque (pode ser configurável)
  }

  /**
   * Validar saldo antes de permitir saque
   * CRI-008: Garantir que usuário tenha saldo suficiente
   */
  async validateWithdraw(amount, pixKey, pixType = 'CPF') {
    // Validações básicas
    if (!amount || amount <= 0) {
      return {
        valid: false,
        error: 'Valor de saque inválido.'
      };
    }

    if (amount < this.minWithdrawAmount) {
      return {
        valid: false,
        error: `Valor mínimo de saque é R$ ${this.minWithdrawAmount.toFixed(2)}.`
      };
    }

    if (amount > this.maxWithdrawAmount) {
      return {
        valid: false,
        error: `Valor máximo de saque é R$ ${this.maxWithdrawAmount.toFixed(2)}.`
      };
    }

    if (!pixKey || pixKey.trim() === '') {
      return {
        valid: false,
        error: 'Chave PIX é obrigatória.'
      };
    }

    try {
      // Obter token válido
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
      errorAdapter.logError(error, { context: 'validateWithdraw' });
      
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
   * Criar solicitação de saque
   * CRI-008: Valida saldo antes de criar saque
   */
  async createWithdraw(amount, pixKey, pixType = 'CPF') {
    // Validar saldo primeiro
    const validation = await this.validateWithdraw(amount, pixKey, pixType);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
        saldo: validation.saldo,
        requiresAuth: validation.requiresAuth || false
      };
    }

    try {
      const token = await authAdapter.getValidToken();
      if (!token) {
        return {
          success: false,
          error: 'Sessão expirada. Faça login novamente.',
          requiresAuth: true
        };
      }

      const response = await apiClient.post('/api/withdraw', {
        amount,
        pixKey,
        pixType
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const normalizedResponse = dataAdapter.normalizeResponse(response);

      if (!normalizedResponse.success) {
        return {
          success: false,
          error: normalizedResponse.message || 'Erro ao criar solicitação de saque'
        };
      }

      const withdrawData = normalizedResponse.data;

      return {
        success: true,
        data: {
          withdrawId: withdrawData.withdraw_id || withdrawData.id,
          amount: withdrawData.amount || amount,
          pixKey: withdrawData.pix_key || pixKey,
          pixType: withdrawData.pix_type || pixType,
          status: withdrawData.status || 'pending',
          createdAt: withdrawData.created_at || withdrawData.createdAt,
          novoSaldo: withdrawData.novo_saldo || withdrawData.novoSaldo
        }
      };
    } catch (error) {
      errorAdapter.logError(error, { context: 'createWithdraw' });
      
      return {
        success: false,
        error: errorAdapter.getUserMessage(error),
        requiresAuth: errorAdapter.requiresAuth(error)
      };
    }
  }

  /**
   * Obter histórico de saques
   */
  async getWithdrawHistory() {
    try {
      const token = await authAdapter.getValidToken();
      if (!token) {
        return {
          success: false,
          error: 'Sessão expirada. Faça login novamente.',
          requiresAuth: true
        };
      }

      // Nota: Endpoint de histórico pode não existir ainda
      // Por enquanto, retornar array vazio
      // TODO: Implementar quando endpoint estiver disponível
      return {
        success: true,
        data: []
      };
    } catch (error) {
      errorAdapter.logError(error, { context: 'getWithdrawHistory' });
      
      return {
        success: false,
        error: errorAdapter.getUserMessage(error),
        requiresAuth: errorAdapter.requiresAuth(error)
      };
    }
  }

  /**
   * Obter saldo atual do usuário
   */
  async getCurrentBalance() {
    try {
      const token = await authAdapter.getValidToken();
      if (!token) {
        return {
          success: false,
          error: 'Sessão expirada. Faça login novamente.',
          requiresAuth: true
        };
      }

      const response = await apiClient.get('/api/user/profile', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const normalizedResponse = dataAdapter.normalizeResponse(response);
      
      if (!normalizedResponse.success || !normalizedResponse.data) {
        return {
          success: false,
          error: 'Erro ao carregar saldo.',
          balance: 0
        };
      }

      const userData = dataAdapter.normalizeUser(normalizedResponse.data);
      const balance = userData?.saldo || 0;

      return {
        success: true,
        balance
      };
    } catch (error) {
      errorAdapter.logError(error, { context: 'getCurrentBalance' });
      
      return {
        success: false,
        error: errorAdapter.getUserMessage(error),
        balance: 0,
        requiresAuth: errorAdapter.requiresAuth(error)
      };
    }
  }
}

export default new WithdrawAdapter();

