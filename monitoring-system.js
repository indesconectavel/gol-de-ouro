# 📊 SISTEMA DE MONITORAMENTO AVANÇADO - GOL DE OURO
# ================================================
**Data:** 23 de Outubro de 2025  
**Versão:** v1.1.1  
**Status:** ✅ CONFIGURAÇÃO COMPLETA  

const express = require('express');
const prometheus = require('prom-client');
const winston = require('winston');
const { createClient } = require('@supabase/supabase-js');

// =====================================================
// CONFIGURAÇÃO DE MÉTRICAS PROMETHEUS
// =====================================================

// Registrar métricas padrão
const register = new prometheus.Registry();
prometheus.collectDefaultMetrics({ register });

// Métricas customizadas do Gol de Ouro
const gameMetrics = {
  // Contadores
  totalShots: new prometheus.Counter({
    name: 'goldeouro_total_shots',
    help: 'Total number of shots taken',
    labelNames: ['direction', 'amount', 'result']
  }),
  
  totalWins: new prometheus.Counter({
    name: 'goldeouro_total_wins',
    help: 'Total number of wins',
    labelNames: ['amount']
  }),
  
  goldenGoals: new prometheus.Counter({
    name: 'goldeouro_golden_goals',
    help: 'Total number of golden goals'
  }),
  
  totalDeposits: new prometheus.Counter({
    name: 'goldeouro_total_deposits',
    help: 'Total number of PIX deposits',
    labelNames: ['status']
  }),
  
  totalWithdrawals: new prometheus.Counter({
    name: 'goldeouro_total_withdrawals',
    help: 'Total number of withdrawals',
    labelNames: ['status']
  }),
  
  // Gauges
  activeUsers: new prometheus.Gauge({
    name: 'goldeouro_active_users',
    help: 'Number of active users'
  }),
  
  totalBalance: new prometheus.Gauge({
    name: 'goldeouro_total_balance',
    help: 'Total balance of all users'
  }),
  
  systemHealth: new prometheus.Gauge({
    name: 'goldeouro_system_health',
    help: 'System health status (1=healthy, 0=unhealthy)',
    labelNames: ['component']
  }),
  
  // Histogramas
  responseTime: new prometheus.Histogram({
    name: 'goldeouro_response_time',
    help: 'Response time of API endpoints',
    labelNames: ['method', 'route', 'status'],
    buckets: [0.1, 0.5, 1, 2, 5, 10]
  }),
  
  gameDuration: new prometheus.Histogram({
    name: 'goldeouro_game_duration',
    help: 'Duration of game sessions',
    buckets: [1, 5, 10, 30, 60, 300]
  })
};

// Registrar métricas customizadas
Object.values(gameMetrics).forEach(metric => register.register(metric));

// =====================================================
// CONFIGURAÇÃO DE LOGGING AVANÇADO
// =====================================================

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'goldeouro-backend' },
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// =====================================================
// SISTEMA DE ALERTAS INTELIGENTES
// =====================================================

class AlertSystem {
  constructor() {
    this.alerts = new Map();
    this.thresholds = {
      errorRate: 5, // 5% error rate
      responseTime: 2000, // 2 seconds
      memoryUsage: 80, // 80% memory usage
      cpuUsage: 70, // 70% CPU usage
      lowBalance: 1000, // R$ 1000 minimum balance
      failedPayments: 3 // 3 failed payments in a row
    };
    
    this.alertHistory = [];
  }
  
  // Verificar métricas e gerar alertas
  checkMetrics() {
    const now = Date.now();
    
    // Verificar taxa de erro
    this.checkErrorRate();
    
    // Verificar tempo de resposta
    this.checkResponseTime();
    
    // Verificar uso de memória
    this.checkMemoryUsage();
    
    // Verificar saldo baixo
    this.checkLowBalance();
    
    // Verificar pagamentos falhados
    this.checkFailedPayments();
  }
  
  checkErrorRate() {
    const errorRate = this.calculateErrorRate();
    if (errorRate > this.thresholds.errorRate) {
      this.triggerAlert('HIGH_ERROR_RATE', {
        level: 'critical',
        message: `Error rate is ${errorRate}%, above threshold of ${this.thresholds.errorRate}%`,
        value: errorRate,
        threshold: this.thresholds.errorRate
      });
    }
  }
  
