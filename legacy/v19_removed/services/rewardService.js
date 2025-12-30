// Reward Service - Gol de Ouro v4.0 - Sistema de Recompensas
// ===========================================================
// Data: 2025-01-12
// Status: CRÍTICO - Garantir integridade financeira nas recompensas
//
// Este service fornece sistema completo de recompensas,
// garantindo rastreabilidade e integridade financeira ACID.
// ===========================================================

const { supabaseAdmin } = require('../database/supabase-unified-config');
const FinancialService = require('./financialService');

class RewardService {
  /**
   * Registrar e creditar recompensa (método principal)
   * 
   * Registra a recompensa na tabela rewards e credita o saldo usando FinancialService (ACID)
   * 
   * @param {string} userId - UUID do usuário
   * @param {string} loteId - ID do lote (opcional)
   * @param {string} chuteId - UUID do chute (opcional)
   * @param {string} tipo - Tipo de recompensa ('gol_normal', 'gol_de_ouro', 'bonus', etc.)
   * @param {number} valor - Valor da recompensa
   * @param {string} descricao - Descrição da recompensa (opcional)
   * @param {object} metadata - Metadados adicionais (opcional)
   * 
   * @returns {Promise<object>} { success: boolean, rewardId: number, transactionId: string (UUID), error: string }
   */
  static async creditReward(userId, loteId, chuteId, tipo, valor, descricao = null, metadata = {}) {
    try {
      // Validar parâmetros
      if (!userId || !tipo || !valor || valor <= 0) {
        return {
          success: false,
          error: 'Parâmetros inválidos: userId, tipo e valor são obrigatórios'
        };
      }

      // Validar tipo
      const tiposValidos = ['gol_normal', 'gol_de_ouro', 'bonus', 'promocao', 'outro'];
      if (!tiposValidos.includes(tipo)) {
        return {
          success: false,
          error: `Tipo inválido. Use: ${tiposValidos.join(', ')}`
        };
      }

      // 1. Registrar recompensa (status: pendente)
      const { data: registerData, error: registerError } = await supabaseAdmin.rpc('rpc_register_reward', {
        p_usuario_id: userId,
        p_lote_id: loteId || null,
        p_chute_id: chuteId || null,
        p_tipo: tipo,
        p_valor: valor,
        p_descricao: descricao,
        p_metadata: metadata
      });

      if (registerError) {
        console.error('❌ [REWARD-SERVICE] Erro ao registrar recompensa:', registerError);
        return {
          success: false,
          error: registerError.message || 'Erro ao registrar recompensa'
        };
      }

      if (!registerData || !registerData.success) {
        return {
          success: false,
          error: registerData?.error || 'Erro desconhecido ao registrar recompensa'
        };
      }

      const rewardId = registerData.reward_id;
      const saldoAnterior = parseFloat(registerData.saldo_anterior || 0);

      // 2. Creditar saldo usando FinancialService (ACID)
      const addBalanceResult = await FinancialService.addBalance(
        userId,
        valor,
        {
          description: descricao || `Recompensa: ${tipo}`,
          referenceId: rewardId,
          referenceType: 'recompensa'
        }
      );

      if (!addBalanceResult.success) {
        console.error(`❌ [REWARD-SERVICE] Erro ao creditar saldo ACID: ${addBalanceResult.error}`);
        
        // Marcar recompensa como falhou
        await supabaseAdmin.rpc('rpc_mark_reward_credited', {
          p_reward_id: rewardId,
          p_transacao_id: null,
          p_saldo_posterior: saldoAnterior
        });

        return {
          success: false,
          error: addBalanceResult.error || 'Erro ao creditar recompensa',
          rewardId: rewardId
        };
      }

      const transacaoId = addBalanceResult.data?.transactionId || null;
      const saldoPosterior = parseFloat(addBalanceResult.data?.newBalance || saldoAnterior + valor);

      // 3. Marcar recompensa como creditada
      const { data: markData, error: markError } = await supabaseAdmin.rpc('rpc_mark_reward_credited', {
        p_reward_id: rewardId,
        p_transacao_id: transacaoId,
        p_saldo_posterior: saldoPosterior
      });

      if (markError) {
        console.error('❌ [REWARD-SERVICE] Erro ao marcar recompensa como creditada:', markError);
        // Não falhar aqui, pois o saldo já foi creditado
      }

      console.log(`✅ [REWARD-SERVICE] Recompensa creditada: ${tipo} - R$${valor} para usuário ${userId} (reward_id: ${rewardId})`);

      return {
        success: true,
        rewardId: rewardId,
        transactionId: transacaoId,
        saldoAnterior: saldoAnterior,
        saldoPosterior: saldoPosterior,
        tipo: tipo,
        valor: valor
      };

    } catch (error) {
      console.error('❌ [REWARD-SERVICE] Exceção ao creditar recompensa:', error);
      return {
        success: false,
        error: error.message || 'Erro ao creditar recompensa'
      };
    }
  }

