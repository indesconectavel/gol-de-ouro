/**
 * LOTE SERVICE DB - Versão com persistência 100% no banco
 * Substitui lógica em memória por operações ACID no PostgreSQL
 */

const { supabaseAdmin } = require('../../database/supabase-unified-config');

class LoteServiceDB {
  /**
   * Obter ou criar lote ativo (100% via DB)
   * @param {number} valorAposta - Valor da aposta (1, 2, 5 ou 10)
   * @returns {Promise<object>} { success: boolean, lote: object, error: string }
   */
  static async getOrCreateLote(valorAposta) {
    try {
      const config = this.getBatchConfig(valorAposta);
      if (!config) {
        return {
          success: false,
          error: `Valor de aposta inválido: ${valorAposta}`
        };
      }

      // Gerar ID único
      const crypto = require('crypto');
      const randomBytes = crypto.randomBytes(6).toString('hex');
      const loteId = `lote_${valorAposta}_${Date.now()}_${randomBytes}`;
      const winnerIndex = crypto.randomInt(0, config.size);

      // Chamar RPC function (idempotente)
      const { data, error } = await supabaseAdmin.rpc('rpc_get_or_create_lote', {
        p_lote_id: loteId,
        p_valor_aposta: valorAposta,
        p_tamanho: config.size,
        p_indice_vencedor: winnerIndex
      });

      if (error) {
        console.error('❌ [LOTE-DB] Erro ao criar/obter lote:', error);
        return {
          success: false,
          error: error.message || 'Erro ao criar/obter lote'
        };
      }

      if (!data || !data.success) {
        return {
          success: false,
          error: data?.error || 'Erro desconhecido ao criar/obter lote'
        };
      }

      console.log(`✅ [LOTE-DB] Lote ${data.lote.id} criado/obtido (valor: R$${valorAposta})`);

      return {
        success: true,
        lote: {
          id: data.lote.id,
          valor: data.lote.valor_aposta,
          valorAposta: data.lote.valor_aposta,
          ativo: data.lote.status === 'ativo',
          status: data.lote.status,
          config: config,
          winnerIndex: data.lote.indice_vencedor,
          posicaoAtual: data.lote.posicao_atual,
          totalArrecadado: parseFloat(data.lote.total_arrecadado || 0),
          premioTotal: parseFloat(data.lote.premio_total || 0),
          chutes: [] // Será carregado sob demanda se necessário
        }
      };
    } catch (error) {
      console.error('❌ [LOTE-DB] Exceção ao criar/obter lote:', error);
      return {
        success: false,
        error: error.message || 'Erro ao criar/obter lote'
      };
    }
  }

  /**
   * Atualizar lote após chute (100% via DB)
   * @param {string} loteId - ID do lote
   * @param {number} valorAposta - Valor da aposta
   * @param {number} premio - Prêmio normal
   * @param {number} premioGolDeOuro - Prêmio Gol de Ouro
   * @param {boolean} isGoal - Se foi gol
   * @returns {Promise<object>} { success: boolean, lote: object, error: string }
   */
  static async updateLoteAfterShot(loteId, valorAposta, premio = 0, premioGolDeOuro = 0, isGoal = false) {
    try {
      const { data, error } = await supabaseAdmin.rpc('rpc_update_lote_after_shot', {
        p_lote_id: loteId,
        p_valor_aposta: valorAposta,
        p_premio: premio,
        p_premio_gol_de_ouro: premioGolDeOuro,
        p_is_goal: isGoal
      });

      if (error) {
        console.error('❌ [LOTE-DB] Erro ao atualizar lote:', error);
        return {
          success: false,
          error: error.message || 'Erro ao atualizar lote'
        };
      }

      if (!data || !data.success) {
        return {
          success: false,
          error: data?.error || 'Erro desconhecido ao atualizar lote'
        };
      }

      return {
        success: true,
        lote: data.lote,
        isComplete: data.lote.is_complete
      };
    } catch (error) {
      console.error('❌ [LOTE-DB] Exceção ao atualizar lote:', error);
      return {
        success: false,
        error: error.message || 'Erro ao atualizar lote'
      };
    }
  }

  /**
   * Obter lotes ativos do banco
   * @returns {Promise<object>} { success: boolean, lotes: array, count: number }
   */
  static async getActiveLotes() {
    try {
      const { data, error } = await supabaseAdmin
        .from('lotes')
        .select('*')
        .eq('status', 'ativo')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ [LOTE-DB] Erro ao buscar lotes ativos:', error);
        return {
          success: false,
          lotes: [],
          count: 0,
          error: error.message
        };
      }

      return {
        success: true,
        lotes: data || [],
        count: data?.length || 0
      };
    } catch (error) {
      console.error('❌ [LOTE-DB] Exceção ao buscar lotes ativos:', error);
      return {
        success: false,
        lotes: [],
        count: 0,
        error: error.message
      };
    }
  }

  /**
   * Obter chutes de um lote
   * @param {string} loteId - ID do lote
   * @returns {Promise<array>} Array de chutes
   */
  static async getChutesDoLote(loteId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('chutes')
        .select('*')
        .eq('lote_id', loteId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error(`❌ [LOTE-DB] Erro ao buscar chutes do lote ${loteId}:`, error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error(`❌ [LOTE-DB] Exceção ao buscar chutes do lote ${loteId}:`, error);
      return [];
    }
  }

  /**
   * Configurações dos lotes por valor
   */
  static getBatchConfig(valorAposta) {
    const configs = {
      1: { size: 10, totalValue: 10, winChance: 0.1, description: "10% chance" },
      2: { size: 5, totalValue: 10, winChance: 0.2, description: "20% chance" },
      5: { size: 2, totalValue: 10, winChance: 0.5, description: "50% chance" },
      10: { size: 1, totalValue: 10, winChance: 1.0, description: "100% chance" }
    };
    return configs[valorAposta] || null;
  }

  /**
   * Atualizar contador global persistido
   * @param {number} contador - Valor do contador
   * @returns {Promise<boolean>}
   */
  static async updatePersistedGlobalCounter(contador) {
    try {
      // Atualizar todos os lotes ativos com o contador
      const { error } = await supabaseAdmin
        .from('lotes')
        .update({
          persisted_global_counter: contador,
          synced_at: new Date().toISOString()
        })
        .eq('status', 'ativo');

      if (error) {
        console.error('❌ [LOTE-DB] Erro ao atualizar contador global:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ [LOTE-DB] Exceção ao atualizar contador global:', error);
      return false;
    }
  }
}

module.exports = LoteServiceDB;

