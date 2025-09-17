// Serviço de Jogos - Gol de Ouro Player
import api from '../config/axiosConfig';
import { API_ENDPOINTS } from '../config/api';

class GameService {
  constructor() {
    this.gameStatuses = {
      WAITING: 'waiting',
      IN_QUEUE: 'in_queue',
      IN_GAME: 'in_game',
      FINISHED: 'finished',
      CANCELLED: 'cancelled'
    };

    this.shotZones = {
      TOP_LEFT: 'top_left',
      TOP_CENTER: 'top_center',
      TOP_RIGHT: 'top_right',
      MIDDLE_LEFT: 'middle_left',
      MIDDLE_CENTER: 'middle_center',
      MIDDLE_RIGHT: 'middle_right',
      BOTTOM_LEFT: 'bottom_left',
      BOTTOM_CENTER: 'bottom_center',
      BOTTOM_RIGHT: 'bottom_right'
    };

    this.shotResults = {
      GOAL: 'goal',
      SAVE: 'save',
      MISS: 'miss'
    };
  }

  // Entrar na fila de jogos
  async joinQueue() {
    try {
      const response = await api.post(API_ENDPOINTS.GAMES_QUEUE_ENTRAR);
      
      return { 
        success: true, 
        game: response.data,
        position: response.data.position || 1
      };
    } catch (error) {
      console.error('Erro ao entrar na fila:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erro ao entrar na fila' 
      };
    }
  }

  // Sair da fila de jogos
  async leaveQueue() {
    try {
      const response = await api.delete(API_ENDPOINTS.GAMES_QUEUE_ENTRAR);
      
      return { 
        success: true, 
        message: 'Saiu da fila com sucesso'
      };
    } catch (error) {
      console.error('Erro ao sair da fila:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erro ao sair da fila' 
      };
    }
  }

  // Obter status do jogo atual
  async getGameStatus() {
    try {
      const response = await api.get(API_ENDPOINTS.GAMES_STATUS);
      
      return { 
        success: true, 
        game: response.data,
        status: response.data.status
      };
    } catch (error) {
      console.error('Erro ao obter status do jogo:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erro ao obter status do jogo' 
      };
    }
  }

  // Fazer um chute
  async makeShot(zone, betAmount) {
    try {
      const response = await api.post(API_ENDPOINTS.GAMES_CHUTAR, {
        zone: zone,
        betAmount: parseFloat(betAmount)
      });
      
      return { 
        success: true, 
        result: response.data,
        shot: response.data.shot,
        goal: response.data.goal,
        prize: response.data.prize || 0
      };
    } catch (error) {
      console.error('Erro ao fazer chute:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erro ao fazer chute' 
      };
    }
  }

  // Obter estatísticas do jogador
  async getPlayerStats() {
    try {
      const response = await api.get(`${API_ENDPOINTS.PROFILE}/game-stats`);
      
      return { 
        success: true, 
        stats: response.data
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erro ao obter estatísticas' 
      };
    }
  }

  // Obter histórico de jogos
  async getGameHistory(page = 1, limit = 10) {
    try {
      const response = await api.get(`${API_ENDPOINTS.PROFILE}/game-history`, {
        params: { page, limit }
      });
      
      return { 
        success: true, 
        games: response.data.games,
        pagination: response.data.pagination
      };
    } catch (error) {
      console.error('Erro ao obter histórico de jogos:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erro ao obter histórico de jogos' 
      };
    }
  }

  // Obter ranking de jogadores
  async getLeaderboard(period = 'all') {
    try {
      const response = await api.get(`${API_ENDPOINTS.PROFILE}/leaderboard`, {
        params: { period }
      });
      
      return { 
        success: true, 
        leaderboard: response.data
      };
    } catch (error) {
      console.error('Erro ao obter ranking:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erro ao obter ranking' 
      };
    }
  }

  // Obter configurações do jogo
  async getGameSettings() {
    try {
      const response = await api.get(`${API_ENDPOINTS.PROFILE}/game-settings`);
      
      return { 
        success: true, 
        settings: response.data
      };
    } catch (error) {
      console.error('Erro ao obter configurações:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erro ao obter configurações' 
      };
    }
  }

  // Validar zona de chute
  validateShotZone(zone) {
    return Object.values(this.shotZones).includes(zone);
  }

  // Validar valor da aposta
  validateBetAmount(amount, minBet = 1, maxBet = 1000) {
    const numAmount = parseFloat(amount);
    return numAmount >= minBet && numAmount <= maxBet;
  }

