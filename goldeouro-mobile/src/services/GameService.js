import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

class GameService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
    });

    // Interceptor para adicionar token de autenticação
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getStoredToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  getStoredToken = async () => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      return null;
    }
  };

  // Jogos
  async getGames() {
    try {
      const response = await this.api.get('/games');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async createGame(gameData) {
    try {
      const response = await this.api.post('/games', gameData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getGameById(id) {
    try {
      const response = await this.api.get(`/games/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Blockchain
  async registerGameOnBlockchain(gameData) {
    try {
      const response = await this.api.post('/blockchain/game', gameData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async registerPaymentOnBlockchain(paymentData) {
    try {
      const response = await this.api.post('/blockchain/payment', paymentData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async registerRankingOnBlockchain(rankingData) {
    try {
      const response = await this.api.post('/blockchain/ranking', rankingData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async verifyTransaction(hash) {
    try {
      const response = await this.api.get(`/blockchain/verify/${hash}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getBlockchainStats() {
    try {
      const response = await this.api.get('/blockchain/stats');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Analytics
  async getAnalytics() {
    try {
      const response = await this.api.get('/analytics/overview');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getPlayerAnalytics() {
    try {
      const response = await this.api.get('/analytics/players');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Rankings
  async getLeaderboard(period = 'weekly') {
    try {
      const response = await this.api.get(`/analytics/leaderboard?period=${period}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Pagamentos
  async getPayments() {
    try {
      const response = await this.api.get('/payments');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async createPayment(paymentData) {
    try {
      const response = await this.api.post('/payments', paymentData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Notificações
  async registerForPushNotifications() {
    try {
      const { Notifications } = require('expo-notifications');
      
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        return { success: false, error: 'Permissão de notificação negada' };
      }

      const token = (await Notifications.getExpoPushTokenAsync()).data;
      
      // Registrar token no backend
      const response = await this.api.post('/notifications/register', {
        pushToken: token,
        platform: 'mobile',
      });

      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Configurações offline
  async saveGameOffline(gameData) {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const offlineGames = await AsyncStorage.getItem('offlineGames') || '[]';
      const games = JSON.parse(offlineGames);
      games.push({ ...gameData, id: Date.now(), offline: true });
      await AsyncStorage.setItem('offlineGames', JSON.stringify(games));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async syncOfflineGames() {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const offlineGames = await AsyncStorage.getItem('offlineGames') || '[]';
      const games = JSON.parse(offlineGames);
      
      for (const game of games) {
        if (game.offline) {
          await this.createGame(game);
          await this.registerGameOnBlockchain(game);
        }
      }
      
      await AsyncStorage.removeItem('offlineGames');
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default new GameService();
