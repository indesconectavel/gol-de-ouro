const express = require('express')
const router = express.Router()
const { performance } = require('perf_hooks')
const os = require('os')

// Middleware para medir tempo de resposta
const measureResponseTime = (req, res, next) => {
  const startTime = performance.now()
  
  res.on('finish', () => {
    const endTime = performance.now()
    const duration = endTime - startTime
    
    // Log de performance
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration.toFixed(2)}ms`)
    
    // Alertas para respostas lentas
    if (duration > 1000) {
      console.warn(`⚠️ Slow response: ${req.path} took ${duration.toFixed(2)}ms`)
    }
    
    // Métricas para Prometheus (se configurado)
    if (global.prometheus) {
      global.prometheus.httpRequestDuration
        .labels(req.method, req.path, res.statusCode)
        .observe(duration / 1000)
    }
  })
  
  next()
}

// Aplicar middleware a todas as rotas
router.use(measureResponseTime)

// Endpoint para métricas de performance
router.get('/metrics', async (req, res) => {
  try {
    const metrics = {
      timestamp: Date.now(),
      uptime: process.uptime(),
      memory: {
        used: process.memoryUsage(),
        system: {
          total: os.totalmem(),
          free: os.freemem(),
          used: os.totalmem() - os.freemem()
        }
      },
      cpu: {
        loadAverage: os.loadavg(),
        cpus: os.cpus().length
      },
      platform: {
        type: os.type(),
        platform: os.platform(),
        arch: os.arch(),
        release: os.release()
      },
      node: {
        version: process.version,
        pid: process.pid
      }
    }

    res.json(metrics)
  } catch (error) {
    console.error('Error getting performance metrics:', error)
    res.status(500).json({ error: 'Failed to get performance metrics' })
  }
})

// Endpoint para receber métricas do frontend
router.post('/report', async (req, res) => {
  try {
    const {
      fps,
      memory,
      renderTime,
      networkLatency,
      errors,
      timestamp,
      userAgent,
      url,
      viewport
    } = req.body

    // Log das métricas recebidas
    console.log('Frontend metrics received:', {
      fps,
      memory,
      renderTime,
      networkLatency,
      errors,
      timestamp,
      url
    })

    // Aqui você pode salvar as métricas no banco de dados
    // ou enviar para um serviço de monitoramento

    res.json({ success: true })
  } catch (error) {
    console.error('Error processing performance report:', error)
    res.status(500).json({ error: 'Failed to process performance report' })
  }
})

// Endpoint para health check com métricas
router.get('/health', async (req, res) => {
  try {
    const memoryUsage = process.memoryUsage()
    const memoryUsageMB = {
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024)
    }

    const health = {
      status: 'healthy',
      timestamp: Date.now(),
      uptime: process.uptime(),
      memory: memoryUsageMB,
      loadAverage: os.loadavg(),
      freeMemory: Math.round(os.freemem() / 1024 / 1024)
    }

    // Verificar se o sistema está saudável
    if (memoryUsageMB.heapUsed > 500) { // Mais de 500MB
      health.status = 'warning'
      health.warnings = ['High memory usage']
    }

    if (os.loadavg()[0] > 5) { // Load average > 5
      health.status = 'warning'
      health.warnings = [...(health.warnings || []), 'High CPU load']
    }

    res.json(health)
  } catch (error) {
    console.error('Error in health check:', error)
    res.status(500).json({ 
      status: 'error',
      error: 'Health check failed'
    })
  }
})

// Endpoint para limpeza de memória
router.post('/cleanup', async (req, res) => {
  try {
    // Forçar garbage collection se disponível
    if (global.gc) {
      global.gc()
    }

    const memoryBefore = process.memoryUsage()
    
    // Limpar caches se disponível
    if (global.cache) {
      global.cache.clear()
    }

    const memoryAfter = process.memoryUsage()
    
    res.json({
      success: true,
      memoryBefore: {
        heapUsed: Math.round(memoryBefore.heapUsed / 1024 / 1024)
      },
      memoryAfter: {
        heapUsed: Math.round(memoryAfter.heapUsed / 1024 / 1024)
      },
      freed: Math.round((memoryBefore.heapUsed - memoryAfter.heapUsed) / 1024 / 1024)
    })
  } catch (error) {
    console.error('Error during cleanup:', error)
    res.status(500).json({ error: 'Cleanup failed' })
  }
})

// Endpoint para estatísticas de cache
router.get('/cache/stats', async (req, res) => {
  try {
    if (!global.cache) {
      return res.json({ error: 'Cache not available' })
    }

    const stats = global.cache.getStats()
    res.json(stats)
  } catch (error) {
    console.error('Error getting cache stats:', error)
    res.status(500).json({ error: 'Failed to get cache stats' })
  }
})

// Endpoint para limpar cache
router.post('/cache/clear', async (req, res) => {
  try {
    if (!global.cache) {
      return res.json({ error: 'Cache not available' })
    }

    global.cache.clear()
    res.json({ success: true, message: 'Cache cleared' })
  } catch (error) {
    console.error('Error clearing cache:', error)
    res.status(500).json({ error: 'Failed to clear cache' })
  }
})

module.exports = router
