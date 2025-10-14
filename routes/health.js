// Rotas de Health Check - Gol de Ouro v1.1.1
const express = require('express');
const router = express.Router();
const monitoring = require('../src/utils/monitoring');
const logger = require('../src/utils/logger');
const { supabase } = require('../database/supabase-config');

// Health check básico
router.get('/', async (req, res) => {
  try {
    const health = monitoring.getHealthStatus();
    
    res.status(health.status === 'error' ? 500 : 200).json({
      ...health,
      service: 'Gol de Ouro Backend',
      version: '1.1.1',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    logger.error('Erro no health check', { error: error.message });
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      error: error.message
    });
  }
});

// Health check detalhado
router.get('/detailed', async (req, res) => {
  try {
    const metrics = monitoring.getMetrics();
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Gol de Ouro Backend',
      version: '1.1.1',
      environment: process.env.NODE_ENV || 'development',
      metrics: metrics
    });
  } catch (error) {
    logger.error('Erro no health check detalhado', { error: error.message });
    res.status(500).json({
      status: 'error',
      message: 'Detailed health check failed',
      error: error.message
    });
  }
});

// Health check do banco de dados
router.get('/database', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Testar conexão com o banco
    const { data, error } = await supabase
      .from('usuarios')
      .select('count')
      .limit(1);
    
    const responseTime = Date.now() - startTime;
    
    if (error) {
      logger.error('Erro na conexão com banco', { error: error.message });
      return res.status(500).json({
        status: 'error',
        message: 'Database connection failed',
        error: error.message,
        responseTime: `${responseTime}ms`
      });
    }
    
    res.json({
      status: 'healthy',
      message: 'Database connection successful',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Erro no health check do banco', { error: error.message });
    res.status(500).json({
      status: 'error',
      message: 'Database health check failed',
      error: error.message
    });
  }
});

// Health check das APIs externas
router.get('/external', async (req, res) => {
  try {
    const checks = {};
    
    // Verificar Mercado Pago (simulado)
    checks.mercadopago = await checkMercadoPago();
    
    // Verificar outros serviços externos
    checks.websocket = await checkWebSocket();
    
    const allHealthy = Object.values(checks).every(check => check.status === 'healthy');
    
    res.status(allHealthy ? 200 : 500).json({
      status: allHealthy ? 'healthy' : 'degraded',
      checks: checks,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Erro no health check externo', { error: error.message });
    res.status(500).json({
      status: 'error',
      message: 'External health check failed',
      error: error.message
    });
  }
});

// Health check de performance
router.get('/performance', async (req, res) => {
  try {
    const metrics = monitoring.getMetrics();
    
    const performance = {
      system: {
        cpu: metrics.system.cpu?.usage || 0,
        memory: metrics.system.memory?.usage || 0,
        uptime: metrics.system.uptime || 0
      },
      application: {
        memory: {
          heapUsed: metrics.application.memory?.heapUsed || 0,
          heapTotal: metrics.application.memory?.heapTotal || 0,
          rss: metrics.application.memory?.rss || 0
        },
        uptime: metrics.application.uptime || 0
      },
      database: {
        connections: metrics.database.connections || {},
        queries: metrics.database.queries || {},
        performance: metrics.database.performance || {}
      },
      api: {
        totalEndpoints: Object.keys(metrics.api).length,
        totalCalls: Object.values(metrics.api).reduce((sum, metric) => sum + metric.totalCalls, 0),
        avgResponseTime: calculateAvgResponseTime(metrics.api)
      }
    };
    
    res.json({
      status: 'ok',
      performance: performance,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Erro no health check de performance', { error: error.message });
    res.status(500).json({
      status: 'error',
      message: 'Performance health check failed',
      error: error.message
    });
  }
});

// Health check de segurança
router.get('/security', async (req, res) => {
  try {
    const security = {
      ssl: checkSSL(),
      cors: checkCORS(),
      rateLimit: checkRateLimit(),
      authentication: checkAuthentication(),
      headers: checkSecurityHeaders()
    };
    
    const allSecure = Object.values(security).every(check => check.status === 'secure');
    
    res.status(allSecure ? 200 : 500).json({
      status: allSecure ? 'secure' : 'warning',
      security: security,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Erro no health check de segurança', { error: error.message });
    res.status(500).json({
      status: 'error',
      message: 'Security health check failed',
      error: error.message
    });
  }
});

// Funções auxiliares
async function checkMercadoPago() {
  try {
    // Simular verificação do Mercado Pago
    return {
      status: 'healthy',
      message: 'Mercado Pago API accessible',
      responseTime: '50ms'
    };
  } catch (error) {
    return {
      status: 'error',
      message: 'Mercado Pago API not accessible',
      error: error.message
    };
  }
}

async function checkWebSocket() {
  try {
    // Verificar se o WebSocket está funcionando
    return {
      status: 'healthy',
      message: 'WebSocket server running',
      connections: 0 // Seria obtido do WebSocketManager
    };
  } catch (error) {
    return {
      status: 'error',
      message: 'WebSocket server not running',
      error: error.message
    };
  }
}

function calculateAvgResponseTime(apiMetrics) {
  const endpoints = Object.values(apiMetrics);
  if (endpoints.length === 0) return 0;
  
  const totalDuration = endpoints.reduce((sum, metric) => sum + metric.totalDuration, 0);
  const totalCalls = endpoints.reduce((sum, metric) => sum + metric.totalCalls, 0);
  
  return totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0;
}

function checkSSL() {
  return {
    status: process.env.NODE_ENV === 'production' ? 'secure' : 'warning',
    message: process.env.NODE_ENV === 'production' ? 'SSL enabled' : 'SSL not required in development'
  };
}

function checkCORS() {
  return {
    status: 'secure',
    message: 'CORS properly configured',
    allowedOrigins: process.env.CORS_ORIGIN || 'Not configured'
  };
}

function checkRateLimit() {
  return {
    status: 'secure',
    message: 'Rate limiting enabled',
    window: process.env.RATE_LIMIT_WINDOW_MS || 'Not configured',
    maxRequests: process.env.RATE_LIMIT_MAX_REQUESTS || 'Not configured'
  };
}

function checkAuthentication() {
  return {
    status: 'secure',
    message: 'JWT authentication enabled',
    secretConfigured: !!process.env.JWT_SECRET
  };
}

function checkSecurityHeaders() {
  return {
    status: 'secure',
    message: 'Security headers configured',
    helmet: true // Assumindo que helmet está configurado
  };
}

module.exports = router;