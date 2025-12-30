// Financial Service - Gol de Ouro v4.0 - Fase 1: Sistema Financeiro ACID
// ======================================================================
// Data: 2025-01-12
// Status: CRÍTICO - Garantir integridade financeira total
//
// Este service fornece operações financeiras ACID usando RPC functions do Supabase,
// eliminando race conditions e garantindo consistência total do sistema financeiro.
// ======================================================================

const { supabaseAdmin } = require('../database/supabase-unified-config');
const response = require('../utils/response-helper');

class FinancialService {
  /**
   * Adicionar saldo ao usuário (Crédito) - ACID
   * 
   * @param {string} userId - UUID do usuário
   * @param {number} amount - Valor a ser creditado (positivo)
   * @param {object} options - Opções adicionais
   * @param {string} options.description - Descrição da transação
   * @param {number} options.referenceId - ID de referência (ex: payment_id)
   * @param {string} options.referenceType - Tipo de referência (ex: 'deposito', 'premio')
   * 
   * @returns {Promise<object>} { success: boolean, data: { oldBalance, newBalance, transactionId }, error: string }
   */
  static async addBalance(userId, amount, options = {}) {
    try {
      // Validações básicas
      if (!userId) {
        return {
          success: false,
          error: 'User ID é obrigatório'
        };
      }

      if (!amount || amount <= 0) {
        return {
          success: false,
          error: 'Valor deve ser maior que zero'
        };
      }

      // Chamar RPC function do Supabase (ACID)
      const { data, error } = await supabaseAdmin.rpc('rpc_add_balance', {
        p_user_id: userId,
        p_amount: parseFloat(amount),
        p_description: options.description || null,
        p_reference_id: options.referenceId || null,
        p_reference_type: options.referenceType || null
      });

      if (error) {
        console.error('❌ [FINANCIAL] Erro ao adicionar saldo:', error);
        return {
          success: false,
          error: error.message || 'Erro ao processar crédito'
        };
      }

      // Verificar resposta da RPC
      if (!data || !data.success) {
        return {
          success: false,
          error: data?.error || 'Erro desconhecido ao processar crédito'
        };
      }

      console.log(`✅ [FINANCIAL] Crédito processado: R$ ${amount} para usuário ${userId} (saldo: ${data.old_balance} → ${data.new_balance})`);

      return {
        success: true,
        data: {
          oldBalance: parseFloat(data.old_balance),
          newBalance: parseFloat(data.new_balance),
          transactionId: data.transaction_id,
          amount: parseFloat(data.amount)
        }
      };

    } catch (error) {
      console.error('❌ [FINANCIAL] Exceção ao adicionar saldo:', error);
      return {
        success: false,
        error: error.message || 'Erro interno ao processar crédito'
      };
    }
  }