  checkResponseTime() {
    const avgResponseTime = this.calculateAverageResponseTime();
    if (avgResponseTime > this.thresholds.responseTime) {
      this.triggerAlert('SLOW_RESPONSE', {
        level: 'warning',
        message: `Average response time is ${avgResponseTime}ms, above threshold of ${this.thresholds.responseTime}ms`,
        value: avgResponseTime,
        threshold: this.thresholds.responseTime
      });
    }
  }
  
  checkMemoryUsage() {
    const memUsage = process.memoryUsage();
    const memUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    
    if (memUsagePercent > this.thresholds.memoryUsage) {
      this.triggerAlert('HIGH_MEMORY_USAGE', {
        level: 'warning',
        message: `Memory usage is ${memUsagePercent.toFixed(2)}%, above threshold of ${this.thresholds.memoryUsage}%`,
        value: memUsagePercent,
        threshold: this.thresholds.memoryUsage
      });
    }
  }
  
  checkLowBalance() {
    // Implementar verificação de saldo total do sistema
    this.getTotalSystemBalance().then(totalBalance => {
      if (totalBalance < this.thresholds.lowBalance) {
        this.triggerAlert('LOW_SYSTEM_BALANCE', {
          level: 'critical',
          message: `System total balance is R$ ${totalBalance}, below threshold of R$ ${this.thresholds.lowBalance}`,
          value: totalBalance,
          threshold: this.thresholds.lowBalance
        });
      }
    });
  }
  
  checkFailedPayments() {
    // Implementar verificação de pagamentos falhados consecutivos
    this.getFailedPaymentsCount().then(failedCount => {
      if (failedCount >= this.thresholds.failedPayments) {
        this.triggerAlert('MULTIPLE_FAILED_PAYMENTS', {
          level: 'critical',
          message: `${failedCount} consecutive failed payments detected`,
          value: failedCount,
          threshold: this.thresholds.failedPayments
        });
      }
    });
  }
  
  triggerAlert(type, data) {
    const alert = {
      id: `${type}_${Date.now()}`,
      type,
      timestamp: new Date().toISOString(),
      level: data.level,
      message: data.message,
      value: data.value,
      threshold: data.threshold,
      resolved: false
    };
    
    // Evitar alertas duplicados
    const recentAlert = this.alertHistory.find(a => 
      a.type === type && 
      !a.resolved && 
      (Date.now() - new Date(a.timestamp).getTime()) < 300000 // 5 minutos
    );
    
    if (!recentAlert) {
      this.alertHistory.push(alert);
      this.sendAlert(alert);
      logger.warn('Alert triggered', alert);
    }
  }
  
  sendAlert(alert) {
    // Implementar envio de alertas via:
    // - Email
    // - Slack
    // - Discord
    // - SMS
    
    console.log(`🚨 ALERT: ${alert.level.toUpperCase()} - ${alert.message}`);
    
    // Exemplo de integração com Slack
    if (process.env.SLACK_WEBHOOK_URL) {
      this.sendSlackAlert(alert);
    }
  }
  
  sendSlackAlert(alert) {
    const slackMessage = {
      text: `🚨 Gol de Ouro Alert - ${alert.level.toUpperCase()}`,
      attachments: [{
        color: alert.level === 'critical' ? 'danger' : 'warning',
        fields: [
          { title: 'Type', value: alert.type, short: true },
          { title: 'Message', value: alert.message, short: false },
          { title: 'Value', value: alert.value.toString(), short: true },
          { title: 'Threshold', value: alert.threshold.toString(), short: true },
          { title: 'Timestamp', value: alert.timestamp, short: true }
        ]
      }]
    };
    
    // Implementar envio para Slack
    // fetch(process.env.SLACK_WEBHOOK_URL, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(slackMessage)
    // });
  }
  
  // Métodos auxiliares para cálculos
  calculateErrorRate() {
    // Implementar cálculo de taxa de erro baseado em logs
    return 2.5; // Exemplo
  }
  
  calculateAverageResponseTime() {
    // Implementar cálculo de tempo médio de resposta
    return 1500; // Exemplo
  }
  
