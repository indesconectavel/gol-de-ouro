// SISTEMA DE MONITORAMENTO DE PERFORMANCE SUPABASE - GOL DE OURO v1.2.0
// ======================================================================
// Data: 23/10/2025
// Status: SISTEMA COMPLETO DE MONITORAMENTO DE PERFORMANCE
// Versão: v1.2.0-performance-monitoring-final

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

// =====================================================
// CONFIGURAÇÃO DO MONITORAMENTO
// =====================================================

const MONITORING_CONFIG = {
  // Configurações de coleta
  collectionInterval: 60000, // 1 minuto
  retentionDays: 7,
  
  // Thresholds de alerta
  thresholds: {
    queryTime: 2000, // 2 segundos
    connectionTime: 1000, // 1 segundo
    errorRate: 0.05, // 5%
    memoryUsage: 0.8, // 80%
    cpuUsage: 0.8 // 80%
  },
  
  // Configurações de métricas
  metrics: {
    enabled: true,
    detailed: true,
    realTime: true
  }
};

// Cliente Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// =====================================================
// MÉTRICAS DE PERFORMANCE
// =====================================================

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      queries: [],
      connections: [],
      errors: [],
      performance: []
    };
    
    this.alerts = [];
    this.isMonitoring = false;
  }
  
  /**
   * Iniciar monitoramento
   */
  async startMonitoring() {
    if (this.isMonitoring) {
      console.log('⚠️ [MONITOR] Monitoramento já está ativo');
      return;
    }
    
    console.log('🚀 [MONITOR] Iniciando monitoramento de performance...');
    this.isMonitoring = true;
    
    // Iniciar coleta de métricas
    this.collectionInterval = setInterval(async () => {
      await this.collectMetrics();
    }, MONITORING_CONFIG.collectionInterval);
    
    console.log('✅ [MONITOR] Monitoramento iniciado');
  }
  
  /**
   * Parar monitoramento
   */
  stopMonitoring() {
    if (!this.isMonitoring) {
      console.log('⚠️ [MONITOR] Monitoramento não está ativo');
      return;
    }
    
    console.log('🛑 [MONITOR] Parando monitoramento...');
    this.isMonitoring = false;
    
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
    }
    
    console.log('✅ [MONITOR] Monitoramento parado');
  }
  
  /**
   * Coletar métricas de performance
   */
  async collectMetrics() {
    try {
      const timestamp = new Date().toISOString();
      
      // Métrica 1: Tempo de conexão
      const connectionTime = await this.measureConnectionTime();
      
      // Métrica 2: Tempo de query
      const queryTime = await this.measureQueryTime();
      
      // Métrica 3: Contagem de erros
      const errorCount = await this.countErrors();
      
      // Métrica 4: Uso de recursos
      const resourceUsage = await this.getResourceUsage();
      
      // Armazenar métricas
      const metric = {
        timestamp,
        connectionTime,
        queryTime,
        errorCount,
        resourceUsage,
        alerts: []
      };
      
      // Verificar alertas
      await this.checkAlerts(metric);
      
      this.metrics.performance.push(metric);
      
      // Manter apenas últimas 24 horas
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
      this.metrics.performance = this.metrics.performance.filter(m => new Date(m.timestamp) > cutoff);
      
      console.log(`📊 [MONITOR] Métricas coletadas: ${timestamp}`);
      
    } catch (error) {
      console.error('❌ [MONITOR] Erro na coleta de métricas:', error.message);
    }
  }
  
  /**
   * Medir tempo de conexão
   */
  async measureConnectionTime() {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id')
        .limit(1);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      this.metrics.connections.push({
        timestamp: new Date().toISOString(),
        duration,
        success: !error,
        error: error?.message
      });
      
      return {
        duration,
        success: !error,
        error: error?.message
      };
      
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      return {
        duration,
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Medir tempo de query
   */
  async measureQueryTime() {
    const startTime = Date.now();
    
    try {
      // Query complexa para medir performance
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, email, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      this.metrics.queries.push({
        timestamp: new Date().toISOString(),
        duration,
        success: !error,
        error: error?.message,
        recordCount: data?.length || 0
      });
      
      return {
        duration,
        success: !error,
        error: error?.message,
        recordCount: data?.length || 0
      };
      
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      return {
        duration,
        success: false,
        error: error.message,
        recordCount: 0
      };
    }
  }
  
  /**
   * Contar erros recentes
   */
  async countErrors() {
    try {
      // Contar erros das últimas 5 minutos
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      const recentErrors = this.metrics.errors.filter(error => 
        new Date(error.timestamp) > new Date(fiveMinutesAgo)
      );
      
      return recentErrors.length;
      
    } catch (error) {
      console.error('❌ [MONITOR] Erro ao contar erros:', error.message);
      return 0;
    }
  }
  
  /**
   * Obter uso de recursos
   */
  async getResourceUsage() {
    try {
      const usage = process.memoryUsage();
      
      return {
        memory: {
          rss: usage.rss,
          heapTotal: usage.heapTotal,
          heapUsed: usage.heapUsed,
          external: usage.external
        },
        cpu: process.cpuUsage(),
        uptime: process.uptime()
      };
      
    } catch (error) {
      console.error('❌ [MONITOR] Erro ao obter uso de recursos:', error.message);
      return null;
    }
  }
  
  /**
   * Verificar alertas
   */
  async checkAlerts(metric) {
    const alerts = [];
    
    // Alerta de tempo de conexão
    if (metric.connectionTime.duration > MONITORING_CONFIG.thresholds.connectionTime) {
      alerts.push({
        type: 'slow_connection',
        severity: 'warning',
        message: `Conexão lenta: ${metric.connectionTime.duration}ms`,
        threshold: MONITORING_CONFIG.thresholds.connectionTime,
        actual: metric.connectionTime.duration
      });
    }
    
    // Alerta de tempo de query
    if (metric.queryTime.duration > MONITORING_CONFIG.thresholds.queryTime) {
      alerts.push({
        type: 'slow_query',
        severity: 'warning',
        message: `Query lenta: ${metric.queryTime.duration}ms`,
        threshold: MONITORING_CONFIG.thresholds.queryTime,
        actual: metric.queryTime.duration
      });
    }
    
    // Alerta de taxa de erro
    const errorRate = metric.errorCount / 5; // 5 minutos
    if (errorRate > MONITORING_CONFIG.thresholds.errorRate) {
      alerts.push({
        type: 'high_error_rate',
        severity: 'critical',
        message: `Taxa de erro alta: ${(errorRate * 100).toFixed(2)}%`,
        threshold: MONITORING_CONFIG.thresholds.errorRate,
        actual: errorRate
      });
    }
    
    // Alerta de uso de memória
    if (metric.resourceUsage?.memory) {
      const memoryUsage = metric.resourceUsage.memory.heapUsed / metric.resourceUsage.memory.heapTotal;
      if (memoryUsage > MONITORING_CONFIG.thresholds.memoryUsage) {
        alerts.push({
          type: 'high_memory_usage',
          severity: 'warning',
          message: `Uso de memória alto: ${(memoryUsage * 100).toFixed(2)}%`,
          threshold: MONITORING_CONFIG.thresholds.memoryUsage,
          actual: memoryUsage
        });
      }
    }
    
    // Adicionar alertas à métrica
    metric.alerts = alerts;
    
    // Armazenar alertas
    if (alerts.length > 0) {
      this.alerts.push(...alerts.map(alert => ({
        ...alert,
        timestamp: metric.timestamp
      })));
      
      console.log(`🚨 [ALERT] ${alerts.length} alertas gerados`);
    }
  }
  
  /**
   * Obter estatísticas de performance
   */
  getPerformanceStats() {
    if (this.metrics.performance.length === 0) {
      return {
        message: 'Nenhuma métrica coletada ainda',
        dataAvailable: false
      };
    }
    
    const stats = {
      dataAvailable: true,
      totalMetrics: this.metrics.performance.length,
      timeRange: {
        start: this.metrics.performance[0].timestamp,
        end: this.metrics.performance[this.metrics.performance.length - 1].timestamp
      },
      averages: {},
      alerts: {
        total: this.alerts.length,
        byType: {},
        bySeverity: {}
      }
    };
    
    // Calcular médias
    const connectionTimes = this.metrics.performance.map(m => m.connectionTime.duration);
    const queryTimes = this.metrics.performance.map(m => m.queryTime.duration);
    
    stats.averages = {
      connectionTime: connectionTimes.reduce((a, b) => a + b, 0) / connectionTimes.length,
      queryTime: queryTimes.reduce((a, b) => a + b, 0) / queryTimes.length,
      errorCount: this.metrics.performance.reduce((sum, m) => sum + m.errorCount, 0) / this.metrics.performance.length
    };
    
    // Estatísticas de alertas
    this.alerts.forEach(alert => {
      stats.alerts.byType[alert.type] = (stats.alerts.byType[alert.type] || 0) + 1;
      stats.alerts.bySeverity[alert.severity] = (stats.alerts.bySeverity[alert.severity] || 0) + 1;
    });
    
    return stats;
  }
  
  /**
   * Obter relatório de performance
   */
  async generatePerformanceReport() {
    try {
      console.log('📊 [REPORT] Gerando relatório de performance...');
      
      const stats = this.getPerformanceStats();
      const timestamp = new Date().toISOString();
      
      const report = {
        metadata: {
          timestamp,
          version: '1.2.0',
          type: 'performance_report'
        },
        summary: {
          monitoringActive: this.isMonitoring,
          totalMetrics: stats.totalMetrics || 0,
          totalAlerts: stats.alerts?.total || 0,
          health: this.determineHealth(stats)
        },
        performance: stats.averages || {},
        alerts: stats.alerts || {},
        recommendations: this.generateRecommendations(stats)
      };
      
      // Salvar relatório
      const reportFile = path.join('./reports', `performance-report-${timestamp.replace(/[:.]/g, '-')}.json`);
      await fs.mkdir('./reports', { recursive: true });
      await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
      
      console.log(`✅ [REPORT] Relatório salvo: ${reportFile}`);
      
      return report;
      
    } catch (error) {
      console.error('❌ [REPORT] Erro ao gerar relatório:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Determinar saúde do sistema
   */
  determineHealth(stats) {
    if (!stats.dataAvailable) {
      return 'unknown';
    }
    
    const criticalAlerts = stats.alerts?.bySeverity?.critical || 0;
    const warningAlerts = stats.alerts?.bySeverity?.warning || 0;
    
    if (criticalAlerts > 0) {
      return 'critical';
    } else if (warningAlerts > 2) {
      return 'warning';
    } else if (warningAlerts > 0) {
      return 'good';
    } else {
      return 'excellent';
    }
  }
  
  /**
   * Gerar recomendações
   */
  generateRecommendations(stats) {
    const recommendations = [];
    
    if (stats.averages?.connectionTime > MONITORING_CONFIG.thresholds.connectionTime) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        message: 'Otimizar conexões com o banco de dados',
        details: 'Considerar pool de conexões ou otimizar queries'
      });
    }
    
    if (stats.averages?.queryTime > MONITORING_CONFIG.thresholds.queryTime) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        message: 'Otimizar queries lentas',
        details: 'Revisar índices e otimizar consultas complexas'
      });
    }
    
    if (stats.averages?.errorCount > 0) {
      recommendations.push({
        type: 'reliability',
        priority: 'medium',
        message: 'Investigar erros recorrentes',
        details: 'Analisar logs de erro e implementar tratamento'
      });
    }
    
    return recommendations;
  }
}