  /**
   * Deduzir saldo do usuário (Débito) - ACID
   * 
   * @param {string} userId - UUID do usuário
   * @param {number} amount - Valor a ser debitado (positivo)
   * @param {object} options - Opções adicionais
   * @param {string} options.description - Descrição da transação
   * @param {number} options.referenceId - ID de referência (ex: saque_id)
   * @param {string} options.referenceType - Tipo de referência (ex: 'saque', 'aposta')
   * @param {boolean} options.allowNegative - Permitir saldo negativo? (padrão: false)
   * 
   * @returns {Promise<object>} { success: boolean, data: { oldBalance, newBalance, transactionId }, error: string }
   */
  static async deductBalance(userId, amount, options = {}) {
    try {
      // Validações básicas
      if (!userId) {
        return {
          success: false,
          error: 'User ID é obrigatório'
        };
      }

      if (!amount || amount <= 0) {
        return {
          success: false,
          error: 'Valor deve ser maior que zero'
        };
      }

      // Chamar RPC function do Supabase (ACID)
      const { data, error } = await supabaseAdmin.rpc('rpc_deduct_balance', {
        p_user_id: userId,
        p_amount: parseFloat(amount),
        p_description: options.description || null,
        p_reference_id: options.referenceId || null,
        p_reference_type: options.referenceType || null,
        p_allow_negative: options.allowNegative || false
      });

      if (error) {
        console.error('❌ [FINANCIAL] Erro ao deduzir saldo:', error);
        return {
          success: false,
          error: error.message || 'Erro ao processar débito'
        };
      }

      // Verificar resposta da RPC
      if (!data || !data.success) {
        // Verificar se é erro de saldo insuficiente
        if (data?.error === 'Saldo insuficiente') {
          return {
            success: false,
            error: 'Saldo insuficiente',
            data: {
              currentBalance: data.current_balance,
              requiredAmount: data.required_amount,
              shortage: data.shortage
            }
          };
        }

        return {
          success: false,
          error: data?.error || 'Erro desconhecido ao processar débito'
        };
      }

      console.log(`✅ [FINANCIAL] Débito processado: R$ ${amount} do usuário ${userId} (saldo: ${data.old_balance} → ${data.new_balance})`);

      return {
        success: true,
        data: {
          oldBalance: parseFloat(data.old_balance),
          newBalance: parseFloat(data.new_balance),
          transactionId: data.transaction_id,
          amount: parseFloat(data.amount)
        }
      };

    } catch (error) {
      console.error('❌ [FINANCIAL] Exceção ao deduzir saldo:', error);
      return {
        success: false,
        error: error.message || 'Erro interno ao processar débito'
      };
    }
  }

  /**
   * Transferir saldo entre usuários - ACID
   * 
   * @param {string} fromUserId - UUID do usuário origem
   * @param {string} toUserId - UUID do usuário destino
   * @param {number} amount - Valor a ser transferido
   * @param {string} description - Descrição da transferência
   * 
   * @returns {Promise<object>} { success: boolean, data: { fromBalance, toBalance, transactionIds }, error: string }
   */
  static async transferBalance(fromUserId, toUserId, amount, description = null) {
    try {
      // Validações básicas
      if (!fromUserId || !toUserId) {
        return {
          success: false,
          error: 'IDs de usuário são obrigatórios'
        };
      }

      if (fromUserId === toUserId) {
        return {
          success: false,
          error: 'Não é possível transferir para o mesmo usuário'
        };
      }

      if (!amount || amount <= 0) {
        return {
          success: false,
          error: 'Valor deve ser maior que zero'
        };
      }

      // Chamar RPC function do Supabase (ACID)
      const { data, error } = await supabaseAdmin.rpc('rpc_transfer_balance', {
        p_from_user_id: fromUserId,
        p_to_user_id: toUserId,
        p_amount: parseFloat(amount),
        p_description: description || null
      });

      if (error) {
        console.error('❌ [FINANCIAL] Erro ao transferir saldo:', error);
        return {
          success: false,
          error: error.message || 'Erro ao processar transferência'
        };
      }

      // Verificar resposta da RPC
      if (!data || !data.success) {
        return {
          success: false,
          error: data?.error || 'Erro desconhecido ao processar transferência'
        };
      }

      console.log(`✅ [FINANCIAL] Transferência processada: R$ ${amount} de ${fromUserId} para ${toUserId}`);

      return {
        success: true,
        data: {
          fromBalance: parseFloat(data.from_balance),
          toBalance: parseFloat(data.to_balance),
          transactionIds: data.transaction_ids,
          amount: parseFloat(data.amount)
        }
      };

    } catch (error) {
      console.error('❌ [FINANCIAL] Exceção ao transferir saldo:', error);
      return {
        success: false,
        error: error.message || 'Erro interno ao processar transferência'
      };
    }
  }

