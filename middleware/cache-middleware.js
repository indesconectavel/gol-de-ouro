// Middleware de Cache para Express - Gol de Ouro v1.2.0
// =====================================================
const CacheService = require('./cache-service');

class CacheMiddleware {
  constructor() {
    this.cache = new CacheService();
  }

  // Middleware para cache de rotas
  cacheRoute(ttl = 300, keyGenerator = null) {
    return async (req, res, next) => {
      try {
        // Gerar chave do cache
        const cacheKey = keyGenerator 
          ? keyGenerator(req) 
          : `route:${req.method}:${req.originalUrl}`;

        // Tentar obter do cache
        const cachedResponse = await this.cache.get(cacheKey);
        
        if (cachedResponse) {
          console.log(`✅ [CACHE-MIDDLEWARE] Cache hit para ${cacheKey}`);
          return res.json(cachedResponse);
        }

        // Interceptar resposta para salvar no cache
        const originalJson = res.json;
        res.json = function(data) {
          // Salvar no cache apenas se for sucesso
          if (res.statusCode === 200) {
            this.cache.set(cacheKey, data, ttl).catch(err => {
              console.error('❌ [CACHE-MIDDLEWARE] Erro ao salvar no cache:', err);
            });
          }
          return originalJson.call(this, data);
        }.bind(this);

        next();

      } catch (error) {
        console.error('❌ [CACHE-MIDDLEWARE] Erro:', error);
        next();
      }
    };
  }

