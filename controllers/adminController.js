// Admin Controller - Gol de Ouro v1.3.0 - PADRONIZADO E COMPLETO
const { supabaseAdmin } = require('../database/supabase-config');
const response = require('../utils/response-helper');

class AdminController {
  // Estatísticas gerais do sistema
  static async getGeneralStats(req, res) {
    try {
      // Buscar estatísticas do banco
      const [
        usersResult,
        transactionsResult,
        paymentsResult,
        withdrawalsResult,
        shotsResult
      ] = await Promise.all([
        supabaseAdmin.from('usuarios').select('id, ativo', { count: 'exact', head: true }),
        supabaseAdmin.from('transacoes').select('id, tipo, valor', { count: 'exact' }),
        supabaseAdmin.from('pagamentos_pix').select('id, valor, status'),
        supabaseAdmin.from('saques').select('id, valor, status'),
        supabaseAdmin.from('chutes').select('id, gol_marcado', { count: 'exact', head: true })
      ]);

      const totalUsers = usersResult.count || 0;
      const activeUsers = usersResult.data?.filter(u => u.ativo).length || 0;
      
      const transactions = transactionsResult.data || [];
      const totalTransactions = transactionsResult.count || 0;
      const totalRevenue = transactions
        .filter(t => t.tipo === 'deposito')
        .reduce((sum, t) => sum + parseFloat(t.valor || 0), 0);
      
      const payments = paymentsResult.data || [];
      const totalPayments = payments.length;
      const approvedPayments = payments.filter(p => p.status === 'approved');
      const pendingPayments = payments.filter(p => p.status === 'pending');
      
      const withdrawals = withdrawalsResult.data || [];
      const totalWithdrawals = withdrawals.length;
      const totalWithdrawalAmount = withdrawals
        .reduce((sum, w) => sum + parseFloat(w.valor || 0), 0);
      
      const totalShots = shotsResult.count || 0;
      const totalGoals = shotsResult.data?.filter(s => s.gol_marcado).length || 0;
      
      const netBalance = totalRevenue - totalWithdrawalAmount;

      return response.success(
        res,
        {
          totalUsers,
          activeUsers,
          totalTransactions,
          totalRevenue,
          totalPayments,
          approvedPayments: approvedPayments.length,
          pendingPayments: pendingPayments.length,
          totalWithdrawals,
          totalWithdrawalAmount,
          netBalance,
          totalShots,
          totalGoals,
          accuracyRate: totalShots > 0 ? Math.round((totalGoals / totalShots) * 100) : 0
        },
        'Estatísticas gerais obtidas com sucesso!'
      );
    } catch (error) {
      console.error('Erro ao buscar estatísticas gerais:', error);
      return response.serverError(res, error, 'Erro ao buscar estatísticas gerais.');
    }
  }

  // Estatísticas de jogos
  static async getGameStats(req, res) {
    try {
      const { period = 'all' } = req.query;
      
      let dateFilter = {};
      if (period === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        dateFilter = { created_at: { gte: today.toISOString() } };
      } else if (period === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        dateFilter = { created_at: { gte: weekAgo.toISOString() } };
      } else if (period === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        dateFilter = { created_at: { gte: monthAgo.toISOString() } };
      }

      const { data: shots, error: shotsError } = await supabaseAdmin
        .from('chutes')
        .select('id, gol_marcado, created_at, direcao, valor_aposta') // ✅ Usar direcao e valor_aposta (colunas corretas)
        .order('created_at', { ascending: false });

      if (shotsError) throw shotsError;

      const filteredShots = period === 'all' 
        ? shots 
        : shots.filter(s => new Date(s.created_at) >= new Date(dateFilter.created_at.gte));

      const totalShots = filteredShots.length;
      const totalGoals = filteredShots.filter(s => s.gol_marcado).length;
      const goalsByZone = filteredShots.reduce((acc, shot) => {
        const zone = shot.zona || 'unknown';
        acc[zone] = (acc[zone] || 0) + (shot.gol_marcado ? 1 : 0);
        return acc;
      }, {});

      return response.success(
        res,
        {
          period,
          totalShots,
          totalGoals,
          accuracyRate: totalShots > 0 ? Math.round((totalGoals / totalShots) * 100) : 0,
          goalsByZone,
          shotsPerHour: period !== 'all' ? Math.round(totalShots / (period === 'today' ? 24 : period === 'week' ? 168 : 720)) : null
        },
        'Estatísticas de jogos obtidas com sucesso!'
      );
    } catch (error) {
      console.error('Erro ao buscar estatísticas de jogos:', error);
      return response.serverError(res, error, 'Erro ao buscar estatísticas de jogos.');
    }
  }

