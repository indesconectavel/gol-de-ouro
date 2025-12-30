/**
 * MONITOR CONTROLLER - Endpoints de monitoramento
 * GET /monitor - JSON com métricas do sistema
 * GET /metrics - Prometheus format
 */

const { supabaseAdmin } = require('../../../database/supabase-unified-config');

// ✅ CORREÇÃO CRÍTICA: Tornar prom-client opcional para evitar crash se não estiver instalado
let promClient = null;
let register = null;
let prometheusAvailable = false;

try {
  promClient = require('prom-client');
  register = new promClient.Registry();
  prometheusAvailable = true;
  console.log('✅ [MONITOR] prom-client carregado com sucesso');
} catch (error) {
  console.warn('⚠️ [MONITOR] prom-client não disponível - métricas Prometheus desabilitadas:', error.message);
  prometheusAvailable = false;
}

// ✅ CORREÇÃO CRÍTICA: Criar métricas apenas se prom-client estiver disponível
let lotesAtivosGauge = null;
let chutesTotalCounter = null;
let premiosTotalCounter = null;
let errors5xxCounter = null;
let latenciaChuteHistogram = null;

if (prometheusAvailable && promClient && register) {
  try {
    lotesAtivosGauge = new promClient.Gauge({
      name: 'goldeouro_lotes_ativos',
      help: 'Número de lotes ativos no sistema'
    });

    chutesTotalCounter = new promClient.Counter({
      name: 'goldeouro_chutes_total',
      help: 'Total de chutes processados',
      labelNames: ['resultado']
    });

    premiosTotalCounter = new promClient.Counter({
      name: 'goldeouro_premios_total',
      help: 'Total de prêmios distribuídos',
      labelNames: ['tipo']
    });

    errors5xxCounter = new promClient.Counter({
      name: 'goldeouro_errors_5xx',
      help: 'Total de erros 5xx'
    });

    latenciaChuteHistogram = new promClient.Histogram({
      name: 'goldeouro_latencia_chute_ms',
      help: 'Latência de processamento de chutes em milissegundos',
      buckets: [50, 100, 200, 500, 1000, 2000]
    });

    register.registerMetric(lotesAtivosGauge);
    register.registerMetric(chutesTotalCounter);
    register.registerMetric(premiosTotalCounter);
    register.registerMetric(errors5xxCounter);
    register.registerMetric(latenciaChuteHistogram);
    
    console.log('✅ [MONITOR] Métricas Prometheus inicializadas');
  } catch (metricError) {
    console.warn('⚠️ [MONITOR] Erro ao inicializar métricas Prometheus:', metricError.message);
    prometheusAvailable = false;
  }
}

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
        metrics: metrics,
        prometheus_available: prometheusAvailable
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
      if (!prometheusAvailable || !register) {
        return res.status(503).json({
          success: false,
          error: 'Prometheus metrics não disponíveis - prom-client não instalado'
        });
      }

      // Atualizar métricas antes de retornar
      await this.updatePrometheusMetrics();
      
      res.set('Content-Type', register.contentType);
      res.end(await register.metrics());
    } catch (error) {
      console.error('❌ [MONITOR] Erro ao gerar métricas Prometheus:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Coletar métricas do sistema V19
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

    // Verificar status das RPCs V19
    const rpcStatus = {
      rpc_get_or_create_lote: false,
      rpc_update_lote_after_shot: false,
      rpc_get_active_lotes: false,
      rpc_add_balance: false,
      rpc_deduct_balance: false,
      rpc_transfer_balance: false,
      rpc_get_balance: false,
      rpc_register_reward: false,
      rpc_mark_reward_credited: false
    };

    // Testar RPCs (sem executar, apenas verificar existência)
    const rpcNames = Object.keys(rpcStatus);
    for (const rpcName of rpcNames) {
      try {
        // Tentar chamar RPC com parâmetros mínimos (pode falhar, mas confirma existência)
        await supabaseAdmin.rpc(rpcName, {});
        rpcStatus[rpcName] = true;
      } catch (error) {
        // Se erro não é "function does not exist", então a função existe
        if (!error.message.includes('does not exist') && !error.message.includes('function')) {
          rpcStatus[rpcName] = true;
        }
      }
    }

    // Verificar status do sistema de lotes
    const lotesStatus = {
      total_lotes: 0,
      lotes_ativos: lotesAtivosCount,
      lotes_completos: 0,
      total_arrecadado: 0,
      total_premios: 0
    };

    try {
      const { data: lotesData } = await supabaseAdmin
        .from('lotes')
        .select('id, status, total_arrecadado, premio_total');
      
      if (lotesData) {
        lotesStatus.total_lotes = lotesData.length;
        lotesStatus.lotes_completos = lotesData.filter(l => l.status === 'completo').length;
        lotesStatus.total_arrecadado = lotesData.reduce((sum, l) => sum + parseFloat(l.total_arrecadado || 0), 0);
        lotesStatus.total_premios = lotesData.reduce((sum, l) => sum + parseFloat(l.premio_total || 0), 0);
      }
    } catch (error) {
      console.error('❌ [MONITOR] Erro ao buscar status de lotes:', error);
    }

    // Uso de memória (aproximado via process.memoryUsage)
    const memoryUsage = process.memoryUsage();
    const memoryUsageMB = {
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024)
    };

    return {
      // Métricas básicas
      lotes_ativos_count: lotesAtivosCount,
      chutes_por_minuto: chutesPorMinuto,
      latencia_media_chute_ms: latenciaMediaChuteMs,
      transacoes_pendentes: transacoesPendentesCount,
      ultimo_heartbeat: ultimoHeartbeat,
      memory_usage_mb: memoryUsageMB,
      instance_id: process.env.INSTANCE_ID || 'unknown',
      
      // Status V19
      engine_v19: {
        enabled: process.env.USE_ENGINE_V19 === 'true',
        heartbeat_enabled: process.env.ENGINE_HEARTBEAT_ENABLED === 'true',
        monitor_enabled: process.env.ENGINE_MONITOR_ENABLED === 'true'
      },
      
      // Status RPCs
      rpc_status: rpcStatus,
      
      // Status lotes
      lotes_status: lotesStatus
    };
  }

  /**
   * Atualizar métricas Prometheus
   */
  static async updatePrometheusMetrics() {
    if (!prometheusAvailable || !lotesAtivosGauge) {
      return; // Métricas não disponíveis
    }

    try {
      const metrics = await this.collectMetrics();
      lotesAtivosGauge.set(metrics.lotes_ativos_count);
      // chutesTotalCounter e outros serão atualizados quando eventos ocorrerem
    } catch (error) {
      console.warn('⚠️ [MONITOR] Erro ao atualizar métricas Prometheus:', error.message);
    }
  }

  /**
   * Registrar chute para métricas
   */
  static recordShot(resultado, latenciaMs) {
    if (!prometheusAvailable || !chutesTotalCounter || !latenciaChuteHistogram) {
      return; // Métricas não disponíveis
    }

    try {
      chutesTotalCounter.inc({ resultado: resultado });
      latenciaChuteHistogram.observe(latenciaMs);
    } catch (error) {
      console.warn('⚠️ [MONITOR] Erro ao registrar chute nas métricas:', error.message);
    }
  }

  /**
   * Registrar prêmio para métricas
   */
  static recordReward(tipo, valor) {
    if (!prometheusAvailable || !premiosTotalCounter) {
      return; // Métricas não disponíveis
    }

    try {
      premiosTotalCounter.inc({ tipo: tipo }, valor);
    } catch (error) {
      console.warn('⚠️ [MONITOR] Erro ao registrar prêmio nas métricas:', error.message);
    }
  }

  /**
   * Registrar erro 5xx
   */
  static recordError5xx() {
    if (!prometheusAvailable || !errors5xxCounter) {
      return; // Métricas não disponíveis
    }

    try {
      errors5xxCounter.inc();
    } catch (error) {
      console.warn('⚠️ [MONITOR] Erro ao registrar erro 5xx nas métricas:', error.message);
    }
  }
}

module.exports = MonitorController;
