// Sistema de Monitoramento - Gol de Ouro v1.1.1
const os = require('os');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

class MonitoringSystem {
  constructor() {
    this.metrics = {
      system: {},
      application: {},
      database: {},
      api: {},
      websocket: {}
    };
    
    this.alerts = [];
    this.thresholds = {
      cpu: 80,
      memory: 85,
      disk: 90,
      responseTime: 5000,
      errorRate: 5
    };
    
    this.startMonitoring();
  }

  startMonitoring() {
    // Coletar métricas a cada 30 segundos
    setInterval(() => {
      this.collectSystemMetrics();
      this.collectApplicationMetrics();
      this.checkAlerts();
    }, 30000);

    // Coletar métricas de banco a cada 60 segundos
    setInterval(() => {
      this.collectDatabaseMetrics();
    }, 60000);

    logger.info('Sistema de monitoramento iniciado');
  }

  collectSystemMetrics() {
    try {
      const cpus = os.cpus();
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;

      this.metrics.system = {
        timestamp: new Date().toISOString(),
        cpu: {
          cores: cpus.length,
          usage: this.calculateCPUUsage(cpus),
          loadAverage: os.loadavg()
        },
        memory: {
          total: totalMem,
          used: usedMem,
          free: freeMem,
          usage: (usedMem / totalMem) * 100
        },
        uptime: os.uptime(),
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version
      };

      logger.debug('Métricas do sistema coletadas', this.metrics.system);
    } catch (error) {
      logger.error('Erro ao coletar métricas do sistema', { error: error.message });
    }
  }