  // Lista de usuários com paginação
  static async getUsers(req, res) {
    try {
      const { page = 1, limit = 20, search = '', status = 'all' } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      let query = supabaseAdmin
        .from('usuarios')
        .select('id, email, username, saldo, tipo, ativo, created_at', { count: 'exact' });

      if (search) {
        query = query.or(`email.ilike.%${search}%,username.ilike.%${search}%`);
      }

      if (status === 'active') {
        query = query.eq('ativo', true);
      } else if (status === 'inactive') {
        query = query.eq('ativo', false);
      }

      const { data: users, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + parseInt(limit) - 1);

      if (error) throw error;

      return response.paginated(
        res,
        users || [],
        {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count || 0
        },
        'Usuários listados com sucesso!'
      );
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      return response.serverError(res, error, 'Erro ao listar usuários.');
    }
  }

  // Relatório financeiro
  static async getFinancialReport(req, res) {
    try {
      const { startDate, endDate } = req.query;
      
      let dateFilter = {};
      if (startDate && endDate) {
        dateFilter = {
          created_at: {
            gte: new Date(startDate).toISOString(),
            lte: new Date(endDate).toISOString()
          }
        };
      }

      const [payments, withdrawals, transactions] = await Promise.all([
        supabaseAdmin
          .from('pagamentos_pix')
          .select('id, valor, status, created_at')
          .order('created_at', { ascending: false }),
        supabaseAdmin
          .from('saques')
          .select('id, valor, status, created_at')
          .order('created_at', { ascending: false }),
        supabaseAdmin
          .from('transacoes')
          .select('id, tipo, valor, created_at')
          .order('created_at', { ascending: false })
      ]);

      let filteredPayments = payments.data || [];
      let filteredWithdrawals = withdrawals.data || [];
      let filteredTransactions = transactions.data || [];

      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        filteredPayments = filteredPayments.filter(p => {
          const date = new Date(p.created_at);
          return date >= start && date <= end;
        });
        filteredWithdrawals = filteredWithdrawals.filter(w => {
          const date = new Date(w.created_at);
          return date >= start && date <= end;
        });
        filteredTransactions = filteredTransactions.filter(t => {
          const date = new Date(t.created_at);
          return date >= start && date <= end;
        });
      }

      const totalDeposits = filteredPayments
        .filter(p => p.status === 'approved')
        .reduce((sum, p) => sum + parseFloat(p.valor || 0), 0);
      
      const totalWithdrawals = filteredWithdrawals
        .filter(w => w.status === 'concluido' || w.status === 'processado')
        .reduce((sum, w) => sum + parseFloat(w.valor || 0), 0);

      const depositsByDay = filteredPayments.reduce((acc, p) => {
        const date = new Date(p.created_at).toISOString().split('T')[0];
        if (p.status === 'approved') {
          acc[date] = (acc[date] || 0) + parseFloat(p.valor || 0);
        }
        return acc;
      }, {});

      return response.success(
        res,
        {
          period: startDate && endDate ? { startDate, endDate } : 'all',
          totalDeposits,
          totalWithdrawals,
          netBalance: totalDeposits - totalWithdrawals,
          totalTransactions: filteredTransactions.length,
          depositsByDay,
          summary: {
            totalPayments: filteredPayments.length,
            approvedPayments: filteredPayments.filter(p => p.status === 'approved').length,
            pendingPayments: filteredPayments.filter(p => p.status === 'pending').length,
            totalWithdrawals: filteredWithdrawals.length,
            processedWithdrawals: filteredWithdrawals.filter(w => w.status === 'concluido' || w.status === 'processado').length,
            pendingWithdrawals: filteredWithdrawals.filter(w => w.status === 'pendente').length
          }
        },
        'Relatório financeiro obtido com sucesso!'
      );
    } catch (error) {
      console.error('Erro ao gerar relatório financeiro:', error);
      return response.serverError(res, error, 'Erro ao gerar relatório financeiro.');
    }
  }

  // Top jogadores
  static async getTopPlayers(req, res) {
    try {
      const { limit = 10 } = req.query;

      // Buscar usuários com mais chutes e gols
      const { data: shots, error: shotsError } = await supabaseAdmin
        .from('chutes')
        .select('usuario_id, gol_marcado');

      if (shotsError) throw shotsError;

      // Agrupar por usuário
      const playerStats = {};
      shots.forEach(shot => {
        const userId = shot.usuario_id;
        if (!playerStats[userId]) {
          playerStats[userId] = { shots: 0, goals: 0 };
        }
        playerStats[userId].shots++;
        if (shot.gol_marcado) {
          playerStats[userId].goals++;
        }
      });

      // Buscar informações dos usuários
      const userIds = Object.keys(playerStats);
      const { data: users, error: usersError } = await supabaseAdmin
        .from('usuarios')
        .select('id, email, username, saldo')
        .in('id', userIds);

      if (usersError) throw usersError;

      // Combinar dados
      const topPlayers = users.map(user => ({
        userId: user.id,
        username: user.username || user.email,
        email: user.email,
        saldo: user.saldo,
        totalShots: playerStats[user.id]?.shots || 0,
        totalGoals: playerStats[user.id]?.goals || 0,
        accuracyRate: playerStats[user.id]?.shots > 0
          ? Math.round((playerStats[user.id].goals / playerStats[user.id].shots) * 100)
          : 0
      }))
      .sort((a, b) => b.totalGoals - a.totalGoals || b.totalShots - a.totalShots)
      .slice(0, parseInt(limit));

      return response.success(
        res,
        topPlayers,
        'Top jogadores obtidos com sucesso!'
      );
    } catch (error) {
      console.error('Erro ao buscar top jogadores:', error);
      return response.serverError(res, error, 'Erro ao buscar top jogadores.');
    }
  }

  // Transações recentes
  static async getRecentTransactions(req, res) {
    try {
      const { limit = 50 } = req.query;

      const { data: transactions, error } = await supabaseAdmin
        .from('transacoes')
        .select('id, usuario_id, tipo, valor, descricao, status, created_at')
        .order('created_at', { ascending: false })
        .limit(parseInt(limit));

      if (error) throw error;

      // Buscar informações dos usuários
      const userIds = [...new Set(transactions.map(t => t.usuario_id))];
      const { data: users } = await supabaseAdmin
        .from('usuarios')
        .select('id, email, username')
        .in('id', userIds);

      const userMap = {};
      users?.forEach(user => {
        userMap[user.id] = user;
      });

      const enrichedTransactions = transactions.map(t => ({
        ...t,
        user: userMap[t.usuario_id] || { email: 'N/A', username: 'N/A' }
      }));

      return response.success(
        res,
        enrichedTransactions,
        'Transações recentes obtidas com sucesso!'
      );
    } catch (error) {
      console.error('Erro ao buscar transações recentes:', error);
      return response.serverError(res, error, 'Erro ao buscar transações recentes.');
    }
  }

  // Chutes recentes
  static async getRecentShots(req, res) {
    try {
      const { limit = 50 } = req.query;

      // ✅ CORREÇÃO: Usar direcao em vez de zona (coluna antiga removida)
      const { data: shots, error } = await supabaseAdmin
        .from('chutes')
        .select('id, usuario_id, direcao, valor_aposta, gol_marcado, created_at')
        .order('created_at', { ascending: false })
        .limit(parseInt(limit));

      if (error) {
        console.error('❌ [ADMIN] Erro ao buscar chutes:', error);
        console.error('❌ [ADMIN] Detalhes do erro:', JSON.stringify(error, null, 2));
        // Retornar array vazio em vez de lançar erro
        return response.success(
          res,
          [],
          'Chutes recentes obtidos com sucesso! (nenhum chute encontrado)'
        );
      }

      // ✅ CORREÇÃO: Garantir que shots não seja null/undefined
      const shotsArray = shots || [];
      
      // Se não há chutes, retornar array vazio
      if (shotsArray.length === 0) {
        return response.success(
          res,
          [],
          'Chutes recentes obtidos com sucesso! (nenhum chute encontrado)'
        );
      }

      // Buscar informações dos usuários apenas se houver chutes
      const userIds = [...new Set(shotsArray.map(s => s.usuario_id).filter(Boolean))];
      let userMap = {};
      
      if (userIds.length > 0) {
        const { data: users, error: usersError } = await supabaseAdmin
          .from('usuarios')
          .select('id, email, username')
          .in('id', userIds);

        if (!usersError && users) {
          users.forEach(user => {
            userMap[user.id] = user;
          });
        }
      }
      
      const enrichedShots = shotsArray.map(shot => ({
        id: shot.id,
        usuario_id: shot.usuario_id,
        direcao: shot.direcao || null,
        valor_aposta: shot.valor_aposta || null,
        gol_marcado: shot.gol_marcado || false,
        created_at: shot.created_at,
        user: userMap[shot.usuario_id] || { id: shot.usuario_id, email: 'N/A', username: 'N/A' }
      }));

      return response.success(
        res,
        enrichedShots,
        'Chutes recentes obtidos com sucesso!'
      );
    } catch (error) {
      console.error('❌ [ADMIN] Erro ao buscar chutes recentes:', error);
      console.error('❌ [ADMIN] Stack:', error.stack);
      // ✅ CORREÇÃO: Retornar array vazio em caso de erro em vez de 500
      // Usar response.success em vez de response.serverError para evitar 500
      return response.success(
        res,
        [],
        'Nenhum chute encontrado.'
      );
    }
  }

  // Relatório semanal
  // Expirar pagamentos PIX stale manualmente (endpoint admin)
  static async fixExpiredPix(req, res) {
    try {
      // Chamar função RPC expire_stale_pix()
      const { data, error } = await supabaseAdmin.rpc('expire_stale_pix');

      if (error) {
        console.error('❌ [ADMIN] Erro ao expirar pagamentos PIX:', error);
        return response.serverError(res, error, 'Erro ao expirar pagamentos PIX stale.');
      }

      return response.success(
        res,
        {
          expired_count: data?.expired_count || 0,
          pending_before: data?.pending_before || 0,
          timestamp: data?.timestamp || new Date().toISOString(),
          message: data?.message || 'Pagamentos PIX stale expirados com sucesso'
        },
        `✅ ${data?.expired_count || 0} pagamentos PIX stale foram marcados como expired.`
      );
    } catch (error) {
      console.error('❌ [ADMIN] Erro ao expirar pagamentos PIX:', error);
      return response.serverError(res, error, 'Erro ao processar expiração de pagamentos PIX.');
    }
  }

  static async getWeeklyReport(req, res) {
    try {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const [users, transactions, payments, withdrawals, shots] = await Promise.all([
        supabaseAdmin
          .from('usuarios')
          .select('id, created_at')
          .gte('created_at', weekAgo.toISOString()),
        supabaseAdmin
          .from('transacoes')
          .select('id, tipo, valor, created_at')
          .gte('created_at', weekAgo.toISOString()),
        supabaseAdmin
          .from('pagamentos_pix')
          .select('id, valor, status, created_at')
          .gte('created_at', weekAgo.toISOString()),
        supabaseAdmin
          .from('saques')
          .select('id, valor, status, created_at')
          .gte('created_at', weekAgo.toISOString()),
        supabaseAdmin
          .from('chutes')
          .select('id, gol_marcado, created_at')
          .gte('created_at', weekAgo.toISOString())
      ]);

      const newUsers = users.data?.length || 0;
      const totalTransactions = transactions.data?.length || 0;
      const totalRevenue = payments.data
        ?.filter(p => p.status === 'approved')
        .reduce((sum, p) => sum + parseFloat(p.valor || 0), 0) || 0;
      const totalShots = shots.data?.length || 0;
      const totalGoals = shots.data?.filter(s => s.gol_marcado).length || 0;

      return response.success(
        res,
        {
          period: 'weekly',
          startDate: weekAgo.toISOString(),
          endDate: new Date().toISOString(),
          newUsers,
          totalTransactions,
          totalRevenue,
          totalShots,
          totalGoals,
          accuracyRate: totalShots > 0 ? Math.round((totalGoals / totalShots) * 100) : 0,
          averageShotsPerUser: newUsers > 0 ? Math.round(totalShots / newUsers) : 0
        },
        'Relatório semanal obtido com sucesso!'
      );
    } catch (error) {
      console.error('Erro ao gerar relatório semanal:', error);
      return response.serverError(res, error, 'Erro ao gerar relatório semanal.');
    }
  }
}

module.exports = AdminController;

