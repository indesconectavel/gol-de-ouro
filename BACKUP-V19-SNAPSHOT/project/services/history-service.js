// Sistema de Histórico Completo - Gol de Ouro v1.2.0
// ================================================
const { createClient } = require('@supabase/supabase-js');

class HistoryService {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }

  // Obter histórico completo de transações do usuário
  async getUserCompleteHistory(userId, options = {}) {
    try {
      const {
        limit = 100,
        offset = 0,
        type = null, // 'deposit', 'withdraw', 'game', 'prize'
        startDate = null,
        endDate = null,
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = options;

      // Construir query base
      let query = this.supabase
        .from('user_transaction_history')
        .select('*')
        .eq('usuario_id', userId);

      // Aplicar filtros
      if (type) {
        query = query.eq('type', type);
      }

      if (startDate) {
        query = query.gte('created_at', startDate);
      }

      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      // Aplicar ordenação e paginação
      query = query
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) {
        console.error('❌ [HISTORY] Erro ao buscar histórico:', error);
        return { success: false, error: error.message };
      }

      // Buscar estatísticas resumidas
      const stats = await this.getUserHistoryStats(userId, { type, startDate, endDate });

      return {
        success: true,
        data: data || [],
        stats: stats.data,
        pagination: {
          limit,
          offset,
          total: stats.total || 0,
          hasMore: (data?.length || 0) === limit
        }
      };

    } catch (error) {
      console.error('❌ [HISTORY] Erro inesperado:', error);
      return { success: false, error: error.message };
    }
  }

  // Obter estatísticas do histórico do usuário
  async getUserHistoryStats(userId, filters = {}) {
    try {
      const { type, startDate, endDate } = filters;

      let query = this.supabase
        .from('user_transaction_history')
        .select('type, amount, created_at')
        .eq('usuario_id', userId);

      if (type) {
        query = query.eq('type', type);
      }

      if (startDate) {
        query = query.gte('created_at', startDate);
      }

      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ [HISTORY] Erro ao buscar estatísticas:', error);
        return { success: false, error: error.message };
      }

      // Calcular estatísticas
      const stats = {
        total: data.length,
        totalAmount: 0,
        byType: {},
        byMonth: {},
        recentActivity: []
      };

      data.forEach(transaction => {
        const amount = parseFloat(transaction.amount) || 0;
        const type = transaction.type;
        const month = transaction.created_at.substring(0, 7); // YYYY-MM

        stats.totalAmount += amount;

        // Por tipo
        if (!stats.byType[type]) {
          stats.byType[type] = { count: 0, total: 0 };
        }
        stats.byType[type].count++;
        stats.byType[type].total += amount;

        // Por mês
        if (!stats.byMonth[month]) {
          stats.byMonth[month] = { count: 0, total: 0 };
        }
        stats.byMonth[month].count++;
        stats.byMonth[month].total += amount;
      });

      // Atividade recente (últimos 7 dias)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      stats.recentActivity = data
        .filter(t => t.created_at >= sevenDaysAgo)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 10);

      return {
        success: true,
        data: stats,
        total: data.length
      };

    } catch (error) {
      console.error('❌ [HISTORY] Erro inesperado:', error);
      return { success: false, error: error.message };
    }
  }

  // Registrar transação no histórico
  async recordTransaction(transactionData) {
    try {
      const {
        usuario_id,
        type, // 'deposit', 'withdraw', 'game_bet', 'prize', 'bonus'
        amount,
        description,
        reference_id = null,
        metadata = {},
        status = 'completed'
      } = transactionData;

      const { data, error } = await this.supabase
        .from('user_transaction_history')
        .insert({
          usuario_id,
          type,
          amount: parseFloat(amount),
          description,
          reference_id,
          metadata,
          status,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('❌ [HISTORY] Erro ao registrar transação:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ [HISTORY] Transação registrada: ${type} - R$ ${amount} para usuário ${usuario_id}`);
      return { success: true, data };

    } catch (error) {
      console.error('❌ [HISTORY] Erro inesperado:', error);
      return { success: false, error: error.message };
    }
  }

  // Obter histórico de jogos do usuário
  async getUserGameHistory(userId, options = {}) {
    try {
      const {
        limit = 50,
        offset = 0,
        startDate = null,
        endDate = null
      } = options;

      let query = this.supabase
        .from('chutes')
        .select(`
          *,
          lotes (
            id,
            valor,
            winner_index,
            total_arrecadado,
            premio_total
          )
        `)
        .eq('usuario_id', userId);

      if (startDate) {
        query = query.gte('timestamp', startDate);
      }

      if (endDate) {
        query = query.lte('timestamp', endDate);
      }

      query = query
        .order('timestamp', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) {
        console.error('❌ [HISTORY] Erro ao buscar histórico de jogos:', error);
        return { success: false, error: error.message };
      }

      // Calcular estatísticas dos jogos
      const gameStats = {
        totalShots: data.length,
        totalBets: 0,
        totalWins: 0,
        totalPrizes: 0,
        winRate: 0,
        averageBet: 0,
        bestWin: 0
      };

      data.forEach(shot => {
        gameStats.totalBets += shot.amount;
        if (shot.result === 'goal') {
          gameStats.totalWins++;
          gameStats.totalPrizes += shot.premio + shot.premio_gol_de_ouro;
          if (shot.premio + shot.premio_gol_de_ouro > gameStats.bestWin) {
            gameStats.bestWin = shot.premio + shot.premio_gol_de_ouro;
          }
        }
      });

      gameStats.winRate = gameStats.totalShots > 0 ? (gameStats.totalWins / gameStats.totalShots) * 100 : 0;
      gameStats.averageBet = gameStats.totalShots > 0 ? gameStats.totalBets / gameStats.totalShots : 0;

      return {
        success: true,
        data: data || [],
        stats: gameStats,
        pagination: {
          limit,
          offset,
          total: data?.length || 0,
          hasMore: (data?.length || 0) === limit
        }
      };

    } catch (error) {
      console.error('❌ [HISTORY] Erro inesperado:', error);
      return { success: false, error: error.message };
    }
  }

  // Obter histórico de depósitos
  async getUserDepositHistory(userId, options = {}) {
    try {
      const {
        limit = 50,
        offset = 0,
        status = null
      } = options;

      let query = this.supabase
        .from('pagamentos_pix')
        .select('*')
        .eq('usuario_id', userId);

      if (status) {
        query = query.eq('status', status);
      }

      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) {
        console.error('❌ [HISTORY] Erro ao buscar histórico de depósitos:', error);
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: data || [],
        pagination: {
          limit,
          offset,
          total: data?.length || 0,
          hasMore: (data?.length || 0) === limit
        }
      };

    } catch (error) {
      console.error('❌ [HISTORY] Erro inesperado:', error);
      return { success: false, error: error.message };
    }
  }

  // Obter histórico de saques
  async getUserWithdrawHistory(userId, options = {}) {
    try {
      const {
        limit = 50,
        offset = 0,
        status = null
      } = options;

      let query = this.supabase
        .from('saques')
        .select('*')
        .eq('usuario_id', userId);

      if (status) {
        query = query.eq('status', status);
      }

      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) {
        console.error('❌ [HISTORY] Erro ao buscar histórico de saques:', error);
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: data || [],
        pagination: {
          limit,
          offset,
          total: data?.length || 0,
          hasMore: (data?.length || 0) === limit
        }
      };

    } catch (error) {
      console.error('❌ [HISTORY] Erro inesperado:', error);
      return { success: false, error: error.message };
    }
  }

  // Exportar histórico para CSV
  async exportUserHistory(userId, format = 'csv', options = {}) {
    try {
      const history = await this.getUserCompleteHistory(userId, { limit: 10000, ...options });

      if (!history.success) {
        return { success: false, error: history.error };
      }

      if (format === 'csv') {
        const csvData = this.convertToCSV(history.data);
        return {
          success: true,
          data: csvData,
          filename: `historico_goldeouro_${userId}_${new Date().toISOString().split('T')[0]}.csv`,
          mimeType: 'text/csv'
        };
      }

      if (format === 'json') {
        return {
          success: true,
          data: history.data,
          filename: `historico_goldeouro_${userId}_${new Date().toISOString().split('T')[0]}.json`,
          mimeType: 'application/json'
        };
      }

      return { success: false, error: 'Formato não suportado' };

    } catch (error) {
      console.error('❌ [HISTORY] Erro inesperado:', error);
      return { success: false, error: error.message };
    }
  }

  // Converter dados para CSV
  convertToCSV(data) {
    if (!data || data.length === 0) {
      return 'Nenhum dado encontrado';
    }

    const headers = ['Data', 'Tipo', 'Valor', 'Descrição', 'Status', 'Referência'];
    const rows = data.map(item => [
      new Date(item.created_at).toLocaleString('pt-BR'),
      item.type,
      `R$ ${parseFloat(item.amount).toFixed(2)}`,
      item.description || '',
      item.status || '',
      item.reference_id || ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  }

  // Obter estatísticas globais do sistema
  async getSystemHistoryStats(options = {}) {
    try {
      const {
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate = new Date().toISOString()
      } = options;

      const { data, error } = await this.supabase
        .from('user_transaction_history')
        .select('type, amount, created_at')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (error) {
        console.error('❌ [HISTORY] Erro ao buscar estatísticas globais:', error);
        return { success: false, error: error.message };
      }

      const stats = {
        totalTransactions: data.length,
        totalVolume: 0,
        byType: {},
        dailyVolume: {},
        topUsers: {}
      };

      data.forEach(transaction => {
        const amount = parseFloat(transaction.amount) || 0;
        const type = transaction.type;
        const date = transaction.created_at.split('T')[0];

        stats.totalVolume += amount;

        // Por tipo
        if (!stats.byType[type]) {
          stats.byType[type] = { count: 0, total: 0 };
        }
        stats.byType[type].count++;
        stats.byType[type].total += amount;

        // Por dia
        if (!stats.dailyVolume[date]) {
          stats.dailyVolume[date] = 0;
        }
        stats.dailyVolume[date] += amount;
      });

      return { success: true, data: stats };

    } catch (error) {
      console.error('❌ [HISTORY] Erro inesperado:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = HistoryService;
