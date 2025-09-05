class MemoryCache {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 100
    this.defaultTTL = options.defaultTTL || 300000 // 5 minutos
    this.cache = new Map()
    this.timers = new Map()
  }

  set(key, value, ttl = this.defaultTTL) {
    // Remover entrada existente se houver
    if (this.cache.has(key)) {
      this.delete(key)
    }

    // Verificar limite de tamanho
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      this.delete(firstKey)
    }

    // Adicionar nova entrada
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl
    })

    // Configurar expiração
    const timer = setTimeout(() => {
      this.delete(key)
    }, ttl)

    this.timers.set(key, timer)
  }

  get(key) {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    // Verificar se expirou
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.delete(key)
      return null
    }

    return entry.value
  }

  has(key) {
    return this.get(key) !== null
  }

  delete(key) {
    const timer = this.timers.get(key)
    if (timer) {
      clearTimeout(timer)
      this.timers.delete(key)
    }
    return this.cache.delete(key)
  }

  clear() {
    // Limpar todos os timers
    this.timers.forEach(timer => clearTimeout(timer))
    this.timers.clear()
    this.cache.clear()
  }

  size() {
    return this.cache.size
  }

  keys() {
    return Array.from(this.cache.keys())
  }

  // Estatísticas do cache
  getStats() {
    const now = Date.now()
    let hits = 0
    let misses = 0
    let expired = 0

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        expired++
      } else {
        hits++
      }
    }

    return {
      size: this.cache.size,
      hits,
      misses,
      expired,
      hitRate: hits / (hits + misses) || 0
    }
  }
}

// Instância global do cache
export const cache = new MemoryCache({
  maxSize: 200,
  defaultTTL: 300000 // 5 minutos
})

// Cache específico para diferentes tipos de dados
export const gameCache = new MemoryCache({
  maxSize: 50,
  defaultTTL: 60000 // 1 minuto
})

export const userCache = new MemoryCache({
  maxSize: 100,
  defaultTTL: 300000 // 5 minutos
})

export const apiCache = new MemoryCache({
  maxSize: 100,
  defaultTTL: 120000 // 2 minutos
})

export default MemoryCache