  /**
   * Obter saldo atual do usuário
   * 
   * @param {string} userId - UUID do usuário
   * @param {boolean} withLock - Fazer lock da linha? (para operações críticas)
   * 
   * @returns {Promise<object>} { success: boolean, balance: number, error: string }
   */
  static async getBalance(userId, withLock = false) {
    try {
      // Validações básicas
      if (!userId) {
        return {
          success: false,
          error: 'User ID é obrigatório'
        };
      }

      // Chamar RPC function do Supabase
      const { data, error } = await supabaseAdmin.rpc('rpc_get_balance', {
        p_user_id: userId,
        p_with_lock: withLock
      });

      if (error) {
        console.error('❌ [FINANCIAL] Erro ao obter saldo:', error);
        return {
          success: false,
          error: error.message || 'Erro ao consultar saldo'
        };
      }

      // Verificar resposta da RPC
      if (!data || !data.success) {
        return {
          success: false,
          error: data?.error || 'Erro desconhecido ao consultar saldo'
        };
      }

      return {
        success: true,
        balance: parseFloat(data.balance)
      };

    } catch (error) {
      console.error('❌ [FINANCIAL] Exceção ao obter saldo:', error);
      return {
        success: false,
        error: error.message || 'Erro interno ao consultar saldo'
      };
    }
  }

  /**
   * Criar transação manual (sem alterar saldo)
   * Útil para registro de eventos que não alteram saldo diretamente
   * 
   * @param {string} userId - UUID do usuário
   * @param {string} type - Tipo de transação ('credito' ou 'debito')
   * @param {number} value - Valor da transação
   * @param {object} options - Opções adicionais
   * 
   * @returns {Promise<object>} { success: boolean, transactionId: number, error: string }
   */
  static async createTransaction(userId, type, value, options = {}) {
    try {
      // Validações básicas
      if (!userId) {
        return {
          success: false,
          error: 'User ID é obrigatório'
        };
      }

      if (!['credito', 'debito'].includes(type)) {
        return {
          success: false,
          error: 'Tipo de transação inválido (deve ser "credito" ou "debito")'
        };
      }

      // Obter saldo atual (com lock para garantir consistência)
      const balanceResult = await this.getBalance(userId, true);
      if (!balanceResult.success) {
        return balanceResult;
      }

      const currentBalance = balanceResult.balance;
      const transactionValue = type === 'debito' ? -Math.abs(value) : Math.abs(value);
      const newBalance = currentBalance + transactionValue;

      // Criar transação manualmente
      const { data, error } = await supabaseAdmin
        .from('transacoes')
        .insert({
          usuario_id: userId,
          tipo: type,
          valor: transactionValue,
          saldo_anterior: currentBalance,
          saldo_posterior: newBalance,
          descricao: options.description || null,
          referencia_id: options.referenceId || null,
          referencia_tipo: options.referenceType || null,
          status: options.status || 'concluido',
          processed_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) {
        console.error('❌ [FINANCIAL] Erro ao criar transação:', error);
        return {
          success: false,
          error: error.message || 'Erro ao criar registro de transação'
        };
      }

      return {
        success: true,
        transactionId: data.id
      };

    } catch (error) {
      console.error('❌ [FINANCIAL] Exceção ao criar transação:', error);
      return {
        success: false,
        error: error.message || 'Erro interno ao criar transação'
      };
    }
  }

  /**
   * Verificar se usuário tem saldo suficiente
   * 
   * @param {string} userId - UUID do usuário
   * @param {number} requiredAmount - Valor necessário
   * 
   * @returns {Promise<object>} { success: boolean, hasBalance: boolean, currentBalance: number, error: string }
   */
  static async hasSufficientBalance(userId, requiredAmount) {
    try {
      const balanceResult = await this.getBalance(userId, false);
      
      if (!balanceResult.success) {
        return balanceResult;
      }

      const currentBalance = balanceResult.balance;
      const hasBalance = currentBalance >= requiredAmount;

      return {
        success: true,
        hasBalance: hasBalance,
        currentBalance: currentBalance,
        requiredAmount: requiredAmount,
        shortage: hasBalance ? 0 : (requiredAmount - currentBalance)
      };

    } catch (error) {
      console.error('❌ [FINANCIAL] Exceção ao verificar saldo:', error);
      return {
        success: false,
        error: error.message || 'Erro interno ao verificar saldo'
      };
    }
  }
}

module.exports = FinancialService;

