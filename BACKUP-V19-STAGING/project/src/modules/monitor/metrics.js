/**
 * METRICS - Coleta e expõe métricas do sistema
 * Integração com Prometheus via prom-client
 */

const promClient = require('prom-client');

// Criar registry customizado
const register = new promClient.Registry();

// Coletar métricas padrão do Node.js
promClient.collectDefaultMetrics({ register });

// Métricas customizadas
const lotesAtivosGauge = new promClient.Gauge({
  name: 'goldeouro_lotes_ativos',
  help: 'Número de lotes ativos no sistema',
  registers: [register]
});

const chutesTotalCounter = new promClient.Counter({
  name: 'goldeouro_chutes_total',
  help: 'Total de chutes processados',
  labelNames: ['resultado', 'valor_aposta'],
  registers: [register]
});

const premiosTotalCounter = new promClient.Counter({
  name: 'goldeouro_premios_total',
  help: 'Total de prêmios distribuídos em reais',
  labelNames: ['tipo'],
  registers: [register]
});

const errors5xxCounter = new promClient.Counter({
  name: 'goldeouro_errors_5xx',
  help: 'Total de erros HTTP 5xx',
  registers: [register]
});

const latenciaChuteHistogram = new promClient.Histogram({
  name: 'goldeouro_latencia_chute_ms',
  help: 'Latência de processamento de chutes em milissegundos',
  buckets: [50, 100, 200, 500, 1000, 2000],
  registers: [register]
});

const transacoesCounter = new promClient.Counter({
  name: 'goldeouro_transacoes_total',
  help: 'Total de transações financeiras',
  labelNames: ['tipo', 'status'],
  registers: [register]
});

// Funções para atualizar métricas
function updateLotesAtivos(count) {
  lotesAtivosGauge.set(count);
}

function recordShot(resultado, valorAposta, latenciaMs) {
  chutesTotalCounter.inc({ resultado, valor_aposta: valorAposta.toString() });
  latenciaChuteHistogram.observe(latenciaMs);
}

function recordReward(tipo, valor) {
  premiosTotalCounter.inc({ tipo }, valor);
}

function recordError5xx() {
  errors5xxCounter.inc();
}

function recordTransaction(tipo, status) {
  transacoesCounter.inc({ tipo, status });
}

// Obter métricas em formato Prometheus
async function getMetrics() {
  return await register.metrics();
}

module.exports = {
  register,
  updateLotesAtivos,
  recordShot,
  recordReward,
  recordError5xx,
  recordTransaction,
  getMetrics
};

