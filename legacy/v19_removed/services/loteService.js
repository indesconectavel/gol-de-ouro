// Lote Service - Gol de Ouro v4.0 - Persistência de Lotes
// =========================================================
// Data: 2025-01-12
// Status: CRÍTICO - Garantir que lotes sobrevivam reinicialização
//
// Este service fornece persistência completa de lotes ativos,
// garantindo que reinicialização do servidor não perca dados.
// =========================================================

const { supabaseAdmin } = require('../database/supabase-unified-config');

class LoteService {
  /**
   * Criar ou obter lote ativo para valor de aposta
   * 
   * @param {string} loteId - ID único do lote
   * @param {number} valorAposta - Valor da aposta (1, 2, 5 ou 10)
   * @param {number} tamanho - Tamanho do lote (10, 5, 2 ou 1)
   * @param {number} indiceVencedor - Índice do ganhador (0 a tamanho-1)
   * 
   * @returns {Promise<object>} { success: boolean, lote: object, error: string }
   */
  static async getOrCreateLote(loteId, valorAposta, tamanho, indiceVencedor) {
    try {
      const { data, error } = await supabaseAdmin.rpc('rpc_get_or_create_lote', {
        p_lote_id: loteId,
        p_valor_aposta: valorAposta,
        p_tamanho: tamanho,
        p_indice_vencedor: indiceVencedor
      });

      if (error) {
        console.error('❌ [LOTE-SERVICE] Erro ao criar/obter lote:', error);
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

      console.log(`✅ [LOTE-SERVICE] Lote ${loteId} criado/obtido (valor: R$${valorAposta})`);

      return {
        success: true,
        lote: data.lote
      };
    } catch (error) {
      console.error('❌ [LOTE-SERVICE] Exceção ao criar/obter lote:', error);
      return {
        success: false,
        error: error.message || 'Erro ao criar/obter lote'
      };
    }
  }

  /**
   * Atualizar lote após chute
   * 
   * @param {string} loteId - ID do lote
   * @param {number} valorAposta - Valor da aposta
   * @param {number} premio - Prêmio normal (R$5)
   * @param {number} premioGolDeOuro - Prêmio Gol de Ouro (R$100)
   * @param {boolean} isGoal - Se foi gol
   * 
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
        console.error('❌ [LOTE-SERVICE] Erro ao atualizar lote:', error);
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
        lote: data.lote
      };
    } catch (error) {
      console.error('❌ [LOTE-SERVICE] Exceção ao atualizar lote:', error);
      return {
        success: false,
        error: error.message || 'Erro ao atualizar lote'
      };
    }
  }

  /**
   * Sincronizar lotes ativos do banco ao iniciar servidor
   * 
   * @returns {Promise<object>} { success: boolean, lotes: array, count: number, error: string }
   */
  static async syncActiveLotes() {
    try {
      const { data, error } = await supabaseAdmin.rpc('rpc_get_active_lotes');

      if (error) {
        console.error('❌ [LOTE-SERVICE] Erro ao sincronizar lotes:', error);
        return {
          success: false,
          lotes: [],
          count: 0,
          error: error.message || 'Erro ao sincronizar lotes'
        };
      }

      if (!data || !data.success) {
        return {
          success: false,
          lotes: [],
          count: 0,
          error: data?.error || 'Erro desconhecido ao sincronizar lotes'
        };
      }

      console.log(`✅ [LOTE-SERVICE] ${data.count || 0} lotes ativos sincronizados`);

      return {
        success: true,
        lotes: data.lotes || [],
        count: data.count || 0
      };
    } catch (error) {
      console.error('❌ [LOTE-SERVICE] Exceção ao sincronizar lotes:', error);
      return {
        success: false,
        lotes: [],
        count: 0,
        error: error.message || 'Erro ao sincronizar lotes'
      };
    }
  }
}

module.exports = LoteService;

