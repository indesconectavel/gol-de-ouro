// 🚀 SISTEMA DE CACHE PARA REQUESTS - GOL DE OURO v1.2.0
// Sistema para evitar requests duplicados e melhorar performance

class RequestCache {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 30000; // 30 segundos
  }

  normalizeMethod(method = 'GET') {
    return String(method || 'GET').toLowerCase();
  }

  // Gerar chave única para o request
  generateKey(url, method = 'GET', params = {}) {
    const normalizedMethod = this.normalizeMethod(method);
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    return `${normalizedMethod}:${url}:${sortedParams}`;
  }

  // Verificar se request está em cache
  get(url, method = 'GET', params = {}) {
    const key = this.generateKey(url, method, params);
    const cached = this.cache.get(key);
    
    if (cached && Date.now() < cached.expiresAt) {
      console.log(`📦 Cache hit para: ${url} (${Math.round((cached.expiresAt - Date.now()) / 1000)}s restantes)`);
      return cached.data;
    }
    
    if (cached) {
      console.log(`⏰ Cache expirado para: ${url}`);
      this.cache.delete(key);
    }
    
    return null;
  }

  // Armazenar request no cache
  set(url, method = 'GET', params = {}, data, ttl = this.defaultTTL) {
    const key = this.generateKey(url, method, params);
    const expiresAt = Date.now() + ttl;
    
    this.cache.set(key, {
      data,
      expiresAt,
      timestamp: Date.now()
    });
    
    console.log(`💾 Cache armazenado para: ${url} (TTL: ${Math.round(ttl/1000)}s)`);
  }

  // Limpar cache expirado
  cleanup() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now >= value.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  // Limpar todo o cache
  clear() {
    this.cache.clear();
    console.log('🧹 Cache limpo');
  }

  // Invalidar cache por URL/método específico sem desligar cache global
  invalidate(url, method = 'GET') {
    if (!url) return 0;

    const normalizedMethod = this.normalizeMethod(method);
    const keyPrefix = `${normalizedMethod}:${url}:`;
    let removed = 0;

    for (const key of this.cache.keys()) {
      if (key.startsWith(keyPrefix)) {
        this.cache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      console.log(`🗑️ Cache invalidado para: ${url} (${removed} entradas)`);
    }

    return removed;
  }

  // Obter estatísticas do cache
  getStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;
    
    for (const value of this.cache.values()) {
      if (now < value.expiresAt) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    }
    
    return {
      total: this.cache.size,
      valid: validEntries,
      expired: expiredEntries
    };
  }
}

// Instância global do cache
const requestCache = new RequestCache();

// Limpar cache expirado a cada 5 minutos
setInterval(() => {
  requestCache.cleanup();
}, 5 * 60 * 1000);

export default requestCache;
