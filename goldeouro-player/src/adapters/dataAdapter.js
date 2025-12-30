// Adaptador de Normalização de Dados
// CRI-010: Garantir que dados nulos/incompletos sejam tratados corretamente
// Gol de Ouro Player - Engine V19 Integration
// Data: 18/12/2025

/**
 * Adaptador para normalizar dados recebidos da Engine V19
 * Garante que dados nulos, incompletos ou inesperados sejam tratados graciosamente
 * SEM alterar a UI - apenas normaliza os dados antes de serem exibidos
 */
class DataAdapter {
  /**
   * Normalizar resposta padrão da Engine V19
   * Formato esperado: { success: boolean, data: {...}, message?: string }
   */
  normalizeResponse(response) {
    // Se já é um objeto normalizado, retornar como está
    if (response && typeof response === 'object' && 'success' in response) {
      return {
        success: response.success || false,
        data: this.normalizeData(response.data),
        message: response.message || null,
        timestamp: response.timestamp || null
      };
    }

    // Se é uma resposta do axios
    if (response && response.data) {
      return this.normalizeResponse(response.data);
    }

    // Fallback: tratar como erro
    return {
      success: false,
      data: null,
      message: 'Resposta inválida do servidor',
      timestamp: null
    };
  }

  /**
   * Normalizar dados genéricos
   * Garante que valores nulos/undefined sejam substituídos por valores padrão apropriados
   */
  normalizeData(data) {
    if (data === null || data === undefined) {
      return null;
    }

    // Se é array, normalizar cada item
    if (Array.isArray(data)) {
      return data.map(item => this.normalizeData(item));
    }

    // Se é objeto, normalizar propriedades
    if (typeof data === 'object') {
      const normalized = {};
      for (const [key, value] of Object.entries(data)) {
        normalized[key] = this.normalizeValue(value);
      }
      return normalized;
    }

    return data;
  }

  /**
   * Normalizar valor individual
   */
  normalizeValue(value) {
    if (value === null || value === undefined) {
      return null;
    }

    // Se é objeto ou array, normalizar recursivamente
    if (typeof value === 'object') {
      return this.normalizeData(value);
    }

    return value;
  }

  /**
   * Normalizar dados do usuário
   * Garante estrutura completa mesmo com dados incompletos
   */
  normalizeUser(userData) {
    if (!userData) {
      return null;
    }

    return {
      id: userData.id || null,
      email: userData.email || '',
      nome: userData.nome || userData.name || '',
      username: userData.username || userData.nome || userData.name || '',
      saldo: this.normalizeNumber(userData.saldo || userData.balance || 0),
      tipo: userData.tipo || userData.type || 'player',
      ativo: userData.ativo !== undefined ? userData.ativo : true,
      ...this.normalizeData(userData)
    };
  }

  /**
   * Normalizar número (garantir que seja número válido)
   */
  normalizeNumber(value) {
    if (value === null || value === undefined) {
      return 0;
    }

    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? 0 : num;
  }

  /**
   * Normalizar dados de jogo
   * Garante estrutura completa para resposta de chute
   */
  normalizeGameResult(gameData) {
    if (!gameData) {
      return null;
    }

    return {
      result: gameData.result || null,
      premio: this.normalizeNumber(gameData.premio || 0),
      premioGolDeOuro: this.normalizeNumber(gameData.premioGolDeOuro || 0),
      loteProgress: this.normalizeNumber(gameData.loteProgress || 0),
      novoSaldo: this.normalizeNumber(gameData.novoSaldo || 0),
      contadorGlobal: this.normalizeNumber(gameData.contadorGlobal || 0),
      isGolDeOuro: gameData.isGolDeOuro === true,
      shotsUntilGoldenGoal: this.calculateShotsUntilGoldenGoal(
        this.normalizeNumber(gameData.contadorGlobal || 0)
      ),
      ...this.normalizeData(gameData)
    };
  }

  /**
   * Calcular shotsUntilGoldenGoal baseado no contador global do backend
   * SEMPRE usar valor do backend, nunca calcular localmente
   */
  calculateShotsUntilGoldenGoal(contadorGlobal) {
    if (!contadorGlobal || contadorGlobal < 0) {
      return 1000;
    }
    return 1000 - (contadorGlobal % 1000);
  }

  /**
   * Normalizar métricas globais
   */
  normalizeGlobalMetrics(metricsData) {
    if (!metricsData) {
      return {
        contadorGlobal: 0,
        ultimoGolDeOuro: null,
        shotsUntilGoldenGoal: 1000
      };
    }

    const contadorGlobal = this.normalizeNumber(
      metricsData.contador_chutes_global || 
      metricsData.contadorGlobal || 
      0
    );

    return {
      contadorGlobal,
      ultimoGolDeOuro: metricsData.ultimo_gol_de_ouro || metricsData.ultimoGolDeOuro || null,
      shotsUntilGoldenGoal: this.calculateShotsUntilGoldenGoal(contadorGlobal)
    };
  }

  /**
   * Normalizar histórico de pagamentos PIX
   */
  normalizePixHistory(historyData) {
    if (!historyData || !Array.isArray(historyData)) {
      return [];
    }

    return historyData.map(item => ({
      id: item.id || null,
      valor: this.normalizeNumber(item.valor || item.amount || 0),
      status: item.status || 'pending',
      data_criacao: item.data_criacao || item.created_at || null,
      data_atualizacao: item.data_atualizacao || item.updated_at || null,
      ...this.normalizeData(item)
    }));
  }

  /**
   * Normalizar dados do Admin Dashboard
   */
  normalizeAdminStats(statsData) {
    if (!statsData) {
      return {
        totalUsers: 0,
        activeUsers: 0,
        totalGames: 0,
        totalTransactions: 0,
        totalRevenue: 0,
        totalWithdrawals: 0,
        netBalance: 0
      };
    }

    return {
      totalUsers: this.normalizeNumber(statsData.totalUsers || 0),
      activeUsers: this.normalizeNumber(statsData.activeUsers || 0),
      totalGames: this.normalizeNumber(
        statsData.totalGames || 
        statsData.totalShots || 
        0
      ),
      totalTransactions: this.normalizeNumber(statsData.totalTransactions || 0),
      totalRevenue: this.normalizeNumber(statsData.totalRevenue || 0),
      totalWithdrawals: this.normalizeNumber(statsData.totalWithdrawals || 0),
      netBalance: this.normalizeNumber(statsData.netBalance || 0),
      ...this.normalizeData(statsData)
    };
  }

  /**
   * Validar estrutura de resposta antes de normalizar
   */
  validateResponse(response) {
    if (!response) {
      return {
        valid: false,
        error: 'Resposta vazia do servidor'
      };
    }

    // Se é resposta do axios
    if (response.data) {
      return this.validateResponse(response.data);
    }

    // Validar formato padrão da Engine V19
    if (typeof response === 'object' && 'success' in response) {
      return {
        valid: true,
        error: null
      };
    }

    return {
      valid: false,
      error: 'Formato de resposta inválido'
    };
  }
}

export default new DataAdapter();

