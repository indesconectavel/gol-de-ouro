/**
 * Dashboard de Monitoramento em Tempo Real
 * ETAPA 5 - Analytics e Monitoramento
 */

const express = require('express');
const path = require('path');

module.exports = (app, pool) => {
  // Servir página HTML do dashboard
  app.get('/monitoring', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/monitoring.html'));
  });

  // Endpoint para dados em tempo real (WebSocket-like via polling)
  app.get('/api/monitoring/realtime', async (req, res) => {
    try {
      const systemMonitor = require('../src/utils/monitoring');
      const analyticsCollector = require('../src/utils/analytics');
      
      const metrics = systemMonitor.getMetrics();
      const realTimeMetrics = analyticsCollector.getRealTimeMetrics();
      const alerts = systemMonitor.getActiveAlerts();
      
      // Verificar saúde do banco de dados
      await systemMonitor.checkDatabaseHealth(pool);
      
      const dashboardData = {
        timestamp: new Date().toISOString(),
        system: {
          status: metrics.status,
          uptime: Math.floor(metrics.system.uptime),
          cpu: Math.round(metrics.system.cpu * 100) / 100,
          memory: Math.round(metrics.system.memory * 100) / 100,
          loadAverage: metrics.system.loadAverage.map(load => Math.round(load * 100) / 100)
        },
        application: {
          activeUsers: realTimeMetrics.activeUsers,
          activeGames: realTimeMetrics.activeGames,
          totalBets: realTimeMetrics.totalBets,
          errorRate: Math.round(metrics.application.errorRate * 100) / 100,
          averageResponseTime: Math.round(metrics.application.averageResponseTime)
        },
        business: {
          totalRevenue: Math.round(realTimeMetrics.totalRevenue * 100) / 100,
          conversionRate: Math.round(realTimeMetrics.conversionRate * 100) / 100,
          averageGameDuration: Math.round(realTimeMetrics.averageGameDuration)
        },
        database: metrics.database,
        alerts: {
          count: alerts.length,
          critical: alerts.filter(a => a.severity === 'critical').length,
          warning: alerts.filter(a => a.severity === 'warning').length,
          recent: alerts.slice(0, 10).map(alert => ({
            ...alert,
            timeAgo: Math.floor((Date.now() - new Date(alert.timestamp).getTime()) / 1000)
          }))
        }
      };
      
      res.json({
        success: true,
        data: dashboardData
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erro ao obter dados de monitoramento',
        message: error.message
      });
    }
  });

  // Endpoint para histórico de métricas
  app.get('/api/monitoring/history', async (req, res) => {
    try {
      const { metric, hours = 24 } = req.query;
      
      // Implementar consulta ao banco para histórico
      // Por enquanto, retornar dados simulados
      const history = generateMockHistory(metric, parseInt(hours));
      
      res.json({
        success: true,
        data: {
          metric,
          hours: parseInt(hours),
          data: history
        }
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erro ao obter histórico de métricas',
        message: error.message
      });
    }
  });

  // Endpoint para logs em tempo real
  app.get('/api/monitoring/logs', async (req, res) => {
    try {
      const { level = 'info', limit = 50 } = req.query;
      
      // Implementar leitura de logs
      // Por enquanto, retornar logs simulados
      const logs = generateMockLogs(level, parseInt(limit));
      
      res.json({
        success: true,
        data: {
          level,
          logs,
          count: logs.length
        }
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erro ao obter logs',
        message: error.message
      });
    }
  });
};

// Função para gerar histórico simulado
function generateMockHistory(metric, hours) {
  const data = [];
  const now = new Date();
  const interval = 5; // 5 minutos
  
  for (let i = hours * 12; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - (i * interval * 60 * 1000));
    let value;
    
    switch (metric) {
      case 'cpu':
        value = Math.random() * 100;
        break;
      case 'memory':
        value = 60 + Math.random() * 30;
        break;
      case 'activeUsers':
        value = Math.floor(Math.random() * 100);
        break;
      case 'responseTime':
        value = Math.random() * 1000;
        break;
      default:
        value = Math.random() * 100;
    }
    
    data.push({
      timestamp: timestamp.toISOString(),
      value: Math.round(value * 100) / 100
    });
  }
  
  return data;
}

// Função para gerar logs simulados
function generateMockLogs(level, limit) {
  const logs = [];
  const levels = ['info', 'warn', 'error', 'debug'];
  const messages = [
    'User logged in successfully',
    'Game created with ID: game-123',
    'Payment processed successfully',
    'Database connection established',
    'WebSocket connection closed',
    'Rate limit exceeded for IP: 192.168.1.1',
    'Error processing payment: Invalid amount',
    'System health check completed',
    'New user registered: user@example.com',
    'Game finished: game-456'
  ];
  
  for (let i = 0; i < limit; i++) {
    const timestamp = new Date(Date.now() - (i * 1000));
    const logLevel = levels[Math.floor(Math.random() * levels.length)];
    const message = messages[Math.floor(Math.random() * messages.length)];
    
    if (level === 'all' || logLevel === level) {
      logs.push({
        timestamp: timestamp.toISOString(),
        level: logLevel,
        message,
        source: 'application'
      });
    }
  }
  
  return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}
