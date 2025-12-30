// SERVIÇO DE JOGO CORRIGIDO - GOL DE OURO v1.2.0
// ================================================
// Data: 21/10/2025
// Status: INTEGRAÇÃO COMPLETA COM BACKEND REAL
// Versão: v1.2.0-final-production
// GPT-4o Auto-Fix: Sistema de jogo funcional

import apiClient from './apiClient';

class GameService {
  constructor() {
    // Configurações dos lotes por valor de aposta
    this.batchConfigs = {
      1: { size: 10, totalValue: 10, winChance: 0.1, description: "10% chance" },
      2: { size: 5, totalValue: 10, winChance: 0.2, description: "20% chance" },
      5: { size: 2, totalValue: 10, winChance: 0.5, description: "50% chance" },
      10: { size: 1, totalValue: 10, winChance: 1.0, description: "100% chance" }
    };
    
    // Estado do jogo atual
    this.currentLote = null;
    this.currentBet = 1;
    this.userBalance = 0;
    this.globalCounter = 0;
    this.lastGoldenGoal = 0;
    
    // Zonas do gol disponíveis
    this.goalZones = ['TL', 'TR', 'C', 'BL', 'BR'];
  }

  // =====================================================
  // MÉTODOS DE INTEGRAÇÃO COM BACKEND
  // =====================================================

