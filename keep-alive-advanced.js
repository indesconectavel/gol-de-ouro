#!/usr/bin/env node

/**
 * KEEP-ALIVE AVANÇADO - Gol de Ouro Backend
 * 
 * Versão melhorada com configurações por ambiente,
 * logs estruturados e melhor tratamento de erros.
 * 
 * Uso: 
 *   node keep-alive-advanced.js [environment]
 *   npm run keep-alive:local
 *   npm run keep-alive:prod
 */

const https = require('https');
const http = require('http');
const { getConfig, validateConfig } = require('./keep-alive-config');

// Obter ambiente da linha de comando ou variável de ambiente
const environment = process.argv[2] || process.env.NODE_ENV || 'production';
const config = getConfig(environment);

// Validar configuração
try {
  validateConfig(config);
} catch (error) {
  console.error('❌ Erro na configuração:', error.message);
  process.exit(1);
}

// Contadores para estatísticas
let stats = {
  totalPings: 0,
  successfulPings: 0,
  failedPings: 0,
  startTime: new Date(),
  lastPing: null,
  lastError: null,
  consecutiveFailures: 0,
  environment: environment
};

/**
 * Função de log estruturado
 */
function log(level, message, data = {}) {
  const timestamp = new Date().toISOString();
  const logLevel = config.logLevel || 'info';
  
  // Níveis de log: debug, info, warn, error
  const levels = { debug: 0, info: 1, warn: 2, error: 3 };
  
  if (levels[level] >= levels[logLevel]) {
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      environment: stats.environment,
      ...data
    };
    
    console.log(JSON.stringify(logEntry));
  }
}

/**
 * Função para fazer ping no backend
 */
async function pingBackend() {
  const startTime = Date.now();
  stats.totalPings++;
  
  log('info', 'Iniciando ping no backend', {
    attempt: stats.totalPings,
    url: config.backendUrl
  });
  
  try {
    const response = await makeRequest(`${config.backendUrl}/api/health`);
    const duration = Date.now() - startTime;
    
    if (response.status === 200) {
      stats.successfulPings++;
      stats.lastPing = new Date();
      stats.lastError = null;
      stats.consecutiveFailures = 0;
      
      log('info', 'Ping bem-sucedido', {
        duration: `${duration}ms`,
        status: response.data.status,
        uptime: response.data.uptime,
        memory: response.data.memory,
        successRate: Math.round((stats.successfulPings / stats.totalPings) * 100)
      });
      
    } else {
      throw new Error(`Status HTTP ${response.status}: ${response.statusText}`);
    }
    
  } catch (error) {
    stats.failedPings++;
    stats.consecutiveFailures++;
    stats.lastError = error.message;
    
    log('error', 'Erro no ping', {
      error: error.message,
      consecutiveFailures: stats.consecutiveFailures,
      totalFailures: stats.failedPings
    });
    
    // Tentar novamente se não excedeu o limite
    if (stats.consecutiveFailures <= config.maxRetries) {
      log('info', 'Agendando nova tentativa', {
        retryIn: `${config.retryDelay / 1000}s`,
        attempt: `${stats.consecutiveFailures}/${config.maxRetries}`
      });
      
      setTimeout(pingBackend, config.retryDelay);
    } else {
      log('warn', 'Máximo de tentativas excedido', {
        nextPingIn: `${config.pingInterval / 1000 / 60}min`
      });
      
      // Reset contador para próxima tentativa
      stats.consecutiveFailures = 0;
    }
  }
}

/**
 * Função para fazer requisição HTTP/HTTPS
 */
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    const options = {
      timeout: config.requestTimeout,
      headers: {
        'User-Agent': 'GolDeOuro-KeepAlive/2.0.0',
        'Accept': 'application/json',
        'Connection': 'keep-alive'
      }
    };
    
    const req = client.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            statusText: res.statusMessage,
            data: jsonData
          });
        } catch (parseError) {
          resolve({
            status: res.statusCode,
            statusText: res.statusMessage,
            data: { message: data }
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timeout após ${config.requestTimeout}ms`));
    });
    
    req.end();
  });
}

/**
 * Função para exibir estatísticas detalhadas
 */
function showStats() {
  const uptime = Math.round((Date.now() - stats.startTime.getTime()) / 1000);
  const successRate = stats.totalPings > 0 ? Math.round((stats.successfulPings / stats.totalPings) * 100) : 0;
  
  const statsData = {
    uptime: `${Math.floor(uptime / 60)}min ${uptime % 60}s`,
    totalPings: stats.totalPings,
    successfulPings: stats.successfulPings,
    failedPings: stats.failedPings,
    successRate: `${successRate}%`,
    lastPing: stats.lastPing ? stats.lastPing.toISOString() : 'Nunca',
    consecutiveFailures: stats.consecutiveFailures,
    environment: stats.environment
  };
  
  log('info', 'Estatísticas do keep-alive', statsData);
}

/**
 * Função para verificar saúde do sistema
 */
function healthCheck() {
  const memUsage = process.memoryUsage();
  const uptime = process.uptime();
  
  log('debug', 'Health check do keep-alive', {
    memory: {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024)
    },
    uptime: Math.round(uptime),
    stats: {
      totalPings: stats.totalPings,
      successRate: stats.totalPings > 0 ? Math.round((stats.successfulPings / stats.totalPings) * 100) : 0
    }
  });
}

/**
 * Função para limpar e sair
 */
function cleanup() {
  log('info', 'Encerrando keep-alive');
  showStats();
  log('info', 'Keep-alive encerrado');
  process.exit(0);
}

// Configurar handlers de sinal
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('uncaughtException', (error) => {
  log('error', 'Erro não capturado', { error: error.message, stack: error.stack });
  cleanup();
});

// Função principal
async function main() {
  log('info', 'Iniciando keep-alive avançado', {
    environment: stats.environment,
    backendUrl: config.backendUrl,
    pingInterval: `${config.pingInterval / 1000 / 60}min`,
    requestTimeout: `${config.requestTimeout / 1000}s`,
    maxRetries: config.maxRetries
  });
  
  // Fazer primeiro ping imediatamente
  await pingBackend();
  
  // Configurar ping periódico
  setInterval(pingBackend, config.pingInterval);
  
  // Exibir estatísticas a cada 30 minutos
  setInterval(showStats, 30 * 60 * 1000);
  
  // Health check a cada 5 minutos
  setInterval(healthCheck, 5 * 60 * 1000);
  
  log('info', 'Keep-alive iniciado com sucesso');
}

// Iniciar o keep-alive
main().catch((error) => {
  log('error', 'Erro ao iniciar keep-alive', { error: error.message });
  process.exit(1);
});
