const redis = require('redis')

class RedisCache {
  constructor() {
    this.client = null
    this.isConnected = false
  }

  async connect() {
    try {
      this.client = redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            console.log('Redis server connection refused')
            return new Error('Redis server connection refused')
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            console.log('Redis retry time exhausted')
            return new Error('Retry time exhausted')
          }
          if (options.attempt > 10) {
            console.log('Redis max retry attempts reached')
            return undefined
          }
          return Math.min(options.attempt * 100, 3000)
        }
      })

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err)
        this.isConnected = false
      })

      this.client.on('connect', () => {
        console.log('✅ Redis connected')
        this.isConnected = true
      })

      this.client.on('ready', () => {
        console.log('✅ Redis ready')
        this.isConnected = true
      })

      await this.client.connect()
    } catch (error) {
      console.error('Redis connection failed:', error)
      this.isConnected = false
    }
  }

  async get(key) {
    if (!this.isConnected) return null
    
    try {
      const value = await this.client.get(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      console.error('Redis GET error:', error)
      return null
    }
  }

  async set(key, value, ttl = 300) {
    if (!this.isConnected) return false
    
    try {
      const serialized = JSON.stringify(value)
      await this.client.setEx(key, ttl, serialized)
      return true
    } catch (error) {
      console.error('Redis SET error:', error)
      return false
    }
  }

  async del(key) {
    if (!this.isConnected) return false
    
    try {
      await this.client.del(key)
      return true
    } catch (error) {
      console.error('Redis DEL error:', error)
      return false
    }
  }

  async exists(key) {
    if (!this.isConnected) return false
    
    try {
      const result = await this.client.exists(key)
      return result === 1
    } catch (error) {
      console.error('Redis EXISTS error:', error)
      return false
    }
  }

  async flush() {
    if (!this.isConnected) return false
    
    try {
      await this.client.flushAll()
      return true
    } catch (error) {
      console.error('Redis FLUSH error:', error)
      return false
    }
  }

  async getStats() {
    if (!this.isConnected) return null
    
    try {
      const info = await this.client.info('memory')
      const keyspace = await this.client.info('keyspace')
      
      return {
        memory: info,
        keyspace: keyspace,
        connected: this.isConnected
      }
    } catch (error) {
      console.error('Redis STATS error:', error)
      return null
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit()
      this.isConnected = false
    }
  }
}

// Instância global do cache
const cache = new RedisCache()

// Cache específico para diferentes tipos de dados
const gameCache = {
  async getGameStatus() {
    return await cache.get('game:status')
  },

  async setGameStatus(status) {
    return await cache.set('game:status', status, 60) // 1 minuto
  },

  async getActiveGames() {
    return await cache.get('games:active')
  },

  async setActiveGames(games) {
    return await cache.set('games:active', games, 30) // 30 segundos
  }
}

const userCache = {
  async getUser(userId) {
    return await cache.get(`user:${userId}`)
  },

  async setUser(userId, userData) {
    return await cache.set(`user:${userId}`, userData, 300) // 5 minutos
  },

  async getUserBalance(userId) {
    return await cache.get(`user:${userId}:balance`)
  },

  async setUserBalance(userId, balance) {
    return await cache.set(`user:${userId}:balance`, balance, 60) // 1 minuto
  }
}

const apiCache = {
  async get(key) {
    return await cache.get(`api:${key}`)
  },

  async set(key, value, ttl = 120) {
    return await cache.set(`api:${key}`, value, ttl)
  },

  async del(key) {
    return await cache.del(`api:${key}`)
  }
}

module.exports = {
  cache,
  gameCache,
  userCache,
  apiCache
}
