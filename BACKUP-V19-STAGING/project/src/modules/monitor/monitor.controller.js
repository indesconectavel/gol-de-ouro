/**
 * MONITOR CONTROLLER - Endpoints de monitoramento
 * GET /monitor - JSON com métricas do sistema
 * GET /metrics - Prometheus format
 */

const { supabaseAdmin } = require('../../../database/supabase-config');
const promClient = require('prom-client');

// Registrar métricas Prometheus
const register = new promClient.Registry();

const lotesAtivosGauge = new promClient.Gauge({
  name: 'goldeouro_lotes_ativos',
  help: 'Número de lotes ativos no sistema'
});

const chutesTotalCounter = new promClient.Counter({
  name: 'goldeouro_chutes_total',
  help: 'Total de chutes processados',
  labelNames: ['resultado']
});

const premiosTotalCounter = new promClient.Counter({
  name: 'goldeouro_premios_total',
  help: 'Total de prêmios distribuídos',
  labelNames: ['tipo']
});

const errors5xxCounter = new promClient.Counter({
  name: 'goldeouro_errors_5xx',
  help: 'Total de erros 5xx'
});

const latenciaChuteHistogram = new promClient.Histogram({
  name: 'goldeouro_latencia_chute_ms',
  help: 'Latência de processamento de chutes em milissegundos',
  buckets: [50, 100, 200, 500, 1000, 2000]
});

register.registerMetric(lotesAtivosGauge);
register.registerMetric(chutesTotalCounter);
register.registerMetric(premiosTotalCounter);
register.registerMetric(errors5xxCounter);
register.registerMetric(latenciaChuteHistogram);

class MonitorController {
  /**
   * GET /monitor - Retorna JSON com métricas do sistema
   */
  static async getMonitor(req, res) {
    try {
      const metrics = await this.collectMetrics();
      
      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        metrics: metrics
      });
    } catch (error) {
      console.error('❌ [MONITOR] Erro ao coletar métricas:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /metrics - Retorna métricas no formato Prometheus
   */
  static async getMetrics(req, res) {
    try {
      // Atualizar métricas antes de retornar
      await this.updatePrometheusMetrics();
      
      res.set('Content-Type', register.contentType);
      res.end(await register.metrics());
    } catch (error) {
      console.error('❌ [MONITOR] Erro ao gerar métricas Prometheus:', error);
      res.status(500).end();
    }
  }

  /**
   * Coletar métricas do sistema
   */
  static async collectMetrics() {
    // Contar lotes ativos
    const { data: lotes, error: lotesError } = await supabaseAdmin
      .from('lotes')
      .select('id', { count: 'exact' })
      .eq('status', 'ativo');

    const lotesAtivosCount = lotesError ? 0 : (lotes?.length || 0);

    // Contar chutes dos últimos 5 minutos
    const cincoMinutosAtras = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: chutesRecentes, error: chutesError } = await supabaseAdmin
      .from('chutes')
      .select('id', { count: 'exact' })
      .gte('created_at', cincoMinutosAtras);

    const chutesPorMinuto = chutesError ? 0 : Math.round((chutesRecentes?.length || 0) / 5);

    // Calcular latência média da última hora
    const umaHoraAtras = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: chutesUltimaHora } = await supabaseAdmin
      .from('chutes')
      .select('created_at')
      .gte('created_at', umaHoraAtras)
      .order('created_at', { ascending: false })
      .limit(100);

    let latenciaMediaChuteMs = 0;
    if (chutesUltimaHora && chutesUltimaHora.length > 1) {
      // Calcular diferença média entre chutes consecutivos
      let totalDiff = 0;
      for (let i = 1; i < chutesUltimaHora.length; i++) {
        const diff = new Date(chutesUltimaHora[i-1].created_at) - new Date(chutesUltimaHora[i].created_at);
        totalDiff += diff;
      }
      latenciaMediaChuteMs = Math.round(totalDiff / (chutesUltimaHora.length - 1));
    }

    // Contar transações pendentes
    const { data: transacoesPendentes, error: transacoesError } = await supabaseAdmin
      .from('transacoes')
      .select('id', { count: 'exact' })
      .eq('status', 'pendente');

    const transacoesPendentesCount = transacoesError ? 0 : (transacoesPendentes?.length || 0);

    // Obter último heartbeat
    const { data: heartbeat, error: heartbeatError } = await supabaseAdmin
      .from('system_heartbeat')
      .select('*')
      .order('last_seen', { ascending: false })
      .limit(1)
      .single();

    const ultimoHeartbeat = heartbeatError ? null : heartbeat?.last_seen;

    // Uso de memória (aproximado via process.memoryUsage)
    const memoryUsage = process.memoryUsage();
    const memoryUsageMB = {
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024)
    };

    return {
      lotes_ativos_count: lotesAtivosCount,
      chutes_por_minuto: chutesPorMinuto,
      latencia_media_chute_ms: latenciaMediaChuteMs,
      transacoes_pendentes: transacoesPendentesCount,
      ultimo_heartbeat: ultimoHeartbeat,
      memory_usage_mb: memoryUsageMB,
      instance_id: process.env.INSTANCE_ID || 'unknown'
    };
  }

  /**
   * Atualizar métricas Prometheus
   */
  static async updatePrometheusMetrics() {
    const metrics = await this.collectMetrics();
    
    lotesAtivosGauge.set(metrics.lotes_ativos_count);
    // chutesTotalCounter e outros serão atualizados quando eventos ocorrerem
  }

  /**
   * Registrar chute para métricas
   */
  static recordShot(resultado, latenciaMs) {
    chutesTotalCounter.inc({ resultado: resultado });
    latenciaChuteHistogram.observe(latenciaMs);
  }

  /**
   * Registrar prêmio para métricas
   */
  static recordReward(tipo, valor) {
    premiosTotalCounter.inc({ tipo: tipo }, valor);
  }

  /**
   * Registrar erro 5xx
   */
  static recordError5xx() {
    errors5xxCounter.inc();
  }
}

module.exports = MonitorController;

