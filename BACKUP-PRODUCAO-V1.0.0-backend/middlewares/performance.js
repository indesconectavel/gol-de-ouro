const compression = require('compression')
const helmet = require('helmet')

// Middleware de compressão
const compressionMiddleware = compression({
  level: 6, // Nível de compressão (1-9)
  threshold: 1024, // Comprimir apenas arquivos > 1KB
  filter: (req, res) => {
    // Não comprimir se já foi comprimido
    if (req.headers['x-no-compression']) {
      return false
    }
    
    // Usar compressão padrão
    return compression.filter(req, res)
  }
})

// Middleware de cache headers
const cacheHeaders = (req, res, next) => {
  // Cache para assets estáticos
  if (req.path.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    res.setHeader('Expires', new Date(Date.now() + 31536000000).toUTCString())
  }
  // Cache para APIs
  else if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'public, max-age=60')
    res.setHeader('ETag', `"${Date.now()}"`)
  }
  // Sem cache para páginas dinâmicas
  else {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')
  }
  
  next()
}

// Middleware de otimização de resposta
const responseOptimization = (req, res, next) => {
  const originalJson = res.json
  
  res.json = function(data) {
    // Remover propriedades desnecessárias
    if (data && typeof data === 'object') {
      data = removeUnnecessaryProperties(data)
    }
    
    // Adicionar headers de performance
    res.setHeader('X-Response-Time', `${Date.now() - req.startTime}ms`)
    res.setHeader('X-Cache-Status', res.getHeader('X-Cache-Status') || 'MISS')
    
    return originalJson.call(this, data)
  }
  
  next()
}

// Função para remover propriedades desnecessárias
function removeUnnecessaryProperties(obj) {
  if (Array.isArray(obj)) {
    return obj.map(removeUnnecessaryProperties)
  }
  
  if (obj && typeof obj === 'object') {
    const cleaned = {}
    for (const [key, value] of Object.entries(obj)) {
      // Pular propriedades internas do Node.js
      if (key.startsWith('_') || key === 'constructor') {
        continue
      }
      
      // Pular funções
      if (typeof value === 'function') {
        continue
      }
      
      // Recursivamente limpar objetos aninhados
      if (value && typeof value === 'object') {
        cleaned[key] = removeUnnecessaryProperties(value)
      } else {
        cleaned[key] = value
      }
    }
    return cleaned
  }
  
  return obj
}

// Middleware de rate limiting inteligente
const smartRateLimit = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress
  const key = `rate_limit:${ip}`
  
  // Implementar rate limiting baseado em Redis
  // (implementação simplificada para exemplo)
  const now = Date.now()
  const windowMs = 15 * 60 * 1000 // 15 minutos
  const maxRequests = 100 // 100 requests por janela
  
  // Aqui você implementaria a lógica de rate limiting
  // usando Redis ou memória local
  
  next()
}

// Middleware de monitoramento de performance
const performanceMonitoring = (req, res, next) => {
  req.startTime = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - req.startTime
    const status = res.statusCode
    
    // Log de performance
    console.log(`${req.method} ${req.path} - ${status} - ${duration}ms`)
    
    // Alertas para respostas lentas
    if (duration > 1000) {
      console.warn(`⚠️ Slow response: ${req.path} took ${duration}ms`)
    }
    
    // Métricas para Prometheus (se configurado)
    if (global.prometheus) {
      global.prometheus.httpRequestDuration
        .labels(req.method, req.path, status)
        .observe(duration / 1000)
    }
  })
  
  next()
}

// Middleware de otimização de queries
const queryOptimization = (req, res, next) => {
  // Adicionar hints de otimização para queries
  req.queryOptimization = {
    limit: Math.min(parseInt(req.query.limit) || 50, 100),
    offset: Math.max(parseInt(req.query.offset) || 0, 0),
    sort: req.query.sort || 'created_at',
    order: req.query.order === 'asc' ? 'ASC' : 'DESC'
  }
  
  next()
}

module.exports = {
  compressionMiddleware,
  cacheHeaders,
  responseOptimization,
  smartRateLimit,
  performanceMonitoring,
  queryOptimization
}
