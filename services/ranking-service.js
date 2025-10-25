// Sistema de Ranking e Estatísticas - Gol de Ouro v1.2.0
// =====================================================
const { createClient } = require('@supabase/supabase-js');

class RankingService {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }

  // Obter ranking geral de jogadores
  async getGeneralRanking(options = {}) {
    try {
      const {
        limit = 50,
        offset = 0,
        period = 'all', // 'all', 'month', 'week', 'day'
        sortBy = 'total_ganhos' // 'total_ganhos', 'total_apostas', 'win_rate', 'biggest_win'
      } = options;

      // Calcular período
      const periodFilter = this.getPeriodFilter(period);

      let query = this.supabase
        .from('usuarios')
        .select(`
          id,
          username,
          email,
          total_apostas,
          total_ganhos,
          saldo,
          created_at,
          chutes!inner (
            id,
            amount,
            result,
            premio,
            premio_gol_de_ouro,
            timestamp
          )
        `)
        .eq('ativo', true)
        .gte('total_apostas', 1); // Apenas usuários que jogaram

      if (periodFilter) {
        query = query.gte('chutes.timestamp', periodFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ [RANKING] Erro ao buscar ranking:', error);
        return { success: false, error: error.message };
      }

      // Processar dados e calcular estatísticas
      const processedData = this.processRankingData(data, period, sortBy);

      // Aplicar paginação
      const paginatedData = processedData.slice(offset, offset + limit);

      return {
        success: true,
        data: paginatedData,
        pagination: {
          limit,
          offset,
          total: processedData.length,
          hasMore: offset + limit < processedData.length
        },
        period,
        sortBy
      };

    } catch (error) {
      console.error('❌ [RANKING] Erro inesperado:', error);
      return { success: false, error: error.message };
    }
  }

  // Processar dados do ranking
  processRankingData(data, period, sortBy) {
    const processed = data.map(user => {
      const chutes = user.chutes || [];
      
      // Calcular estatísticas do período
      const periodStats = this.calculatePeriodStats(chutes, period);
      
      // Calcular taxa de vitória
      const winRate = chutes.length > 0 ? (periodStats.wins / chutes.length) * 100 : 0;
      
      // Calcular maior vitória
      const biggestWin = Math.max(
        ...chutes
          .filter(c => c.result === 'goal')
          .map(c => c.premio + c.premio_gol_de_ouro),
        0
      );

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        saldo: user.saldo,
        total_apostas: user.total_apostas,
        total_ganhos: user.total_ganhos,
        // Estatísticas do período
        period_stats: {
          bets: periodStats.bets,
          wins: periodStats.wins,
          total_bet_amount: periodStats.totalBetAmount,
          total_prize_amount: periodStats.totalPrizeAmount,
          win_rate: winRate,
          biggest_win: biggestWin,
          gol_de_ouro_count: periodStats.golDeOuroCount
        },
        // Métricas calculadas
        win_rate: winRate,
        biggest_win: biggestWin,
        average_bet: chutes.length > 0 ? periodStats.totalBetAmount / chutes.length : 0,
        profit_loss: periodStats.totalPrizeAmount - periodStats.totalBetAmount,
        created_at: user.created_at
      };
    });

    // Ordenar por critério selecionado
    return this.sortRankingData(processed, sortBy);
  }

  // Calcular estatísticas do período
  calculatePeriodStats(chutes, period) {
    const periodFilter = this.getPeriodFilter(period);
    const filteredChutes = periodFilter 
      ? chutes.filter(c => c.timestamp >= periodFilter)
      : chutes;

    const stats = {
      bets: filteredChutes.length,
      wins: 0,
      totalBetAmount: 0,
      totalPrizeAmount: 0,
      golDeOuroCount: 0
    };

    filteredChutes.forEach(chute => {
      stats.totalBetAmount += chute.amount;
      
      if (chute.result === 'goal') {
        stats.wins++;
        stats.totalPrizeAmount += chute.premio + chute.premio_gol_de_ouro;
        
        if (chute.premio_gol_de_ouro > 0) {
          stats.golDeOuroCount++;
        }
      }
    });

    return stats;
  }

  // Obter filtro de período
  getPeriodFilter(period) {
    const now = new Date();
    
    switch (period) {
      case 'day':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      default:
        return null;
    }
  }

  // Ordenar dados do ranking
  sortRankingData(data, sortBy) {
    return data.sort((a, b) => {
      switch (sortBy) {
        case 'total_ganhos':
          return b.total_ganhos - a.total_ganhos;
        case 'total_apostas':
          return b.total_apostas - a.total_apostas;
        case 'win_rate':
          return b.win_rate - a.win_rate;
        case 'biggest_win':
          return b.biggest_win - a.biggest_win;
        case 'profit_loss':
          return b.period_stats.total_prize_amount - b.period_stats.total_bet_amount - 
                 (a.period_stats.total_prize_amount - a.period_stats.total_bet_amount);
        default:
          return b.total_ganhos - a.total_ganhos;
      }
    });
  }

  // Obter ranking por categoria específica
  async getCategoryRanking(category, options = {}) {
    try {
      const {
        limit = 20,
        period = 'all'
      } = options;

      let query;
      
      switch (category) {
        case 'biggest_winners':
          query = this.supabase
            .from('usuarios')
            .select('id, username, total_ganhos, saldo')
            .eq('ativo', true)
            .gte('total_ganhos', 0)
            .order('total_ganhos', { ascending: false });
          break;

        case 'most_active':
          query = this.supabase
            .from('usuarios')
            .select('id, username, total_apostas, saldo')
            .eq('ativo', true)
            .gte('total_apostas', 1)
            .order('total_apostas', { ascending: false });
          break;

        case 'best_win_rate':
          // Buscar usuários com pelo menos 10 apostas
          query = this.supabase
            .from('usuarios')
            .select(`
              id,
              username,
              total_apostas,
              total_ganhos,
              saldo,
              chutes!inner (
                id,
                result,
                timestamp
              )
            `)
            .eq('ativo', true)
            .gte('total_apostas', 10);
          break;

        case 'gol_de_ouro':
          query = this.supabase
            .from('usuarios')
            .select(`
              id,
              username,
              total_ganhos,
              saldo,
              chutes!inner (
                id,
                premio_gol_de_ouro,
                timestamp
              )
            `)
            .eq('ativo', true)
            .gte('chutes.premio_gol_de_ouro', 0);
          break;

        default:
          return { success: false, error: 'Categoria não encontrada' };
      }

      const { data, error } = await query.limit(limit);

      if (error) {
        console.error('❌ [RANKING] Erro ao buscar ranking por categoria:', error);
        return { success: false, error: error.message };
      }

      // Processar dados específicos da categoria
      const processedData = this.processCategoryData(data, category);

      return {
        success: true,
        data: processedData,
        category,
        period
      };

    } catch (error) {
      console.error('❌ [RANKING] Erro inesperado:', error);
      return { success: false, error: error.message };
    }
  }

  // Processar dados por categoria
  processCategoryData(data, category) {
    switch (category) {
      case 'biggest_winners':
        return data.map(user => ({
          id: user.id,
          username: user.username,
          total_ganhos: user.total_ganhos,
          saldo: user.saldo,
          rank: data.indexOf(user) + 1
        }));

      case 'most_active':
        return data.map(user => ({
          id: user.id,
          username: user.username,
          total_apostas: user.total_apostas,
          saldo: user.saldo,
          rank: data.indexOf(user) + 1
        }));

      case 'best_win_rate':
        return data
          .map(user => {
            const chutes = user.chutes || [];
            const wins = chutes.filter(c => c.result === 'goal').length;
            const winRate = chutes.length > 0 ? (wins / chutes.length) * 100 : 0;
            
            return {
              id: user.id,
              username: user.username,
              total_apostas: user.total_apostas,
              total_ganhos: user.total_ganhos,
              win_rate: winRate,
              saldo: user.saldo
            };
          })
          .sort((a, b) => b.win_rate - a.win_rate)
          .map((user, index) => ({ ...user, rank: index + 1 }));

      case 'gol_de_ouro':
        return data
          .map(user => {
            const chutes = user.chutes || [];
            const golDeOuroCount = chutes.filter(c => c.premio_gol_de_ouro > 0).length;
            const totalGolDeOuro = chutes.reduce((sum, c) => sum + c.premio_gol_de_ouro, 0);
            
            return {
              id: user.id,
              username: user.username,
              gol_de_ouro_count: golDeOuroCount,
              total_gol_de_ouro: totalGolDeOuro,
              total_ganhos: user.total_ganhos,
              saldo: user.saldo
            };
          })
          .sort((a, b) => b.gol_de_ouro_count - a.gol_de_ouro_count)
          .map((user, index) => ({ ...user, rank: index + 1 }));

      default:
        return data;
    }
  }

  // Obter posição do usuário no ranking
  async getUserRankingPosition(userId, sortBy = 'total_ganhos') {
    try {
      const ranking = await this.getGeneralRanking({ limit: 1000, sortBy });
      
      if (!ranking.success) {
        return { success: false, error: ranking.error };
      }

      const userPosition = ranking.data.findIndex(user => user.id === userId);
      
      if (userPosition === -1) {
        return { success: false, error: 'Usuário não encontrado no ranking' };
      }

      return {
        success: true,
        position: userPosition + 1,
        total_players: ranking.data.length,
        percentile: Math.round(((ranking.data.length - userPosition) / ranking.data.length) * 100)
      };

    } catch (error) {
      console.error('❌ [RANKING] Erro inesperado:', error);
      return { success: false, error: error.message };
    }
  }

  // Obter estatísticas do usuário
  async getUserStats(userId) {
    try {
      const { data: user, error: userError } = await this.supabase
        .from('usuarios')
        .select(`
          id,
          username,
          email,
          total_apostas,
          total_ganhos,
          saldo,
          created_at,
          chutes (
            id,
            amount,
            result,
            premio,
            premio_gol_de_ouro,
            timestamp
          )
        `)
        .eq('id', userId)
        .single();

      if (userError) {
        console.error('❌ [RANKING] Erro ao buscar usuário:', userError);
        return { success: false, error: userError.message };
      }

      const chutes = user.chutes || [];
      const wins = chutes.filter(c => c.result === 'goal').length;
      const golDeOuroCount = chutes.filter(c => c.premio_gol_de_ouro > 0).length;
      
      const stats = {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          saldo: user.saldo,
          member_since: user.created_at
        },
        game_stats: {
          total_bets: user.total_apostas,
          total_wins: wins,
          win_rate: chutes.length > 0 ? (wins / chutes.length) * 100 : 0,
          total_bet_amount: chutes.reduce((sum, c) => sum + c.amount, 0),
          total_prize_amount: user.total_ganhos,
          biggest_win: Math.max(...chutes.map(c => c.premio + c.premio_gol_de_ouro), 0),
          gol_de_ouro_count: golDeOuroCount,
          average_bet: chutes.length > 0 ? chutes.reduce((sum, c) => sum + c.amount, 0) / chutes.length : 0
        },
        recent_activity: chutes
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, 10)
      };

      return { success: true, data: stats };

    } catch (error) {
      console.error('❌ [RANKING] Erro inesperado:', error);
      return { success: false, error: error.message };
    }
  }

  // Obter estatísticas globais do sistema
  async getSystemStats() {
    try {
      const { data: users, error: usersError } = await this.supabase
        .from('usuarios')
        .select('id, total_apostas, total_ganhos, created_at')
        .eq('ativo', true);

      if (usersError) {
        console.error('❌ [RANKING] Erro ao buscar usuários:', usersError);
        return { success: false, error: usersError.message };
      }

      const { data: chutes, error: chutesError } = await this.supabase
        .from('chutes')
        .select('amount, result, premio, premio_gol_de_ouro, timestamp');

      if (chutesError) {
        console.error('❌ [RANKING] Erro ao buscar chutes:', chutesError);
        return { success: false, error: chutesError.message };
      }

      const stats = {
        total_players: users.length,
        active_players: users.filter(u => u.total_apostas > 0).length,
        total_bets: chutes.length,
        total_volume: chutes.reduce((sum, c) => sum + c.amount, 0),
        total_prizes: chutes.reduce((sum, c) => sum + c.premio + c.premio_gol_de_ouro, 0),
        gol_de_ouro_count: chutes.filter(c => c.premio_gol_de_ouro > 0).length,
        average_bet: chutes.length > 0 ? chutes.reduce((sum, c) => sum + c.amount, 0) / chutes.length : 0,
        win_rate: chutes.length > 0 ? (chutes.filter(c => c.result === 'goal').length / chutes.length) * 100 : 0,
        new_players_today: users.filter(u => 
          new Date(u.created_at).toDateString() === new Date().toDateString()
        ).length
      };

      return { success: true, data: stats };

    } catch (error) {
      console.error('❌ [RANKING] Erro inesperado:', error);
      return { success: false, error: error.message };
    }
  }

  // Atualizar ranking (executar periodicamente)
  async updateRanking() {
    try {
      console.log('🔄 [RANKING] Atualizando ranking...');
      
      // Buscar todos os usuários ativos
      const { data: users, error } = await this.supabase
        .from('usuarios')
        .select('id, total_apostas, total_ganhos')
        .eq('ativo', true);

      if (error) {
        console.error('❌ [RANKING] Erro ao buscar usuários:', error);
        return { success: false, error: error.message };
      }

      // Calcular posições
      const sortedUsers = users
        .filter(u => u.total_apostas > 0)
        .sort((a, b) => b.total_ganhos - a.total_ganhos);

      // Atualizar posições no banco
      for (let i = 0; i < sortedUsers.length; i++) {
        const user = sortedUsers[i];
        await this.supabase
          .from('usuarios')
          .update({ ranking_position: i + 1 })
          .eq('id', user.id);
      }

      console.log(`✅ [RANKING] Ranking atualizado para ${sortedUsers.length} usuários`);
      return { success: true, updated_users: sortedUsers.length };

    } catch (error) {
      console.error('❌ [RANKING] Erro inesperado:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = RankingService;
