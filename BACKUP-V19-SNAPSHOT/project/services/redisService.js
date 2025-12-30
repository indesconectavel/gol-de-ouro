// SERVIÇO DE CACHE REDIS - GOL DE OURO v1.1.1
// Data: 2025-10-08T02:01:16.602Z

const redis = require('redis');
const config = require('../config/production');

class RedisService {
  constructor() {
    this.client = null;
    this.connected = false;
  }

  async connect() {
    try {
      this.client = redis.createClient({
        url: config.REDIS_URL,
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            console.error('Redis server connection refused');
            return new Error('Redis server connection refused');
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            console.error('Redis retry time exhausted');
            return new Error('Retry time exhausted');
          }
          if (options.attempt > 10) {
            console.error('Redis max retry attempts reached');
            return undefined;
          }
          return Math.min(options.attempt * 100, 3000);
        }
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.connected = false;
      });

      this.client.on('connect', () => {
        console.log('✅ Redis conectado com sucesso');
        this.connected = true;
      });

      await this.client.connect();
      return true;
    } catch (error) {
      console.error('❌ Erro ao conectar Redis:', error.message);
      this.connected = false;
      return false;
    }
  }

  async get(key) {
    if (!this.connected) return null;
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Erro ao buscar cache:', error.message);
      return null;
    }
  }

  async set(key, value, ttl = 3600) {
    if (!this.connected) return false;
    try {
      await this.client.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Erro ao salvar cache:', error.message);
      return false;
    }
  }

  async del(key) {
    if (!this.connected) return false;
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Erro ao deletar cache:', error.message);
      return false;
    }
  }

  async flush() {
    if (!this.connected) return false;
    try {
      await this.client.flushAll();
      return true;
    } catch (error) {
      console.error('Erro ao limpar cache:', error.message);
      return false;
    }
  }

  // Cache específico para o jogo
  async cacheGameData(gameId, data, ttl = 1800) {
    return await this.set(`game:${gameId}`, data, ttl);
  }

  async getGameData(gameId) {
    return await this.get(`game:${gameId}`);
  }

  // Cache de usuários
  async cacheUserData(userId, data, ttl = 3600) {
    return await this.set(`user:${userId}`, data, ttl);
  }

  async getUserData(userId) {
    return await this.get(`user:${userId}`);
  }

  // Cache de fila de jogadores
  async cacheQueue(queueData, ttl = 300) {
    return await this.set('queue:players', queueData, ttl);
  }

  async getQueue() {
    return await this.get('queue:players');
  }
}

module.exports = new RedisService();