// =====================================================
// INSTÂNCIA GLOBAL DO MONITOR
// =====================================================

const performanceMonitor = new PerformanceMonitor();

// =====================================================
// FUNÇÕES DE CONTROLE
// =====================================================

/**
 * Iniciar monitoramento de performance
 */
async function startPerformanceMonitoring() {
  return await performanceMonitor.startMonitoring();
}

/**
 * Parar monitoramento de performance
 */
function stopPerformanceMonitoring() {
  performanceMonitor.stopMonitoring();
}

/**
 * Obter estatísticas atuais
 */
function getCurrentStats() {
  return performanceMonitor.getPerformanceStats();
}

/**
 * Gerar relatório de performance
 */
async function generateReport() {
  return await performanceMonitor.generatePerformanceReport();
}

/**
 * Teste de performance manual
 */
async function runPerformanceTest() {
  try {
    console.log('🧪 [TEST] Executando teste de performance...');
    
    const startTime = Date.now();
    
    // Teste de conexão
    const connectionTest = await performanceMonitor.measureConnectionTime();
    
    // Teste de query
    const queryTest = await performanceMonitor.measureQueryTime();
    
    // Teste de recursos
    const resourceTest = await performanceMonitor.getResourceUsage();
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    const results = {
      success: true,
      totalTime,
      connectionTest,
      queryTest,
      resourceTest,
      timestamp: new Date().toISOString()
    };
    
    console.log(`✅ [TEST] Teste concluído em ${totalTime}ms`);
    console.log(`🔗 [TEST] Conexão: ${connectionTest.duration}ms`);
    console.log(`📊 [TEST] Query: ${queryTest.duration}ms`);
    
    return results;
    
  } catch (error) {
    console.error('❌ [TEST] Erro no teste de performance:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  // Configuração
  MONITORING_CONFIG,
  
  // Instância do monitor
  performanceMonitor,
  
  // Funções de controle
  startPerformanceMonitoring,
  stopPerformanceMonitoring,
  getCurrentStats,
  generateReport,
  runPerformanceTest
};
