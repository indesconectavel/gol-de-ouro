// Adaptador de Pagamentos PIX
// CRI-007: Polling automático de status PIX
// Gol de Ouro Player - Engine V19 Integration
// Data: 18/12/2025

import apiClient from '../services/apiClient';
import dataAdapter from './dataAdapter';
import errorAdapter from './errorAdapter';
import authAdapter from './authAdapter';

/**
 * Adaptador para pagamentos PIX
 * Implementa polling automático de status
 * SEM alterar a UI - apenas gerencia lógica de pagamentos
 */
class PaymentAdapter {
  constructor() {
    this.pollingIntervals = new Map(); // Armazenar intervalos de polling ativos
    this.defaultPollInterval = 5000; // 5 segundos
    this.maxPollAttempts = 120; // Máximo 10 minutos (120 * 5s)
    this.pollBackoffMultiplier = 1.2; // Aumentar intervalo gradualmente
  }

  /**
   * Criar pagamento PIX
   */
  async createPayment(amount) {
    try {
      const token = await authAdapter.getValidToken();
      if (!token) {
        return {
          success: false,
          error: 'Sessão expirada. Faça login novamente.',
          requiresAuth: true
        };
      }

      const response = await apiClient.post('/api/payments/pix/criar', {
        amount
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const normalizedResponse = dataAdapter.normalizeResponse(response);

      if (!normalizedResponse.success) {
        return {
          success: false,
          error: normalizedResponse.message || 'Erro ao criar pagamento PIX'
        };
      }

      const paymentData = normalizedResponse.data;

      // Iniciar polling automático do status
      this.startPolling(paymentData.payment_id || paymentData.id);

      return {
        success: true,
        data: {
          paymentId: paymentData.payment_id || paymentData.id,
          qrCode: paymentData.qr_code || paymentData.qrCode,
          qrCodeBase64: paymentData.qr_code_base64 || paymentData.qrCodeBase64,
          pixKey: paymentData.pix_key || paymentData.pixKey,
          amount: paymentData.amount || amount,
          expiresAt: paymentData.expires_at || paymentData.expiresAt,
          status: paymentData.status || 'pending'
        }
      };
    } catch (error) {
      errorAdapter.logError(error, { context: 'createPayment' });
      
      return {
        success: false,
        error: errorAdapter.getUserMessage(error),
        requiresAuth: errorAdapter.requiresAuth(error)
      };
    }
  }

  /**
   * Verificar status do pagamento PIX
   */
  async checkPaymentStatus(paymentId) {
    try {
      const token = await authAdapter.getValidToken();
      if (!token) {
        return {
          success: false,
          error: 'Sessão expirada. Faça login novamente.',
          requiresAuth: true
        };
      }

      const response = await apiClient.get(`/api/payments/pix/status`, {
        params: { paymentId },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const normalizedResponse = dataAdapter.normalizeResponse(response);

      if (!normalizedResponse.success) {
        return {
          success: false,
          error: normalizedResponse.message || 'Erro ao verificar status do pagamento'
        };
      }

      const statusData = normalizedResponse.data;

      return {
        success: true,
        data: {
          paymentId: statusData.payment_id || statusData.id || paymentId,
          status: statusData.status || 'pending',
          amount: statusData.amount || 0,
          paidAt: statusData.paid_at || statusData.paidAt,
          expiresAt: statusData.expires_at || statusData.expiresAt
        }
      };
    } catch (error) {
      errorAdapter.logError(error, { context: 'checkPaymentStatus' });
      
      return {
        success: false,
        error: errorAdapter.getUserMessage(error),
        requiresAuth: errorAdapter.requiresAuth(error)
      };
    }
  }

  /**
   * Iniciar polling automático de status
   * CRI-007: Polling automático para atualizar status sem intervenção do usuário
   */
  startPolling(paymentId, onStatusUpdate = null) {
    // Se já está fazendo polling para este pagamento, não iniciar novamente
    if (this.pollingIntervals.has(paymentId)) {
      if (import.meta.env.DEV) {
        console.log(`⚠️ [PaymentAdapter] Polling já ativo para pagamento ${paymentId}`);
      }
      return;
    }

    let pollAttempts = 0;
    let currentInterval = this.defaultPollInterval;

    const poll = async () => {
      pollAttempts++;

      // Parar se excedeu tentativas máximas
      if (pollAttempts > this.maxPollAttempts) {
        this.stopPolling(paymentId);
        
        if (onStatusUpdate) {
          onStatusUpdate({
            success: false,
            error: 'Tempo de verificação esgotado. Verifique o status manualmente.'
          });
        }
        
        return;
      }

      try {
        const statusResult = await this.checkPaymentStatus(paymentId);

        if (statusResult.success) {
          const status = statusResult.data.status;

          // Se pagamento foi aprovado ou expirado, parar polling
          if (status === 'approved' || status === 'paid' || status === 'expired' || status === 'cancelled') {
            this.stopPolling(paymentId);

            if (onStatusUpdate) {
              onStatusUpdate(statusResult);
            }

            // Emitir evento customizado para UI reagir (sem alterar UI diretamente)
            window.dispatchEvent(new CustomEvent('payment:status-updated', {
              detail: statusResult.data
            }));

            return;
          }

          // Se ainda está pendente, continuar polling
          // Aumentar intervalo gradualmente (backoff)
          currentInterval = Math.min(
            currentInterval * this.pollBackoffMultiplier,
            this.defaultPollInterval * 10 // Máximo 50 segundos
          );

          // Agendar próxima verificação
          const intervalId = setTimeout(poll, currentInterval);
          this.pollingIntervals.set(paymentId, intervalId);
        } else {
          // Em caso de erro, continuar tentando (pode ser temporário)
          if (import.meta.env.DEV) {
            console.warn(`⚠️ [PaymentAdapter] Erro ao verificar status: ${statusResult.error}`);
          }

          // Agendar próxima verificação com intervalo maior
          currentInterval = Math.min(
            currentInterval * this.pollBackoffMultiplier * 2,
            this.defaultPollInterval * 20 // Máximo 100 segundos em caso de erro
          );

          const intervalId = setTimeout(poll, currentInterval);
          this.pollingIntervals.set(paymentId, intervalId);
        }
      } catch (error) {
        errorAdapter.logError(error, { context: 'polling', paymentId, attempt: pollAttempts });

        // Em caso de erro de rede, continuar tentando
        if (errorAdapter.isRetryable(error)) {
          currentInterval = Math.min(
            currentInterval * this.pollBackoffMultiplier * 2,
            this.defaultPollInterval * 20
          );

          const intervalId = setTimeout(poll, currentInterval);
          this.pollingIntervals.set(paymentId, intervalId);
        } else {
          // Erro não retryable, parar polling
          this.stopPolling(paymentId);
          
          if (onStatusUpdate) {
            onStatusUpdate({
              success: false,
              error: errorAdapter.getUserMessage(error)
            });
          }
        }
      }
    };

    // Iniciar primeira verificação imediatamente
    poll();
  }

  /**
   * Parar polling de um pagamento específico
   */
  stopPolling(paymentId) {
    const intervalId = this.pollingIntervals.get(paymentId);
    if (intervalId) {
      clearTimeout(intervalId);
      this.pollingIntervals.delete(paymentId);
      
      if (import.meta.env.DEV) {
        console.log(`✅ [PaymentAdapter] Polling parado para pagamento ${paymentId}`);
      }
    }
  }

  /**
   * Parar todos os pollings ativos
   */
  stopAllPolling() {
    this.pollingIntervals.forEach((intervalId, paymentId) => {
      clearTimeout(intervalId);
    });
    this.pollingIntervals.clear();
    
    if (import.meta.env.DEV) {
      console.log('✅ [PaymentAdapter] Todos os pollings parados');
    }
  }

  /**
   * Obter dados PIX do usuário
   */
  async getUserPixData() {
    try {
      const token = await authAdapter.getValidToken();
      if (!token) {
        return {
          success: false,
          error: 'Sessão expirada. Faça login novamente.',
          requiresAuth: true
        };
      }

      const response = await apiClient.get('/api/payments/pix/usuario', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const normalizedResponse = dataAdapter.normalizeResponse(response);

      if (!normalizedResponse.success) {
        return {
          success: false,
          error: normalizedResponse.message || 'Erro ao carregar dados PIX'
        };
      }

      const pixData = normalizedResponse.data;
      const history = dataAdapter.normalizePixHistory(
        pixData.historico_pagamentos || pixData.history || []
      );

      return {
        success: true,
        data: {
          pixKey: pixData.pix_key || pixData.pixKey,
          historicoPagamentos: history
        }
      };
    } catch (error) {
      errorAdapter.logError(error, { context: 'getUserPixData' });
      
      return {
        success: false,
        error: errorAdapter.getUserMessage(error),
        requiresAuth: errorAdapter.requiresAuth(error)
      };
    }
  }
}

export default new PaymentAdapter();