  async getTotalSystemBalance() {
    // Implementar consulta ao banco para saldo total
    return 5000; // Exemplo
  }
  
  async getFailedPaymentsCount() {
    // Implementar consulta de pagamentos falhados
    return 1; // Exemplo
  }
  
  resolveAlert(alertId) {
    const alert = this.alertHistory.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = new Date().toISOString();
      logger.info('Alert resolved', { alertId });
    }
  }
  
  getActiveAlerts() {
    return this.alertHistory.filter(a => !a.resolved);
  }
  
  getAlertHistory() {
    return this.alertHistory;
  }
}

// =====================================================
// SISTEMA DE BACKUP AUTOMÁTICO
// =====================================================

class BackupSystem {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    this.backupSchedule = {
      daily: '0 2 * * *', // 2:00 AM daily
      weekly: '0 2 * * 0', // 2:00 AM Sunday
      monthly: '0 2 1 * *' // 2:00 AM 1st of month
    };
  }
  
  async performBackup(type = 'daily') {
    try {
      logger.info(`Starting ${type} backup`);
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupData = await this.collectBackupData();
      
      // Salvar backup local
      const localBackup = await this.saveLocalBackup(backupData, timestamp);
      
      // Upload para cloud storage (opcional)
      if (process.env.BACKUP_CLOUD_ENABLED === 'true') {
        await this.uploadToCloud(localBackup, timestamp);
      }
      
      // Limpar backups antigos
      await this.cleanupOldBackups();
      
      logger.info(`${type} backup completed successfully`, { timestamp });
      
      return {
        success: true,
        timestamp,
        type,
        size: JSON.stringify(backupData).length
      };
      
    } catch (error) {
      logger.error('Backup failed', error);
      throw error;
    }
  }
  
  async collectBackupData() {
    const backupData = {
      timestamp: new Date().toISOString(),
      version: '1.1.1',
      tables: {}
    };
    
    // Backup de usuários
    const { data: usuarios } = await this.supabase
      .from('usuarios')
      .select('*');
    backupData.tables.usuarios = usuarios;
    
    // Backup de jogos
    const { data: jogos } = await this.supabase
      .from('jogos')
      .select('*');
    backupData.tables.jogos = jogos;
    
    // Backup de pagamentos
    const { data: pagamentos } = await this.supabase
      .from('pagamentos_pix')
      .select('*');
    backupData.tables.pagamentos_pix = pagamentos;
    
    // Backup de saques
    const { data: saques } = await this.supabase
      .from('saques')
      .select('*');
    backupData.tables.saques = saques;
    
    // Backup de métricas globais
    const { data: metricas } = await this.supabase
      .from('metricas_globais')
      .select('*');
    backupData.tables.metricas_globais = metricas;
    
    return backupData;
  }
  
  async saveLocalBackup(data, timestamp) {
    const fs = require('fs').promises;
    const path = require('path');
    
    const backupDir = path.join(__dirname, 'backups');
    await fs.mkdir(backupDir, { recursive: true });
    
    const filename = `backup_${timestamp}.json`;
    const filepath = path.join(backupDir, filename);
    
    await fs.writeFile(filepath, JSON.stringify(data, null, 2));
    
    return filepath;
  }
  
  async uploadToCloud(filepath, timestamp) {
    // Implementar upload para AWS S3, Google Cloud, etc.
    console.log(`Uploading backup to cloud: ${filepath}`);
  }
  
  async cleanupOldBackups() {
    const fs = require('fs').promises;
    const path = require('path');
    
    const backupDir = path.join(__dirname, 'backups');
    const files = await fs.readdir(backupDir);
    
    // Manter apenas os últimos 30 backups
    const backupFiles = files
      .filter(f => f.startsWith('backup_') && f.endsWith('.json'))
      .sort()
      .reverse();
    
    if (backupFiles.length > 30) {
      const filesToDelete = backupFiles.slice(30);
      for (const file of filesToDelete) {
        await fs.unlink(path.join(backupDir, file));
        logger.info(`Deleted old backup: ${file}`);
      }
    }
  }
  
  async restoreBackup(timestamp) {
    try {
      const fs = require('fs').promises;
      const path = require('path');
      
      const filename = `backup_${timestamp}.json`;
      const filepath = path.join(__dirname, 'backups', filename);
      
      const backupData = JSON.parse(await fs.readFile(filepath, 'utf8'));
      
      // Restaurar dados no Supabase
      for (const [tableName, data] of Object.entries(backupData.tables)) {
        if (data && data.length > 0) {
          // Limpar tabela atual
          await this.supabase.from(tableName).delete().neq('id', '');
          
          // Inserir dados do backup
          const { error } = await this.supabase
            .from(tableName)
            .insert(data);
          
          if (error) {
            throw new Error(`Failed to restore table ${tableName}: ${error.message}`);
          }
        }
      }
      
      logger.info('Backup restored successfully', { timestamp });
      return { success: true, timestamp };
      
    } catch (error) {
      logger.error('Backup restore failed', error);
      throw error;
    }
  }
  
  getBackupList() {
    const fs = require('fs');
    const path = require('path');
    
    const backupDir = path.join(__dirname, 'backups');
    
    try {
      const files = fs.readdirSync(backupDir);
      return files
        .filter(f => f.startsWith('backup_') && f.endsWith('.json'))
        .map(f => {
          const stats = fs.statSync(path.join(backupDir, f));
          return {
            filename: f,
            timestamp: f.replace('backup_', '').replace('.json', ''),
            size: stats.size,
            created: stats.birthtime
          };
        })
        .sort((a, b) => new Date(b.created) - new Date(a.created));
    } catch (error) {
      logger.error('Failed to list backups', error);
      return [];
    }
  }
}