  // Middleware para cache de autenticação
  cacheAuth(ttl = 1800) { // 30 minutos
    return async (req, res, next) => {
      try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next();
        }

        const cacheKey = `auth:${token}`;
        const cachedUser = await this.cache.get(cacheKey);
        
        if (cachedUser) {
          console.log(`✅ [CACHE-MIDDLEWARE] Auth cache hit para token`);
          req.user = cachedUser;
          return next();
        }

        // Se não encontrou no cache, continuar com autenticação normal
        // O middleware de auth vai salvar no cache após validar
        next();

      } catch (error) {
        console.error('❌ [CACHE-MIDDLEWARE] Erro no cache de auth:', error);
        next();
      }
    };
  }

  // Middleware para rate limiting
  rateLimit(maxRequests = 100, windowMs = 60000) { // 100 requests por minuto
    return async (req, res, next) => {
      try {
        const identifier = req.ip || req.connection.remoteAddress;
        const cacheKey = `rate_limit:${identifier}`;
        
        const currentCount = await this.cache.get(cacheKey) || 0;
        
        if (currentCount >= maxRequests) {
          return res.status(429).json({
            success: false,
            message: 'Muitas requisições. Tente novamente em alguns minutos.',
            retryAfter: Math.ceil(windowMs / 1000)
          });
        }

        // Incrementar contador
        await this.cache.set(cacheKey, currentCount + 1, Math.ceil(windowMs / 1000));
        
        // Adicionar headers de rate limit
        res.set({
          'X-RateLimit-Limit': maxRequests,
          'X-RateLimit-Remaining': Math.max(0, maxRequests - currentCount - 1),
          'X-RateLimit-Reset': new Date(Date.now() + windowMs).toISOString()
        });

        next();

      } catch (error) {
        console.error('❌ [CACHE-MIDDLEWARE] Erro no rate limit:', error);
        next();
      }
    };
  }

  // Middleware para cache de dados de usuário
  cacheUserData(ttl = 600) { // 10 minutos
    return async (req, res, next) => {
      try {
        if (!req.user?.userId) {
          return next();
        }

        const cacheKey = `user_data:${req.user.userId}`;
        const cachedUserData = await this.cache.get(cacheKey);
        
        if (cachedUserData) {
          console.log(`✅ [CACHE-MIDDLEWARE] User data cache hit para ${req.user.userId}`);
          req.cachedUserData = cachedUserData;
        }

        next();

      } catch (error) {
        console.error('❌ [CACHE-MIDDLEWARE] Erro no cache de user data:', error);
        next();
      }
    };
  }

  // Middleware para cache de ranking
  cacheRanking(ttl = 300) { // 5 minutos
    return async (req, res, next) => {
      try {
        const { type = 'general', period = 'all' } = req.query;
        const cacheKey = `ranking:${type}:${period}`;
        
        const cachedRanking = await this.cache.get(cacheKey);
        
        if (cachedRanking) {
          console.log(`✅ [CACHE-MIDDLEWARE] Ranking cache hit para ${type}:${period}`);
          return res.json({
            success: true,
            data: cachedRanking,
            cached: true
          });
        }

        // Interceptar resposta para salvar no cache
        const originalJson = res.json;
        res.json = function(data) {
          if (res.statusCode === 200 && data.success) {
            this.cache.set(cacheKey, data.data, ttl).catch(err => {
              console.error('❌ [CACHE-MIDDLEWARE] Erro ao salvar ranking no cache:', err);
            });
          }
          return originalJson.call(this, data);
        }.bind(this);

        next();

      } catch (error) {
        console.error('❌ [CACHE-MIDDLEWARE] Erro no cache de ranking:', error);
        next();
      }
    };
  }

  // Middleware para cache de estatísticas
  cacheStats(ttl = 600) { // 10 minutos
    return async (req, res, next) => {
      try {
        const { type = 'general' } = req.query;
        const cacheKey = `stats:${type}`;
        
        const cachedStats = await this.cache.get(cacheKey);
        
        if (cachedStats) {
          console.log(`✅ [CACHE-MIDDLEWARE] Stats cache hit para ${type}`);
          return res.json({
            success: true,
            data: cachedStats,
            cached: true
          });
        }

        // Interceptar resposta para salvar no cache
        const originalJson = res.json;
        res.json = function(data) {
          if (res.statusCode === 200 && data.success) {
            this.cache.set(cacheKey, data.data, ttl).catch(err => {
              console.error('❌ [CACHE-MIDDLEWARE] Erro ao salvar stats no cache:', err);
            });
          }
          return originalJson.call(this, data);
        }.bind(this);

        next();

      } catch (error) {
        console.error('❌ [CACHE-MIDDLEWARE] Erro no cache de stats:', error);
        next();
      }
    };
  }

  // Invalidar cache de usuário
  async invalidateUserCache(userId) {
    try {
      const patterns = [
        `user:${userId}`,
        `user_data:${userId}`,
        `session:${userId}`,
        `auth:*` // Invalidar todos os tokens de auth
      ];

      for (const pattern of patterns) {
        await this.cache.clearCacheByPattern(pattern);
      }

      console.log(`✅ [CACHE-MIDDLEWARE] Cache invalidado para usuário ${userId}`);
      return true;

    } catch (error) {
      console.error('❌ [CACHE-MIDDLEWARE] Erro ao invalidar cache:', error);
      return false;
    }
  }

  // Invalidar cache de ranking
  async invalidateRankingCache() {
    try {
      await this.cache.clearCacheByPattern('ranking:*');
      console.log('✅ [CACHE-MIDDLEWARE] Cache de ranking invalidado');
      return true;

    } catch (error) {
      console.error('❌ [CACHE-MIDDLEWARE] Erro ao invalidar cache de ranking:', error);
      return false;
    }
  }

  // Invalidar cache de estatísticas
  async invalidateStatsCache() {
    try {
      await this.cache.clearCacheByPattern('stats:*');
      console.log('✅ [CACHE-MIDDLEWARE] Cache de estatísticas invalidado');
      return true;

    } catch (error) {
      console.error('❌ [CACHE-MIDDLEWARE] Erro ao invalidar cache de stats:', error);
      return false;
    }
  }

  // Obter estatísticas do cache
  async getCacheStats() {
    try {
      return await this.cache.getRedisStats();
    } catch (error) {
      console.error('❌ [CACHE-MIDDLEWARE] Erro ao obter estatísticas:', error);
      return { error: error.message };
    }
  }
}

module.exports = CacheMiddleware;
