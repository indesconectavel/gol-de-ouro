/**
 * Sistema de Métricas com Prometheus
 * ETAPA 5 - Analytics e Monitoramento
 */

const client = require('prom-client');

// Configurar registro de métricas
const register = new client.Registry();

// Adicionar métricas padrão do Node.js
client.collectDefaultMetrics({ register });

// ===== MÉTRICAS DE NEGÓCIO =====

// Contador de jogos criados
const gamesCreatedTotal = new client.Counter({
  name: 'goldeouro_games_created_total',
  help: 'Total de jogos criados',
  labelNames: ['game_type', 'status'],
  registers: [register]
});

// Contador de apostas realizadas
const betsPlacedTotal = new client.Counter({
  name: 'goldeouro_bets_placed_total',
  help: 'Total de apostas realizadas',
  labelNames: ['bet_type', 'result'],
  registers: [register]
});

// Contador de usuários ativos
const activeUsersTotal = new client.Gauge({
  name: 'goldeouro_active_users_total',
  help: 'Número de usuários ativos no sistema',
  labelNames: ['user_type'],
  registers: [register]
});

// Contador de conexões WebSocket
const websocketConnectionsTotal = new client.Gauge({
  name: 'goldeouro_websocket_connections_total',
  help: 'Número de conexões WebSocket ativas',
  registers: [register]
});

// Histograma de duração de jogos
const gameDurationSeconds = new client.Histogram({
  name: 'goldeouro_game_duration_seconds',
  help: 'Duração dos jogos em segundos',
  labelNames: ['game_type', 'result'],
  buckets: [30, 60, 120, 300, 600, 1200, 1800, 3600], // 30s até 1h
  registers: [register]
});

// ===== MÉTRICAS DE PERFORMANCE =====

// Histograma de tempo de resposta HTTP
const httpRequestDurationSeconds = new client.Histogram({
  name: 'goldeouro_http_request_duration_seconds',
  help: 'Duração das requisições HTTP em segundos',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
  registers: [register]
});

// Contador de requisições HTTP
const httpRequestsTotal = new client.Counter({
  name: 'goldeouro_http_requests_total',
  help: 'Total de requisições HTTP',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

// Histograma de tempo de consultas ao banco
const databaseQueryDurationSeconds = new client.Histogram({
  name: 'goldeouro_database_query_duration_seconds',
  help: 'Duração das consultas ao banco de dados em segundos',
  labelNames: ['query_type', 'table'],
  buckets: [0.01, 0.05, 0.1, 0.2, 0.5, 1, 2, 5],
  registers: [register]
});

// ===== MÉTRICAS DE SISTEMA =====

// Gauge de uso de memória
const memoryUsageBytes = new client.Gauge({
  name: 'goldeouro_memory_usage_bytes',
  help: 'Uso de memória em bytes',
  labelNames: ['type'],
  registers: [register]
});

// Gauge de uso de CPU
const cpuUsagePercent = new client.Gauge({
  name: 'goldeouro_cpu_usage_percent',
  help: 'Uso de CPU em percentual',
  registers: [register]
});

// Contador de erros
const errorsTotal = new client.Counter({
  name: 'goldeouro_errors_total',
  help: 'Total de erros no sistema',
  labelNames: ['error_type', 'component'],
  registers: [register]
});

// ===== MÉTRICAS DE PAGAMENTOS =====

// Contador de pagamentos processados
const paymentsProcessedTotal = new client.Counter({
  name: 'goldeouro_payments_processed_total',
  help: 'Total de pagamentos processados',
  labelNames: ['payment_method', 'status'],
  registers: [register]
});

// Histograma de valores de pagamento
const paymentAmountHistogram = new client.Histogram({
  name: 'goldeouro_payment_amount_histogram',
  help: 'Distribuição dos valores de pagamento',
  labelNames: ['payment_method'],
  buckets: [10, 25, 50, 100, 250, 500, 1000, 2500, 5000],
  registers: [register]
});

// ===== FUNÇÕES UTILITÁRIAS =====

// Atualizar métricas de sistema
const updateSystemMetrics = () => {
  const memUsage = process.memoryUsage();
  
  memoryUsageBytes.set({ type: 'rss' }, memUsage.rss);
  memoryUsageBytes.set({ type: 'heapTotal' }, memUsage.heapTotal);
  memoryUsageBytes.set({ type: 'heapUsed' }, memUsage.heapUsed);
  memoryUsageBytes.set({ type: 'external' }, memUsage.external);
};

// Middleware para métricas HTTP
const httpMetricsMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;
    
    httpRequestDurationSeconds
      .labels(req.method, route, res.statusCode)
      .observe(duration);
    
    httpRequestsTotal
      .labels(req.method, route, res.statusCode)
      .inc();
  });
  
  next();
};

// Função para registrar métricas de banco de dados
const recordDatabaseQuery = (queryType, table, duration) => {
  databaseQueryDurationSeconds
    .labels(queryType, table)
    .observe(duration);
};

// Função para registrar métricas de negócio
const recordBusinessMetric = (type, data) => {
  switch (type) {
    case 'game_created':
      gamesCreatedTotal
        .labels(data.gameType || 'standard', data.status || 'created')
        .inc();
      break;
      
    case 'bet_placed':
      betsPlacedTotal
        .labels(data.betType || 'standard', data.result || 'pending')
        .inc();
      break;
      
    case 'payment_processed':
      paymentsProcessedTotal
        .labels(data.paymentMethod || 'unknown', data.status || 'pending')
        .inc();
      
      if (data.amount) {
        paymentAmountHistogram
          .labels(data.paymentMethod || 'unknown')
          .observe(data.amount);
      }
      break;
      
    case 'error':
      errorsTotal
        .labels(data.errorType || 'unknown', data.component || 'unknown')
        .inc();
      break;
  }
};

// Função para atualizar métricas de usuários ativos
const updateActiveUsers = (count, userType = 'regular') => {
  activeUsersTotal.set({ user_type: userType }, count);
};

// Função para atualizar métricas de WebSocket
const updateWebSocketConnections = (count) => {
  websocketConnectionsTotal.set(count);
};

// Função para registrar duração de jogo
const recordGameDuration = (gameType, result, duration) => {
  gameDurationSeconds
    .labels(gameType, result)
    .observe(duration);
};

// Inicializar atualização periódica de métricas do sistema
const startSystemMetricsCollection = () => {
  setInterval(updateSystemMetrics, 5000); // A cada 5 segundos
};

// Endpoint para métricas do Prometheus
const getMetrics = async () => {
  return register.metrics();
};

module.exports = {
  register,
  httpMetricsMiddleware,
  recordDatabaseQuery,
  recordBusinessMetric,
  updateActiveUsers,
  updateWebSocketConnections,
  recordGameDuration,
  startSystemMetricsCollection,
  getMetrics,
  
  // Exportar métricas individuais para uso direto
  gamesCreatedTotal,
  betsPlacedTotal,
  activeUsersTotal,
  websocketConnectionsTotal,
  gameDurationSeconds,
  httpRequestDurationSeconds,
  httpRequestsTotal,
  databaseQueryDurationSeconds,
  memoryUsageBytes,
  cpuUsagePercent,
  errorsTotal,
  paymentsProcessedTotal,
  paymentAmountHistogram
};