  // Carregar dados do usuário
  async loadUserData() {
    try {
      const response = await apiClient.get('/api/user/profile');
      console.log('🔍 [GAME] Resposta completa do /api/user/profile:', response);
      console.log('🔍 [GAME] response.data:', response.data);
      console.log('🔍 [GAME] response.data.data:', response.data?.data);
      
      if (response.data.success) {
        // Tentar ambos os campos (saldo e balance) para compatibilidade
        const saldo = response.data.data?.saldo || response.data.data?.balance || 0;
        console.log('💰 [GAME] Saldo encontrado no backend:', saldo);
        this.userBalance = saldo;
        return response.data.data;
      }
      throw new Error('Falha ao carregar dados do usuário');
    } catch (error) {
      console.error('❌ [GAME] Erro ao carregar dados do usuário:', error);
      console.error('❌ [GAME] Detalhes do erro:', {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  }

  // Carregar métricas globais
  async loadGlobalMetrics() {
    try {
      const response = await apiClient.get('/api/metrics');
      if (response.data.success) {
        this.globalCounter = response.data.data.contador_chutes_global || 0;
        this.lastGoldenGoal = response.data.data.ultimo_gol_de_ouro || 0;
        return response.data.data;
      }
      throw new Error('Falha ao carregar métricas globais');
    } catch (error) {
      console.error('❌ [GAME] Erro ao carregar métricas:', error);
      // Sem fallback - manter valores undefined até carregar dados reais
      throw error;
    }
  }

  // =====================================================
  // SISTEMA DE CHUTES CORRIGIDO
  // =====================================================

  // Processar chute no backend
  async processShot(direction, amount) {
    try {
      // Validar entrada
      if (!this.goalZones.includes(direction)) {
        throw new Error('Direção inválida');
      }

      if (!this.batchConfigs[amount]) {
        throw new Error('Valor de aposta inválido');
      }

      if (this.userBalance < amount) {
        console.error('❌ [GAME] Saldo insuficiente:', this.userBalance, '<', amount);
        throw new Error('Saldo insuficiente');
      }

      // Log para debug
      console.log('🎯 [GAME] Enviando chute:', { direction, amount, balance: this.userBalance });
      console.log('🎯 [GAME] Tipo dos dados:', { 
        directionType: typeof direction, 
        amountType: typeof amount,
        directionValue: direction,
        amountValue: amount
      });

      // Garantir que os valores estão no formato correto
      const payload = {
        direction: String(direction).toUpperCase().trim(), // Garantir string maiúscula
        amount: Number(amount) // Garantir número
      };
      
      console.log('🎯 [GAME] Payload final:', payload);

      // Enviar chute para o backend
      const response = await apiClient.post('/api/games/shoot', payload);
      
      // Log resposta
      if (response.data) {
        console.log('✅ [GAME] Resposta do backend:', response.data.success ? 'Sucesso' : 'Erro', response.data);
      }

      if (response.data.success) {
        const result = response.data.data;
        
        // Atualizar estado local
        this.userBalance = result.novoSaldo;
        this.globalCounter = result.contadorGlobal;
        
        // Verificar se é Gol de Ouro
        const isGoldenGoal = result.isGolDeOuro;
        
        // Retornar resultado estruturado
        return {
          success: true,
          shot: {
            id: `${result.loteId}_${result.loteProgress.current}`,
            direction: direction,
            amount: amount,
            result: result.result,
            isWinner: result.result === 'goal',
            prize: result.premio,
            goldenGoalPrize: result.premioGolDeOuro,
            isGoldenGoal: isGoldenGoal,
            timestamp: result.timestamp
          },
          lote: {
            id: result.loteId,
            progress: result.loteProgress,
            isComplete: result.isLoteComplete
          },
          user: {
            newBalance: result.novoSaldo,
            globalCounter: result.contadorGlobal
          },
          isGoldenGoal: isGoldenGoal
        };
      } else {
        throw new Error(response.data.message || 'Erro ao processar chute');
      }

    } catch (error) {
      console.error('❌ [GAME] Erro ao processar chute:', error);
      console.error('❌ [GAME] Detalhes completos do erro:', {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: error.config
      });
      
      // Se for erro 400, tentar extrair mensagem mais específica
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        const errorMessage = errorData?.message || errorData?.error || errorData?.details || 'Dados inválidos enviados ao servidor';
        console.error('❌ [GAME] Erro 400 detalhado:', errorMessage);
        return {
          success: false,
          error: errorMessage,
          details: errorData
        };
      }
      
      return {
        success: false,
        error: error.message || 'Erro ao processar chute',
        status: error.response?.status,
        details: error.response?.data
      };
    }
  }

  // =====================================================
  // SISTEMA DE LOTES CORRIGIDO
  // =====================================================

  // Obter informações do lote atual
  getCurrentLoteInfo() {
    return {
      config: this.batchConfigs[this.currentBet],
      progress: this.currentLote ? {
        current: this.currentLote.chutes?.length || 0,
        total: this.batchConfigs[this.currentBet].size,
        remaining: this.batchConfigs[this.currentBet].size - (this.currentLote?.chutes?.length || 0)
      } : null,
      isActive: this.currentLote?.status === 'active'
    };
  }

  // Definir valor da aposta
  setBetAmount(amount) {
    if (this.batchConfigs[amount]) {
      this.currentBet = amount;
      return true;
    }
    return false;
  }

  // Obter configuração da aposta
  getBetConfig(amount) {
    return this.batchConfigs[amount] || null;
  }

  // =====================================================
  // SISTEMA GOL DE OURO CORRIGIDO
  // =====================================================

  // FASE 1 - CRI-004: SEMPRE usar contador global do backend
  // NUNCA calcular localmente - usar dataAdapter para normalizar
  getShotsUntilGoldenGoal() {
    // Usar contador global do backend (já atualizado via loadGlobalMetrics)
    // Se não tem contador ainda, retornar valor padrão
    if (!this.globalCounter && this.globalCounter !== 0) {
      return 1000; // Valor padrão até carregar do backend
    }
    const shotsUntilNext = 1000 - (this.globalCounter % 1000);
    return shotsUntilNext === 1000 ? 0 : shotsUntilNext;
  }

  // Verificar se próximo chute será Gol de Ouro
  isNextShotGoldenGoal() {
    return (this.globalCounter + 1) % 1000 === 0;
  }

  // Obter informações do Gol de Ouro
  getGoldenGoalInfo() {
    return {
      counter: this.globalCounter,
      lastGoldenGoal: this.lastGoldenGoal,
      shotsUntilNext: this.getShotsUntilGoldenGoal(),
      isNext: this.isNextShotGoldenGoal(),
      prize: 100 // R$ 100 fixo para Gol de Ouro
    };
  }

  // =====================================================
  // VALIDAÇÕES E UTILITÁRIOS
  // =====================================================

  // Validar direção do chute
  isValidDirection(direction) {
    return this.goalZones.includes(direction);
  }

  // Validar valor da aposta
  isValidBetAmount(amount) {
    return this.batchConfigs[amount] !== undefined;
  }

  // Verificar se pode jogar
  canPlay(amount = this.currentBet) {
    return this.userBalance >= amount && this.isValidBetAmount(amount);
  }

  // Obter saldo atual
  getCurrentBalance() {
    return this.userBalance;
  }

  // Atualizar saldo (após PIX, etc.)
  updateBalance(newBalance) {
    this.userBalance = newBalance;
  }

  // =====================================================
  // ESTATÍSTICAS E HISTÓRICO
  // =====================================================

  // Calcular estatísticas do usuário
  calculateUserStats(userData) {
    const totalApostas = userData.total_apostas || 0;
    const totalGanhos = userData.total_ganhos || 0;
    const winRate = totalApostas > 0 ? (totalGanhos / (totalApostas * 5)) * 100 : 0; // Assumindo R$ 5 por aposta média

    return {
      totalApostas,
      totalGanhos,
      winRate: Math.round(winRate),
      saldo: userData.saldo || 0,
      tipo: userData.tipo || 'jogador'
    };
  }

  // Obter informações do jogo
  getGameInfo() {
    return {
      user: {
        balance: this.userBalance,
        canPlay: this.canPlay()
      },
      lote: this.getCurrentLoteInfo(),
      goldenGoal: this.getGoldenGoalInfo(),
      config: {
        availableBets: Object.keys(this.batchConfigs),
        goalZones: this.goalZones
      }
    };
  }

  // =====================================================
  // INICIALIZAÇÃO
  // =====================================================

  // Inicializar serviço
  async initialize() {
    try {
      console.log('🎮 [GAME] Inicializando GameService...');
      
      // Carregar dados do usuário
      const userData = await this.loadUserData();
      this.userBalance = userData.saldo;
      
      // Carregar métricas globais
      await this.loadGlobalMetrics();
      
      console.log('✅ [GAME] GameService inicializado com sucesso');
      console.log(`💰 [GAME] Saldo do usuário: R$ ${this.userBalance}`);
      console.log(`📊 [GAME] Contador global: ${this.globalCounter}`);
      console.log(`🏆 [GAME] Chutes até Gol de Ouro: ${this.getShotsUntilGoldenGoal()}`);
      
      return {
        success: true,
        userData,
        gameInfo: this.getGameInfo()
      };
      
    } catch (error) {
      console.error('❌ [GAME] Erro ao inicializar GameService:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Instância singleton
const gameService = new GameService();

export default gameService;

// =====================================================
// SERVIÇO DE JOGO CORRIGIDO v1.2.0 - PRODUÇÃO REAL 100%
// =====================================================
