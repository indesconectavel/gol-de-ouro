// Webhook Service - Gol de Ouro v4.0 - Fase 2: Idempotência Completa
// ===================================================================
// Data: 2025-01-12
// Status: CRÍTICO - Garantir que webhook nunca processe duas vezes
//
// Este service fornece idempotência completa para webhooks do Mercado Pago,
// garantindo que mesmo com múltiplas chamadas simultâneas, o evento seja processado apenas uma vez.
// ===================================================================

const { supabaseAdmin } = require('../database/supabase-config');
const FinancialService = require('./financialService');
const crypto = require('crypto');

class WebhookService {
  /**
   * Gerar chave de idempotência única para evento
   * 
   * @param {string} eventType - Tipo do evento (ex: 'payment')
   * @param {string} paymentId - ID do pagamento
   * @param {object} payload - Payload completo do webhook
   * 
   * @returns {string} Chave de idempotência única
   */
  static generateIdempotencyKey(eventType, paymentId, payload = {}) {
    // Usar eventType:paymentId:hash(payload) para garantir unicidade
    const payloadHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(payload))
      .digest('hex')
      .substring(0, 16);
    
    return `${eventType}:${paymentId}:${payloadHash}`;
  }

  /**
   * Registrar evento de webhook (idempotência)
   * 
   * @param {string} eventType - Tipo do evento
   * @param {string} paymentId - ID do pagamento
   * @param {object} rawPayload - Payload completo do webhook
   * 
   * @returns {Promise<object>} { success: boolean, eventId: number, alreadyExists: boolean, error: string }
   */
  static async registerWebhookEvent(eventType, paymentId, rawPayload) {
    try {
      // Gerar chave de idempotência
      const idempotencyKey = this.generateIdempotencyKey(eventType, paymentId, rawPayload);

      // Chamar RPC function para registrar evento (atômico)
      const { data, error } = await supabaseAdmin.rpc('rpc_register_webhook_event', {
        p_idempotency_key: idempotencyKey,
        p_event_type: eventType,
        p_payment_id: String(paymentId),
        p_raw_payload: rawPayload
      });

      if (error) {
        console.error('❌ [WEBHOOK-SERVICE] Erro ao registrar evento:', error);
        return {
          success: false,
          error: error.message || 'Erro ao registrar evento de webhook'
        };
      }

      // Verificar resposta da RPC
      if (!data || !data.success) {
        return {
          success: false,
          error: data?.error || 'Erro desconhecido ao registrar evento'
        };
      }

      console.log(`📝 [WEBHOOK-SERVICE] Evento registrado: ${idempotencyKey} (ID: ${data.event_id}, já existia: ${data.already_exists})`);

      return {
        success: true,
        eventId: data.event_id,
        alreadyExists: data.already_exists,
        idempotencyKey: idempotencyKey
      };

    } catch (error) {
      console.error('❌ [WEBHOOK-SERVICE] Exceção ao registrar evento:', error);
      return {
        success: false,
        error: error.message || 'Erro interno ao registrar evento'
      };
    }
  }

  /**
   * Verificar se evento já foi processado
   * 
   * @param {string} eventType - Tipo do evento
   * @param {string} paymentId - ID do pagamento
   * @param {object} payload - Payload completo do webhook
   * 
   * @returns {Promise<object>} { success: boolean, processed: boolean, eventId: number, error: string }
   */
  static async checkEventProcessed(eventType, paymentId, payload = {}) {
    try {
      // Gerar chave de idempotência
      const idempotencyKey = this.generateIdempotencyKey(eventType, paymentId, payload);

      // Chamar RPC function para verificar
      const { data, error } = await supabaseAdmin.rpc('rpc_check_webhook_event_processed', {
        p_idempotency_key: idempotencyKey
      });

      if (error) {
        console.error('❌ [WEBHOOK-SERVICE] Erro ao verificar evento:', error);
        return {
          success: false,
          error: error.message || 'Erro ao verificar evento'
        };
      }

      // Verificar resposta da RPC
      if (!data || !data.success) {
        return {
          success: false,
          error: data?.error || 'Erro desconhecido ao verificar evento'
        };
      }

      return {
        success: true,
        processed: data.processed || false,
        eventId: data.event_id || null
      };

    } catch (error) {
      console.error('❌ [WEBHOOK-SERVICE] Exceção ao verificar evento:', error);
      return {
        success: false,
        error: error.message || 'Erro interno ao verificar evento'
      };
    }
  }

  /**
   * Marcar evento como processado com sucesso
   * 
   * @param {number} eventId - ID do evento
   * @param {object} result - Resultado do processamento
   * 
   * @returns {Promise<object>} { success: boolean, durationMs: number, error: string }
   */
  static async markEventProcessed(eventId, result = null) {
    try {
      // Chamar RPC function para marcar como processado
      const { data, error } = await supabaseAdmin.rpc('rpc_mark_webhook_event_processed', {
        p_event_id: eventId,
        p_result: result ? result : null,
        p_error_message: null
      });

      if (error) {
        console.error('❌ [WEBHOOK-SERVICE] Erro ao marcar evento como processado:', error);
        return {
          success: false,
          error: error.message || 'Erro ao marcar evento como processado'
        };
      }

      // Verificar resposta da RPC
      if (!data || !data.success) {
        return {
          success: false,
          error: data?.error || 'Erro desconhecido ao marcar evento como processado'
        };
      }

      console.log(`✅ [WEBHOOK-SERVICE] Evento ${eventId} marcado como processado (duração: ${data.duration_ms}ms)`);

      return {
        success: true,
        durationMs: data.duration_ms
      };

    } catch (error) {
      console.error('❌ [WEBHOOK-SERVICE] Exceção ao marcar evento como processado:', error);
      return {
        success: false,
        error: error.message || 'Erro interno ao marcar evento como processado'
      };
    }
  }

  /**
   * Marcar evento como processado com erro
   * 
   * @param {number} eventId - ID do evento
   * @param {string} errorMessage - Mensagem de erro
   * 
   * @returns {Promise<object>} { success: boolean, durationMs: number, error: string }
   */
  static async markEventFailed(eventId, errorMessage) {
    try {
      // Chamar RPC function para marcar como processado com erro
      const { data, error } = await supabaseAdmin.rpc('rpc_mark_webhook_event_processed', {
        p_event_id: eventId,
        p_result: null,
        p_error_message: errorMessage
      });

      if (error) {
        console.error('❌ [WEBHOOK-SERVICE] Erro ao marcar evento como falhado:', error);
        return {
          success: false,
          error: error.message || 'Erro ao marcar evento como falhado'
        };
      }

      // Verificar resposta da RPC
      if (!data || !data.success) {
        return {
          success: false,
          error: data?.error || 'Erro desconhecido ao marcar evento como falhado'
        };
      }

      console.log(`❌ [WEBHOOK-SERVICE] Evento ${eventId} marcado como falhado: ${errorMessage}`);

      return {
        success: true,
        durationMs: data.duration_ms
      };

    } catch (error) {
      console.error('❌ [WEBHOOK-SERVICE] Exceção ao marcar evento como falhado:', error);
      return {
        success: false,
        error: error.message || 'Erro interno ao marcar evento como falhado'
      };
    }
  }

  /**
   * Processar webhook de pagamento com idempotência completa
   * 
   * @param {object} webhookPayload - Payload completo do webhook
   * @param {string} paymentId - ID do pagamento
   * @param {string} status - Status do pagamento ('approved', 'rejected', etc.)
   * 
   * @returns {Promise<object>} { success: boolean, processed: boolean, result: object, error: string }
   */
  static async processPaymentWebhook(webhookPayload, paymentId, status) {
    const eventType = 'payment';
    let eventId = null;

    try {
      // Passo 1: Registrar evento (idempotência)
      const registerResult = await this.registerWebhookEvent(
        eventType,
        paymentId,
        webhookPayload
      );

      if (!registerResult.success) {
        return {
          success: false,
          error: registerResult.error,
          processed: false
        };
      }

      eventId = registerResult.eventId;

      // Passo 2: Se evento já existe e foi processado, retornar imediatamente
      if (registerResult.alreadyExists) {
        const checkResult = await this.checkEventProcessed(eventType, paymentId, webhookPayload);
        
        if (checkResult.success && checkResult.processed) {
          console.log(`⏭️ [WEBHOOK-SERVICE] Evento ${eventId} já foi processado anteriormente, ignorando...`);
          return {
            success: true,
            processed: false, // Não processou agora (já estava processado)
            alreadyProcessed: true,
            eventId: eventId
          };
        }
      }

      // Passo 3: Processar apenas se status for 'approved'
      if (status !== 'approved') {
        await this.markEventProcessed(eventId, { status: status, message: 'Status não é approved, ignorando' });
        return {
          success: true,
          processed: false,
          eventId: eventId,
          reason: `Status ${status} não requer processamento`
        };
      }

      // Passo 4: Buscar pagamento no banco
      const { data: pagamento, error: pagamentoError } = await supabaseAdmin
        .from('pagamentos_pix')
        .select('id, usuario_id, amount, valor, external_id, payment_id')
        .or(`external_id.eq.${paymentId},payment_id.eq.${paymentId}`)
        .maybeSingle();

      if (pagamentoError || !pagamento) {
        const errorMsg = `Pagamento não encontrado no banco: ${paymentId}`;
        await this.markEventFailed(eventId, errorMsg);
        return {
          success: false,
          error: errorMsg,
          processed: false,
          eventId: eventId
        };
      }

      // Passo 5: Atualizar status do pagamento no banco
      const { error: updateError } = await supabaseAdmin
        .from('pagamentos_pix')
        .update({
          status: 'approved',
          updated_at: new Date().toISOString()
        })
        .or(`external_id.eq.${paymentId},payment_id.eq.${paymentId}`);

      if (updateError) {
        const errorMsg = `Erro ao atualizar status do pagamento: ${updateError.message}`;
        await this.markEventFailed(eventId, errorMsg);
        return {
          success: false,
          error: errorMsg,
          processed: false,
          eventId: eventId
        };
      }

      // Passo 6: Processar crédito usando FinancialService (ACID)
      const valor = pagamento.amount || pagamento.valor || 0;
      const addBalanceResult = await FinancialService.addBalance(
        pagamento.usuario_id,
        parseFloat(valor),
        {
          description: 'Depósito via PIX (Webhook Idempotente)',
          referenceId: paymentId ? parseInt(String(paymentId).replace(/\D/g, '')) || null : null,
          referenceType: 'deposito'
        }
      );

      if (!addBalanceResult.success) {
        const errorMsg = `Erro ao creditar saldo: ${addBalanceResult.error}`;
        await this.markEventFailed(eventId, errorMsg);
        return {
          success: false,
          error: errorMsg,
          processed: false,
          eventId: eventId
        };
      }

      // Passo 7: Marcar evento como processado com sucesso
      await this.markEventProcessed(eventId, {
        paymentId: paymentId,
        userId: pagamento.usuario_id,
        amount: valor,
        newBalance: addBalanceResult.data.newBalance,
        transactionId: addBalanceResult.data.transactionId
      });

      console.log(`✅ [WEBHOOK-SERVICE] Webhook processado com sucesso: ${paymentId} - R$ ${valor} (eventId: ${eventId})`);

      return {
        success: true,
        processed: true,
        eventId: eventId,
        result: {
          paymentId: paymentId,
          userId: pagamento.usuario_id,
          amount: valor,
          newBalance: addBalanceResult.data.newBalance,
          transactionId: addBalanceResult.data.transactionId
        }
      };

    } catch (error) {
      console.error('❌ [WEBHOOK-SERVICE] Exceção ao processar webhook:', error);
      
      // Marcar como falhado se tiver eventId
      if (eventId) {
        await this.markEventFailed(eventId, error.message || 'Erro interno ao processar webhook');
      }

      return {
        success: false,
        error: error.message || 'Erro interno ao processar webhook',
        processed: false,
        eventId: eventId
      };
    }
  }
}

module.exports = WebhookService;