  // Calcular probabilidade de gol por zona
  getGoalProbability(zone) {
    const probabilities = {
      [this.shotZones.TOP_LEFT]: 0.15,
      [this.shotZones.TOP_CENTER]: 0.25,
      [this.shotZones.TOP_RIGHT]: 0.15,
      [this.shotZones.MIDDLE_LEFT]: 0.20,
      [this.shotZones.MIDDLE_CENTER]: 0.35,
      [this.shotZones.MIDDLE_RIGHT]: 0.20,
      [this.shotZones.BOTTOM_LEFT]: 0.10,
      [this.shotZones.BOTTOM_CENTER]: 0.15,
      [this.shotZones.BOTTOM_RIGHT]: 0.10
    };
    
    return probabilities[zone] || 0.15;
  }

  // Calcular multiplicador de prêmio por zona
  getPrizeMultiplier(zone) {
    const multipliers = {
      [this.shotZones.TOP_LEFT]: 3.5,
      [this.shotZones.TOP_CENTER]: 2.0,
      [this.shotZones.TOP_RIGHT]: 3.5,
      [this.shotZones.MIDDLE_LEFT]: 2.5,
      [this.shotZones.MIDDLE_CENTER]: 1.5,
      [this.shotZones.MIDDLE_RIGHT]: 2.5,
      [this.shotZones.BOTTOM_LEFT]: 4.0,
      [this.shotZones.BOTTOM_CENTER]: 2.5,
      [this.shotZones.BOTTOM_RIGHT]: 4.0
    };
    
    return multipliers[zone] || 2.0;
  }

  // Obter nome da zona em português
  getZoneName(zone) {
    const names = {
      [this.shotZones.TOP_LEFT]: 'Canto Superior Esquerdo',
      [this.shotZones.TOP_CENTER]: 'Centro Superior',
      [this.shotZones.TOP_RIGHT]: 'Canto Superior Direito',
      [this.shotZones.MIDDLE_LEFT]: 'Lateral Esquerda',
      [this.shotZones.MIDDLE_CENTER]: 'Centro',
      [this.shotZones.MIDDLE_RIGHT]: 'Lateral Direita',
      [this.shotZones.BOTTOM_LEFT]: 'Canto Inferior Esquerdo',
      [this.shotZones.BOTTOM_CENTER]: 'Centro Inferior',
      [this.shotZones.BOTTOM_RIGHT]: 'Canto Inferior Direito'
    };
    
    return names[zone] || 'Zona Desconhecida';
  }

  // Obter cor da zona
  getZoneColor(zone) {
    const colors = {
      [this.shotZones.TOP_LEFT]: 'bg-red-500',
      [this.shotZones.TOP_CENTER]: 'bg-green-500',
      [this.shotZones.TOP_RIGHT]: 'bg-red-500',
      [this.shotZones.MIDDLE_LEFT]: 'bg-yellow-500',
      [this.shotZones.MIDDLE_CENTER]: 'bg-green-500',
      [this.shotZones.MIDDLE_RIGHT]: 'bg-yellow-500',
      [this.shotZones.BOTTOM_LEFT]: 'bg-red-500',
      [this.shotZones.BOTTOM_CENTER]: 'bg-yellow-500',
      [this.shotZones.BOTTOM_RIGHT]: 'bg-red-500'
    };
    
    return colors[zone] || 'bg-gray-500';
  }

  // Formatar valor da aposta
  formatBetAmount(amount) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  }

  // Formatar prêmio
  formatPrize(prize) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(prize);
  }

  // Obter status do jogo em português
  getStatusLabel(status) {
    const statusLabels = {
      [this.gameStatuses.WAITING]: 'Aguardando',
      [this.gameStatuses.IN_QUEUE]: 'Na Fila',
      [this.gameStatuses.IN_GAME]: 'Em Jogo',
      [this.gameStatuses.FINISHED]: 'Finalizado',
      [this.gameStatuses.CANCELLED]: 'Cancelado'
    };
    
    return statusLabels[status] || 'Desconhecido';
  }

  // Obter cor do status
  getStatusColor(status) {
    const statusColors = {
      [this.gameStatuses.WAITING]: 'text-gray-500',
      [this.gameStatuses.IN_QUEUE]: 'text-yellow-500',
      [this.gameStatuses.IN_GAME]: 'text-blue-500',
      [this.gameStatuses.FINISHED]: 'text-green-500',
      [this.gameStatuses.CANCELLED]: 'text-red-500'
    };
    
    return statusColors[status] || 'text-gray-500';
  }

  // Simular resultado de chute (para desenvolvimento)
  simulateShot(zone, betAmount) {
    const probability = this.getGoalProbability(zone);
    const isGoal = Math.random() < probability;
    const multiplier = this.getPrizeMultiplier(zone);
    const prize = isGoal ? betAmount * multiplier : 0;

    return {
      zone,
      betAmount,
      isGoal,
      prize,
      multiplier,
      probability
    };
  }
}

// Instância única do serviço
const gameService = new GameService();

export default gameService;
