// Sistema de Cache Redis - Gol de Ouro v1.2.0
// ============================================
const redis = require('redis');

class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.defaultTTL = 3600; // 1 hora em segundos
    this.connect();
  }

  // Conectar ao Redis
  async connect() {
    try {
      this.client = redis.createClient({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || null,
        db: process.env.REDIS_DB || 0,
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            console.log('⚠️ [CACHE] Redis server connection refused');
            return new Error('Redis server connection refused');
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            console.log('⚠️ [CACHE] Redis retry time exhausted');
            return new Error('Retry time exhausted');
          }
          if (options.attempt > 10) {
            console.log('⚠️ [CACHE] Redis max retry attempts reached');
            return undefined;
          }
          return Math.min(options.attempt * 100, 3000);
        }
      });

      this.client.on('connect', () => {
        console.log('✅ [CACHE] Conectado ao Redis');
        this.isConnected = true;
      });

      this.client.on('error', (err) => {
        console.error('❌ [CACHE] Erro no Redis:', err);
        this.isConnected = false;
      });

      this.client.on('end', () => {
        console.log('⚠️ [CACHE] Conexão Redis encerrada');
        this.isConnected = false;
      });

      await this.client.connect();

    } catch (error) {
      console.error('❌ [CACHE] Erro ao conectar Redis:', error);
      this.isConnected = false;
    }
  }

  // Verificar se está conectado
  isRedisConnected() {
    return this.isConnected && this.client;
  }

  // Obter valor do cache
  async get(key) {
    try {
      if (!this.isRedisConnected()) {
        console.log('⚠️ [CACHE] Redis não conectado, retornando null');
        return null;
      }

      const value = await this.client.get(key);
      
      if (value === null) {
        return null;
      }

      // Tentar fazer parse JSON
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }

    } catch (error) {
      console.error('❌ [CACHE] Erro ao obter chave:', key, error);
      return null;
    }
  }

  // Definir valor no cache
  async set(key, value, ttl = null) {
    try {
      if (!this.isRedisConnected()) {
        console.log('⚠️ [CACHE] Redis não conectado, ignorando set');
        return false;
      }

      const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
      const expiration = ttl || this.defaultTTL;

      await this.client.setEx(key, expiration, serializedValue);
      
      console.log(`✅ [CACHE] Chave ${key} definida com TTL ${expiration}s`);
      return true;

    } catch (error) {
      console.error('❌ [CACHE] Erro ao definir chave:', key, error);
      return false;
    }
  }

  // Deletar chave do cache
  async delete(key) {
    try {
      if (!this.isRedisConnected()) {
        console.log('⚠️ [CACHE] Redis não conectado, ignorando delete');
        return false;
      }

      const result = await this.client.del(key);
      console.log(`✅ [CACHE] Chave ${key} deletada`);
      return result > 0;

    } catch (error) {
      console.error('❌ [CACHE] Erro ao deletar chave:', key, error);
      return false;
    }
  }

  // Verificar se chave existe
  async exists(key) {
    try {
      if (!this.isRedisConnected()) {
        return false;
      }

      const result = await this.client.exists(key);
      return result === 1;

    } catch (error) {
      console.error('❌ [CACHE] Erro ao verificar existência:', key, error);
      return false;
    }
  }

  // Incrementar valor
  async increment(key, amount = 1) {
    try {
      if (!this.isRedisConnected()) {
        return null;
      }

      const result = await this.client.incrBy(key, amount);
      return result;

    } catch (error) {
      console.error('❌ [CACHE] Erro ao incrementar:', key, error);
      return null;
    }
  }

  // Decrementar valor
  async decrement(key, amount = 1) {
    try {
      if (!this.isRedisConnected()) {
        return null;
      }

      const result = await this.client.decrBy(key, amount);
      return result;

    } catch (error) {
      console.error('❌ [CACHE] Erro ao decrementar:', key, error);
      return null;
    }
  }

  // Definir múltiplas chaves
  async mset(keyValuePairs, ttl = null) {
    try {
      if (!this.isRedisConnected()) {
        return false;
      }

      const serializedPairs = {};
      for (const [key, value] of Object.entries(keyValuePairs)) {
        serializedPairs[key] = typeof value === 'string' ? value : JSON.stringify(value);
      }

      await this.client.mSet(serializedPairs);

      // Definir TTL para todas as chaves
      if (ttl) {
        const pipeline = this.client.multi();
        for (const key of Object.keys(serializedPairs)) {
          pipeline.expire(key, ttl);
        }
        await pipeline.exec();
      }

      console.log(`✅ [CACHE] ${Object.keys(keyValuePairs).length} chaves definidas`);
      return true;

    } catch (error) {
      console.error('❌ [CACHE] Erro ao definir múltiplas chaves:', error);
      return false;
    }
  }

  // Obter múltiplas chaves
  async mget(keys) {
    try {
      if (!this.isRedisConnected()) {
        return keys.map(() => null);
      }

      const values = await this.client.mGet(keys);
      
      return values.map(value => {
        if (value === null) return null;
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      });

    } catch (error) {
      console.error('❌ [CACHE] Erro ao obter múltiplas chaves:', error);
      return keys.map(() => null);
    }
  }

  // Cache com função de fallback
  async getOrSet(key, fallbackFunction, ttl = null) {
    try {
      // Tentar obter do cache
      let value = await this.get(key);
      
      if (value !== null) {
        console.log(`✅ [CACHE] Cache hit para ${key}`);
        return value;
      }

      // Executar função de fallback
      console.log(`🔄 [CACHE] Cache miss para ${key}, executando fallback`);
      value = await fallbackFunction();
      
      // Salvar no cache
      if (value !== null && value !== undefined) {
        await this.set(key, value, ttl);
      }

      return value;

    } catch (error) {
      console.error('❌ [CACHE] Erro em getOrSet:', key, error);
      // Em caso de erro, tentar executar fallback
      try {
        return await fallbackFunction();
      } catch (fallbackError) {
        console.error('❌ [CACHE] Erro no fallback:', fallbackError);
        return null;
      }
    }
  }

  // Cache de sessão de usuário
  async cacheUserSession(userId, sessionData, ttl = 1800) { // 30 minutos
    const key = `session:${userId}`;
    return await this.set(key, sessionData, ttl);
  }

  // Obter sessão de usuário
  async getUserSession(userId) {
    const key = `session:${userId}`;
    return await this.get(key);
  }

  // Invalidar sessão de usuário
  async invalidateUserSession(userId) {
    const key = `session:${userId}`;
    return await this.delete(key);
  }

  // Cache de dados de usuário
  async cacheUserData(userId, userData, ttl = 600) { // 10 minutos
    const key = `user:${userId}`;
    return await this.set(key, userData, ttl);
  }

  // Obter dados de usuário do cache
  async getCachedUserData(userId) {
    const key = `user:${userId}`;
    return await this.get(key);
  }

  // Cache de ranking
  async cacheRanking(rankingType, period, data, ttl = 300) { // 5 minutos
    const key = `ranking:${rankingType}:${period}`;
    return await this.set(key, data, ttl);
  }

  // Obter ranking do cache
  async getCachedRanking(rankingType, period) {
    const key = `ranking:${rankingType}:${period}`;
    return await this.get(key);
  }

  // Cache de estatísticas do sistema
  async cacheSystemStats(statsType, data, ttl = 600) { // 10 minutos
    const key = `stats:${statsType}`;
    return await this.set(key, data, ttl);
  }

  // Obter estatísticas do cache
  async getCachedSystemStats(statsType) {
    const key = `stats:${statsType}`;
    return await this.get(key);
  }

  // Cache de contador de chutes global
  async cacheGlobalShotCounter(count, ttl = 60) { // 1 minuto
    const key = 'global:shot_counter';
    return await this.set(key, count, ttl);
  }

  // Obter contador de chutes do cache
  async getCachedGlobalShotCounter() {
    const key = 'global:shot_counter';
    return await this.get(key);
  }

  // Cache de validação PIX
  async cachePixValidation(pixKey, validationResult, ttl = 3600) { // 1 hora
    const key = `pix_validation:${pixKey}`;
    return await this.set(key, validationResult, ttl);
  }

  // Obter validação PIX do cache
  async getCachedPixValidation(pixKey) {
    const key = `pix_validation:${pixKey}`;
    return await this.get(key);
  }

  // Cache de rate limiting
  async cacheRateLimit(identifier, count, ttl = 60) { // 1 minuto
    const key = `rate_limit:${identifier}`;
    return await this.set(key, count, ttl);
  }

  // Obter rate limit do cache
  async getCachedRateLimit(identifier) {
    const key = `rate_limit:${identifier}`;
    return await this.get(key);
  }

  // Limpar cache por padrão
  async clearCacheByPattern(pattern) {
    try {
      if (!this.isRedisConnected()) {
        return false;
      }

      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
        console.log(`✅ [CACHE] ${keys.length} chaves removidas com padrão ${pattern}`);
      }

      return true;

    } catch (error) {
      console.error('❌ [CACHE] Erro ao limpar cache por padrão:', pattern, error);
      return false;
    }
  }

  // Obter estatísticas do Redis
  async getRedisStats() {
    try {
      if (!this.isRedisConnected()) {
        return { connected: false };
      }

      const info = await this.client.info('memory');
      const keyspace = await this.client.info('keyspace');
      const stats = await this.client.info('stats');

      return {
        connected: true,
        memory: this.parseRedisInfo(info),
        keyspace: this.parseRedisInfo(keyspace),
        stats: this.parseRedisInfo(stats)
      };

    } catch (error) {
      console.error('❌ [CACHE] Erro ao obter estatísticas:', error);
      return { connected: false, error: error.message };
    }
  }

  // Parsear informações do Redis
  parseRedisInfo(info) {
    const result = {};
    const lines = info.split('\r\n');
    
    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        result[key] = value;
      }
    }
    
    return result;
  }

  // Fechar conexão
  async close() {
    try {
      if (this.client) {
        await this.client.quit();
        console.log('✅ [CACHE] Conexão Redis fechada');
      }
    } catch (error) {
      console.error('❌ [CACHE] Erro ao fechar conexão:', error);
    }
  }
}

module.exports = CacheService;