  /**
   * Obter histórico de recompensas de um usuário
   * 
   * @param {string} userId - UUID do usuário
   * @param {number} limit - Limite de resultados (padrão: 50)
   * @param {number} offset - Offset para paginação (padrão: 0)
   * @param {string} tipo - Filtrar por tipo (opcional)
   * @param {string} status - Filtrar por status (opcional)
   * 
   * @returns {Promise<object>} { success: boolean, rewards: array, total: number, error: string }
   */
  static async getUserRewards(userId, limit = 50, offset = 0, tipo = null, status = null) {
    try {
      const { data, error } = await supabaseAdmin.rpc('rpc_get_user_rewards', {
        p_usuario_id: userId,
        p_limit: limit,
        p_offset: offset,
        p_tipo: tipo,
        p_status: status
      });

      if (error) {
        console.error('❌ [REWARD-SERVICE] Erro ao obter recompensas:', error);
        return {
          success: false,
          rewards: [],
          total: 0,
          error: error.message || 'Erro ao obter recompensas'
        };
      }

      if (!data || !data.success) {
        return {
          success: false,
          rewards: [],
          total: 0,
          error: data?.error || 'Erro desconhecido ao obter recompensas'
        };
      }

      return {
        success: true,
        rewards: data.rewards || [],
        total: data.total || 0,
        limit: data.limit || limit,
        offset: data.offset || offset
      };

    } catch (error) {
      console.error('❌ [REWARD-SERVICE] Exceção ao obter recompensas:', error);
      return {
        success: false,
        rewards: [],
        total: 0,
        error: error.message || 'Erro ao obter recompensas'
      };
    }
  }

  /**
   * Obter estatísticas de recompensas de um usuário
   * 
   * @param {string} userId - UUID do usuário
   * 
   * @returns {Promise<object>} { success: boolean, stats: object, error: string }
   */
  static async getUserRewardStats(userId) {
    try {
      // Buscar todas as recompensas creditadas
      const result = await this.getUserRewards(userId, 1000, 0, null, 'creditado');

      if (!result.success) {
        return {
          success: false,
          stats: {},
          error: result.error
        };
      }

      const rewards = result.rewards || [];
      
      // Calcular estatísticas
      const stats = {
        total: rewards.length,
        totalValor: rewards.reduce((sum, r) => sum + parseFloat(r.valor || 0), 0),
        porTipo: {},
        ultimaRecompensa: rewards.length > 0 ? rewards[0] : null
      };

      // Agrupar por tipo
      rewards.forEach(reward => {
        const tipo = reward.tipo || 'outro';
        if (!stats.porTipo[tipo]) {
          stats.porTipo[tipo] = {
            quantidade: 0,
            valorTotal: 0
          };
        }
        stats.porTipo[tipo].quantidade++;
        stats.porTipo[tipo].valorTotal += parseFloat(reward.valor || 0);
      });

      return {
        success: true,
        stats: stats
      };

    } catch (error) {
      console.error('❌ [REWARD-SERVICE] Exceção ao obter estatísticas:', error);
      return {
        success: false,
        stats: {},
        error: error.message || 'Erro ao obter estatísticas'
      };
    }
  }
}

module.exports = RewardService;