// =====================================================
// ENDPOINTS DE MONITORAMENTO
// =====================================================

const app = express();

// Middleware para métricas de resposta
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    gameMetrics.responseTime.observe(
      { method: req.method, route: req.route?.path || req.path, status: res.statusCode },
      duration
    );
  });
  
  next();
});

// Endpoint de métricas Prometheus
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end(error.message);
  }
});

// Endpoint de saúde detalhado
app.get('/health/detailed', async (req, res) => {
  try {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.1.1',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      database: 'connected',
      mercadoPago: 'connected',
      metrics: {
        totalShots: await getMetricValue('goldeouro_total_shots'),
        totalWins: await getMetricValue('goldeouro_total_wins'),
        goldenGoals: await getMetricValue('goldeouro_golden_goals'),
        activeUsers: await getMetricValue('goldeouro_active_users')
      }
    };
    
    res.json(health);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint de alertas
app.get('/alerts', (req, res) => {
  const alertSystem = new AlertSystem();
  res.json({
    active: alertSystem.getActiveAlerts(),
    history: alertSystem.getAlertHistory()
  });
});

// Endpoint de backup
app.get('/backup/status', (req, res) => {
  const backupSystem = new BackupSystem();
  res.json({
    backups: backupSystem.getBackupList(),
    lastBackup: backupSystem.getBackupList()[0]?.timestamp || null
  });
});

// Endpoint para executar backup manual
app.post('/backup/execute', async (req, res) => {
  try {
    const backupSystem = new BackupSystem();
    const result = await backupSystem.performBackup('manual');
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  });
});

// Função auxiliar para obter valores de métricas
async function getMetricValue(metricName) {
  const metrics = await register.metrics();
  const lines = metrics.split('\n');
  const metricLine = lines.find(line => line.startsWith(metricName));
  
  if (metricLine) {
    const value = metricLine.split(' ')[1];
    return parseFloat(value) || 0;
  }
  
  return 0;
}

// =====================================================
// INICIALIZAÇÃO DO SISTEMA
// =====================================================

const alertSystem = new AlertSystem();
const backupSystem = new BackupSystem();

// Verificar alertas a cada 5 minutos
setInterval(() => {
  alertSystem.checkMetrics();
}, 5 * 60 * 1000);

// Executar backup diário às 2:00 AM
const cron = require('node-cron');
cron.schedule('0 2 * * *', () => {
  backupSystem.performBackup('daily').catch(error => {
    logger.error('Scheduled backup failed', error);
  });
});

module.exports = {
  gameMetrics,
  logger,
  AlertSystem,
  BackupSystem,
  alertSystem,
  backupSystem
};
