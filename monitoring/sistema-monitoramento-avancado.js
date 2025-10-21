// 📊 SISTEMA DE MONITORAMENTO AVANÇADO - GOL DE OURO
// Data: 16 de Outubro de 2025
// Objetivo: Monitoramento completo e alertas automáticos

const https = require('https');
const fs = require('fs');
const path = require('path');

class SistemaMonitoramento {
  constructor() {
    this.config = {
      backend: 'https://goldeouro-backend.fly.dev',
      frontend: 'https://goldeouro.lol',
      admin: 'https://admin.goldeouro.lol',
      interval: 60000, // 1 minuto
      alertThresholds: {
        responseTime: 5000, // 5 segundos
        errorRate: 0.05, // 5%
        memoryUsage: 0.8, // 80%
        cpuUsage: 0.8 // 80%
      }
    };
    
    this.metrics = {
      uptime: Date.now(),
      checks: 0,
      errors: 0,
      lastCheck: null,
      status: 'unknown'
    };
    
    this.logFile = path.join(__dirname, 'logs', 'monitoring.log');
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}\n`;
    
    console.log(logEntry.trim());
    fs.appendFileSync(this.logFile, logEntry);
  }

  async checkEndpoint(url, name) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const options = {
        hostname: url.replace('https://', '').split('/')[0],
        port: 443,
        path: url.replace('https://', '').substring(url.replace('https://', '').indexOf('/')),
        method: 'GET',
        timeout: 10000
      };

      const req = https.request(options, (res) => {
        const responseTime = Date.now() - startTime;
        const isHealthy = res.statusCode === 200;
        
        resolve({
          name,
          url,
          status: res.statusCode,
          responseTime,
          healthy: isHealthy,
          timestamp: new Date().toISOString()
        });
      });

      req.on('error', (error) => {
        const responseTime = Date.now() - startTime;
        this.log(`❌ [${name}] Erro: ${error.message}`, 'ERROR');
        
        resolve({
          name,
          url,
          status: 0,
          responseTime,
          healthy: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      });

      req.on('timeout', () => {
        const responseTime = Date.now() - startTime;
        this.log(`⏰ [${name}] Timeout após ${responseTime}ms`, 'WARN');
        req.destroy();
        
        resolve({
          name,
          url,
          status: 0,
          responseTime,
          healthy: false,
          error: 'Timeout',
          timestamp: new Date().toISOString()
        });
      });

      req.setTimeout(10000);
      req.end();
    });
  }

  async checkSystemHealth() {
    this.log('🔍 [MONITORING] Iniciando verificação de saúde do sistema...');
    
    const checks = [
      this.checkEndpoint(`${this.config.backend}/health`, 'Backend'),
      this.checkEndpoint(this.config.frontend, 'Frontend Player'),
      this.checkEndpoint(this.config.admin, 'Frontend Admin')
    ];

    const results = await Promise.all(checks);
    
    // Analisar resultados
    const healthyCount = results.filter(r => r.healthy).length;
    const totalCount = results.length;
    const healthPercentage = (healthyCount / totalCount) * 100;
    
    // Atualizar métricas
    this.metrics.checks++;
    this.metrics.lastCheck = new Date().toISOString();
    
    if (healthPercentage === 100) {
      this.metrics.status = 'healthy';
      this.log(`✅ [MONITORING] Sistema 100% saudável (${healthyCount}/${totalCount})`);
    } else if (healthPercentage >= 66) {
      this.metrics.status = 'degraded';
      this.log(`⚠️ [MONITORING] Sistema degradado (${healthyCount}/${totalCount})`, 'WARN');
    } else {
      this.metrics.status = 'unhealthy';
      this.metrics.errors++;
      this.log(`❌ [MONITORING] Sistema não saudável (${healthyCount}/${totalCount})`, 'ERROR');
    }

    // Verificar alertas
    this.checkAlerts(results);
    
    return {
      overall: this.metrics.status,
      healthPercentage,
      checks: results,
      metrics: this.metrics
    };
  }

  checkAlerts(results) {
    results.forEach(result => {
      if (!result.healthy) {
        this.log(`🚨 [ALERT] ${result.name} está fora do ar!`, 'ERROR');
        this.sendAlert(`${result.name} está fora do ar`, 'critical');
      }
      
      if (result.responseTime > this.config.alertThresholds.responseTime) {
        this.log(`⚠️ [ALERT] ${result.name} lento: ${result.responseTime}ms`, 'WARN');
        this.sendAlert(`${result.name} está lento: ${result.responseTime}ms`, 'warning');
      }
    });
  }

  sendAlert(message, level) {
    // Implementar envio de alertas (email, Slack, etc.)
    this.log(`📢 [ALERT] ${level.toUpperCase()}: ${message}`, level.toUpperCase());
  }

  generateReport() {
    const uptime = Date.now() - this.metrics.uptime;
    const uptimeHours = Math.floor(uptime / (1000 * 60 * 60));
    const uptimeMinutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
    
    const report = {
      timestamp: new Date().toISOString(),
      uptime: `${uptimeHours}h ${uptimeMinutes}m`,
      totalChecks: this.metrics.checks,
      totalErrors: this.metrics.errors,
      errorRate: this.metrics.checks > 0 ? (this.metrics.errors / this.metrics.checks * 100).toFixed(2) : 0,
      status: this.metrics.status,
      lastCheck: this.metrics.lastCheck
    };

    this.log(`📊 [REPORT] Relatório gerado: ${JSON.stringify(report, null, 2)}`);
    return report;
  }

  async start() {
    this.log('🚀 [MONITORING] Sistema de monitoramento iniciado');
    
    // Verificação inicial
    await this.checkSystemHealth();
    
    // Verificações periódicas
    setInterval(async () => {
      await this.checkSystemHealth();
    }, this.config.interval);

    // Relatório a cada 10 minutos
    setInterval(() => {
      this.generateReport();
    }, 10 * 60 * 1000);
  }
}

// Inicializar sistema de monitoramento
const monitoring = new SistemaMonitoramento();
monitoring.start().catch(console.error);

module.exports = SistemaMonitoramento;
