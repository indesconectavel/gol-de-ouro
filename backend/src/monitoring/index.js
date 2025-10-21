// Sistema de Monitoramento e Logs - Gol de Ouro v2.0
const winston = require('winston');
const { createClient } = require('@supabase/supabase-js');

// Configuração do Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'goldeouro-backend' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Configuração do Supabase para logs
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Sistema de Métricas
class MetricsCollector {
  constructor() {
    this.metrics = {
      requests: 0,
      errors: 0,
      gamesPlayed: 0,
      paymentsProcessed: 0,
      usersRegistered: 0,
      responseTime: []
    };
  }

  incrementCounter(metric) {
    this.metrics[metric] = (this.metrics[metric] || 0) + 1;
  }

  recordResponseTime(time) {
    this.metrics.responseTime.push(time);
    // Manter apenas os últimos 1000 tempos de resposta
    if (this.metrics.responseTime.length > 1000) {
      this.metrics.responseTime = this.metrics.responseTime.slice(-1000);
    }
  }

  getAverageResponseTime() {
    if (this.metrics.responseTime.length === 0) return 0;
    const sum = this.metrics.responseTime.reduce((a, b) => a + b, 0);
    return sum / this.metrics.responseTime.length;
  }

  async saveMetrics() {
    try {
      const metricsData = {
        ...this.metrics,
        averageResponseTime: this.getAverageResponseTime(),
        timestamp: new Date().toISOString()
      };

      await supabase
        .from('system_metrics')
        .insert([metricsData]);

      logger.info('Metrics saved successfully', { metrics: metricsData });
    } catch (error) {
      logger.error('Failed to save metrics', { error: error.message });
    }
  }
}

const metricsCollector = new MetricsCollector();

// Middleware de Logging
const loggingMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  // Log da requisição
  logger.info('Request received', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Incrementar contador de requisições
  metricsCollector.incrementCounter('requests');

  // Interceptar resposta
  const originalSend = res.send;
  res.send = function(data) {
    const responseTime = Date.now() - startTime;
    
    // Log da resposta
    logger.info('Response sent', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: responseTime,
      timestamp: new Date().toISOString()
    });

    // Registrar tempo de resposta
    metricsCollector.recordResponseTime(responseTime);

    // Incrementar contador de erros se necessário
    if (res.statusCode >= 400) {
      metricsCollector.incrementCounter('errors');
    }

    return originalSend.call(this, data);
  };

  next();
};

// Sistema de Alertas
class AlertSystem {
  constructor() {
    this.alertThresholds = {
      errorRate: 0.1, // 10% de taxa de erro
      responseTime: 5000, // 5 segundos
      memoryUsage: 0.8, // 80% de uso de memória
      cpuUsage: 0.8 // 80% de uso de CPU
    };
  }

  async checkAlerts() {
    try {
      const metrics = metricsCollector.metrics;
      const errorRate = metrics.errors / metrics.requests;
      
      // Verificar taxa de erro
      if (errorRate > this.alertThresholds.errorRate) {
        await this.sendAlert('HIGH_ERROR_RATE', {
          errorRate: errorRate,
          threshold: this.alertThresholds.errorRate
        });
      }

      // Verificar tempo de resposta
      const avgResponseTime = metricsCollector.getAverageResponseTime();
      if (avgResponseTime > this.alertThresholds.responseTime) {
        await this.sendAlert('HIGH_RESPONSE_TIME', {
          responseTime: avgResponseTime,
          threshold: this.alertThresholds.responseTime
        });
      }

      // Verificar uso de memória
      const memoryUsage = process.memoryUsage();
      const memoryUsagePercent = memoryUsage.heapUsed / memoryUsage.heapTotal;
      if (memoryUsagePercent > this.alertThresholds.memoryUsage) {
        await this.sendAlert('HIGH_MEMORY_USAGE', {
          memoryUsage: memoryUsagePercent,
          threshold: this.alertThresholds.memoryUsage
        });
      }

    } catch (error) {
      logger.error('Error checking alerts', { error: error.message });
    }
  }

  async sendAlert(type, data) {
    try {
      const alert = {
        type: type,
        data: data,
        timestamp: new Date().toISOString(),
        severity: this.getSeverity(type)
      };

      // Salvar alerta no banco
      await supabase
        .from('system_alerts')
        .insert([alert]);

      // Log do alerta
      logger.warn('Alert triggered', alert);

      // Aqui você pode adicionar integração com Slack, email, etc.
      console.log(`🚨 ALERT: ${type}`, data);

    } catch (error) {
      logger.error('Failed to send alert', { error: error.message });
    }
  }

  getSeverity(type) {
    const severityMap = {
      'HIGH_ERROR_RATE': 'critical',
      'HIGH_RESPONSE_TIME': 'warning',
      'HIGH_MEMORY_USAGE': 'warning',
      'HIGH_CPU_USAGE': 'warning'
    };
    return severityMap[type] || 'info';
  }
}

const alertSystem = new AlertSystem();

// Sistema de Health Check
class HealthChecker {
  async checkHealth() {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {}
    };

    try {
      // Verificar conexão com banco
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1);

      health.checks.database = {
        status: error ? 'unhealthy' : 'healthy',
        error: error?.message
      };

      // Verificar uso de memória
      const memoryUsage = process.memoryUsage();
      health.checks.memory = {
        status: 'healthy',
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        external: memoryUsage.external
      };

      // Verificar uptime
      health.checks.uptime = {
        status: 'healthy',
        uptime: process.uptime()
      };

      // Determinar status geral
      const unhealthyChecks = Object.values(health.checks)
        .filter(check => check.status === 'unhealthy');
      
      if (unhealthyChecks.length > 0) {
        health.status = 'unhealthy';
      }

    } catch (error) {
      health.status = 'unhealthy';
      health.error = error.message;
    }

    return health;
  }
}

const healthChecker = new HealthChecker();

// Inicializar sistema de monitoramento
const initializeMonitoring = () => {
  // Salvar métricas a cada 5 minutos
  setInterval(() => {
    metricsCollector.saveMetrics();
  }, 5 * 60 * 1000);

  // Verificar alertas a cada minuto
  setInterval(() => {
    alertSystem.checkAlerts();
  }, 60 * 1000);

  logger.info('Monitoring system initialized');
};

module.exports = {
  logger,
  metricsCollector,
  alertSystem,
  healthChecker,
  loggingMiddleware,
  initializeMonitoring
};