  calculateCPUUsage(cpus) {
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });

    return {
      idle: totalIdle / cpus.length,
      total: totalTick / cpus.length,
      usage: 100 - ~~(100 * totalIdle / totalTick)
    };
  }

  collectApplicationMetrics() {
    try {
      const memUsage = process.memoryUsage();
      
      this.metrics.application = {
        timestamp: new Date().toISOString(),
        memory: {
          rss: memUsage.rss,
          heapTotal: memUsage.heapTotal,
          heapUsed: memUsage.heapUsed,
          external: memUsage.external,
          arrayBuffers: memUsage.arrayBuffers
        },
        uptime: process.uptime(),
        pid: process.pid,
        version: process.version,
        platform: process.platform,
        arch: process.arch
      };

      logger.debug('Métricas da aplicação coletadas', this.metrics.application);
    } catch (error) {
      logger.error('Erro ao coletar métricas da aplicação', { error: error.message });
    }
  }

  async collectDatabaseMetrics() {
    try {
      // Simular coleta de métricas do banco
      // Em uma implementação real, isso consultaria o banco de dados
      this.metrics.database = {
        timestamp: new Date().toISOString(),
        connections: {
          active: Math.floor(Math.random() * 10) + 5,
          idle: Math.floor(Math.random() * 5) + 2,
          total: Math.floor(Math.random() * 15) + 7
        },
        queries: {
          total: Math.floor(Math.random() * 1000) + 500,
          slow: Math.floor(Math.random() * 10),
          errors: Math.floor(Math.random() * 5)
        },
        performance: {
          avgResponseTime: Math.floor(Math.random() * 100) + 50,
          maxResponseTime: Math.floor(Math.random() * 500) + 200
        }
      };

      logger.debug('Métricas do banco coletadas', this.metrics.database);
    } catch (error) {
      logger.error('Erro ao coletar métricas do banco', { error: error.message });
    }
  }

  recordAPICall(method, url, statusCode, duration, userId = null) {
    const timestamp = new Date().toISOString();
    
    if (!this.metrics.api[url]) {
      this.metrics.api[url] = {
        totalCalls: 0,
        successCalls: 0,
        errorCalls: 0,
        totalDuration: 0,
        avgDuration: 0,
        lastCall: timestamp
      };
    }

    const apiMetric = this.metrics.api[url];
    apiMetric.totalCalls++;
    apiMetric.totalDuration += duration;
    apiMetric.avgDuration = apiMetric.totalDuration / apiMetric.totalCalls;
    apiMetric.lastCall = timestamp;

    if (statusCode >= 200 && statusCode < 400) {
      apiMetric.successCalls++;
    } else {
      apiMetric.errorCalls++;
    }

    logger.logAPI(method, url, statusCode, duration, userId);
  }

  recordWebSocketEvent(event, userId, meta = {}) {
    const timestamp = new Date().toISOString();
    
    if (!this.metrics.websocket[event]) {
      this.metrics.websocket[event] = {
        totalEvents: 0,
        uniqueUsers: new Set(),
        lastEvent: timestamp
      };
    }

    const wsMetric = this.metrics.websocket[event];
    wsMetric.totalEvents++;
    wsMetric.uniqueUsers.add(userId);
    wsMetric.lastEvent = timestamp;

    logger.logWebSocket(event, userId, meta);
  }

  checkAlerts() {
    const alerts = [];

    // Verificar CPU
    if (this.metrics.system.cpu?.usage > this.thresholds.cpu) {
      alerts.push({
        type: 'cpu',
        level: 'warning',
        message: `CPU usage is ${this.metrics.system.cpu.usage.toFixed(2)}%`,
        value: this.metrics.system.cpu.usage,
        threshold: this.thresholds.cpu
      });
    }

    // Verificar memória
    if (this.metrics.system.memory?.usage > this.thresholds.memory) {
      alerts.push({
        type: 'memory',
        level: 'warning',
        message: `Memory usage is ${this.metrics.system.memory.usage.toFixed(2)}%`,
        value: this.metrics.system.memory.usage,
        threshold: this.thresholds.memory
      });
    }

    // Verificar taxa de erro da API
    Object.entries(this.metrics.api).forEach(([url, metric]) => {
      const errorRate = (metric.errorCalls / metric.totalCalls) * 100;
      if (errorRate > this.thresholds.errorRate) {
        alerts.push({
          type: 'api_error_rate',
          level: 'error',
          message: `High error rate for ${url}: ${errorRate.toFixed(2)}%`,
          value: errorRate,
          threshold: this.thresholds.errorRate,
          url: url
        });
      }
    });

    // Processar alertas
    alerts.forEach(alert => {
      this.processAlert(alert);
    });
  }

  processAlert(alert) {
    const alertId = `${alert.type}_${Date.now()}`;
    
    // Verificar se já existe alerta similar recente
    const recentAlert = this.alerts.find(a => 
      a.type === alert.type && 
      (Date.now() - new Date(a.timestamp).getTime()) < 300000 // 5 minutos
    );

    if (recentAlert) {
      return; // Não duplicar alertas
    }

    const fullAlert = {
      id: alertId,
      ...alert,
      timestamp: new Date().toISOString(),
      resolved: false
    };

    this.alerts.push(fullAlert);

    // Log do alerta
    if (alert.level === 'error') {
      logger.error(`ALERT: ${alert.message}`, fullAlert);
    } else {
      logger.warn(`ALERT: ${alert.message}`, fullAlert);
    }

    // Em uma implementação real, aqui você enviaria notificações
    // para Slack, email, SMS, etc.
    this.sendNotification(fullAlert);
  }

  sendNotification(alert) {
    // Simular envio de notificação
    console.log(`🚨 ALERTA: ${alert.message}`);
    
    // Em produção, implementar:
    // - Slack webhook
    // - Email via SendGrid
    // - SMS via Twilio
    // - Discord webhook
  }

  getHealthStatus() {
    const status = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        system: this.checkSystemHealth(),
        application: this.checkApplicationHealth(),
        database: this.checkDatabaseHealth(),
        api: this.checkAPIHealth()
      }
    };

    // Determinar status geral
    const checks = Object.values(status.checks);
    if (checks.some(check => check.status === 'error')) {
      status.status = 'error';
    } else if (checks.some(check => check.status === 'warning')) {
      status.status = 'warning';
    }

    return status;
  }

  checkSystemHealth() {
    const cpu = this.metrics.system.cpu?.usage || 0;
    const memory = this.metrics.system.memory?.usage || 0;

    if (cpu > this.thresholds.cpu || memory > this.thresholds.memory) {
      return { status: 'warning', message: 'High resource usage' };
    }

    return { status: 'healthy', message: 'System resources normal' };
  }

  checkApplicationHealth() {
    const heapUsed = this.metrics.application.memory?.heapUsed || 0;
    const heapTotal = this.metrics.application.memory?.heapTotal || 1;
    const heapUsage = (heapUsed / heapTotal) * 100;

    if (heapUsage > 90) {
      return { status: 'warning', message: 'High memory usage' };
    }

    return { status: 'healthy', message: 'Application memory normal' };
  }

  checkDatabaseHealth() {
    const db = this.metrics.database;
    if (!db) {
      return { status: 'error', message: 'Database metrics not available' };
    }

    const errorRate = (db.queries?.errors || 0) / Math.max(db.queries?.total || 1, 1) * 100;
    
    if (errorRate > 10) {
      return { status: 'error', message: 'High database error rate' };
    }

    return { status: 'healthy', message: 'Database performing well' };
  }

  checkAPIHealth() {
    const apiMetrics = Object.values(this.metrics.api);
    if (apiMetrics.length === 0) {
      return { status: 'healthy', message: 'No API calls recorded' };
    }

    const totalCalls = apiMetrics.reduce((sum, metric) => sum + metric.totalCalls, 0);
    const totalErrors = apiMetrics.reduce((sum, metric) => sum + metric.errorCalls, 0);
    const errorRate = (totalErrors / totalCalls) * 100;

    if (errorRate > this.thresholds.errorRate) {
      return { status: 'warning', message: `High API error rate: ${errorRate.toFixed(2)}%` };
    }

    return { status: 'healthy', message: 'API performing well' };
  }

  getMetrics() {
    return {
      ...this.metrics,
      alerts: this.alerts.filter(alert => !alert.resolved),
      health: this.getHealthStatus()
    };
  }

  resolveAlert(alertId) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = new Date().toISOString();
      logger.info(`Alert resolved: ${alertId}`, { alertId });
    }
  }

  // Limpar alertas antigos
  cleanOldAlerts() {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - 24); // 24 horas

    this.alerts = this.alerts.filter(alert => 
      new Date(alert.timestamp) > cutoff || !alert.resolved
    );
  }
}

// Instância singleton
const monitoring = new MonitoringSystem();

module.exports = monitoring;