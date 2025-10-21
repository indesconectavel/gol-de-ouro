// SISTEMA DE MONITORAMENTO AVANÇADO - GOL DE OURO v1.1.1
// Data: 2025-10-08T02:01:16.602Z

const pino = require('pino');
const config = require('../config/production');

class MonitoramentoAvancado {
  constructor() {
    this.logger = pino({
      level: config.LOG_LEVEL,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname'
        }
      }
    });

    this.metricas = {
      requests: 0,
      errors: 0,
      games: 0,
      payments: 0,
      users: 0,
      startTime: Date.now()
    };
  }

  // Log de requisições
  logRequest(req, res, responseTime) {
    this.metricas.requests++;
    
    this.logger.info({
      type: 'request',
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: responseTime,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
  }

  // Log de erros
  logError(error, context = {}) {
    this.metricas.errors++;
    
    this.logger.error({
      type: 'error',
      message: error.message,
      stack: error.stack,
      context: context,
      timestamp: new Date().toISOString()
    });
  }

  // Log de jogos
  logGame(gameId, action, data = {}) {
    this.metricas.games++;
    
    this.logger.info({
      type: 'game',
      gameId: gameId,
      action: action,
      data: data,
      timestamp: new Date().toISOString()
    });
  }

  // Log de pagamentos
  logPayment(paymentId, action, data = {}) {
    this.metricas.payments++;
    
    this.logger.info({
      type: 'payment',
      paymentId: paymentId,
      action: action,
      data: data,
      timestamp: new Date().toISOString()
    });
  }

  // Log de usuários
  logUser(userId, action, data = {}) {
    this.metricas.users++;
    
    this.logger.info({
      type: 'user',
      userId: userId,
      action: action,
      data: data,
      timestamp: new Date().toISOString()
    });
  }

  // Obter métricas
  getMetricas() {
    const uptime = Date.now() - this.metricas.startTime;
    
    return {
      ...this.metricas,
      uptime: uptime,
      requestsPerMinute: (this.metricas.requests / (uptime / 60000)).toFixed(2),
      errorRate: ((this.metricas.errors / this.metricas.requests) * 100).toFixed(2)
    };
  }

  // Health check avançado
  async healthCheck() {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      metricas: this.getMetricas()
    };

    // Verificar uso de memória
    if (health.memory.heapUsed > 500 * 1024 * 1024) { // 500MB
      health.status = 'warning';
      health.warnings = ['High memory usage'];
    }

    // Verificar taxa de erro
    if (parseFloat(health.metricas.errorRate) > 5) {
      health.status = 'error';
      health.errors = ['High error rate'];
    }

    return health;
  }
}

module.exports = new MonitoramentoAvancado();
