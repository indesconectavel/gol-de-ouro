#!/usr/bin/env node

/**
 * KEEP-ALIVE SCRIPT - Gol de Ouro Backend
 * 
 * Este script faz ping automático no backend a cada 5 minutos
 * para evitar que o serviço no Render entre em modo sleep.
 * 
 * Uso: node keep-alive.js
 * ou: npm run keep-alive
 */

const https = require('https');
const http = require('http');

// Configurações
const CONFIG = {
  // URL do backend (pode ser local ou produção)
  BACKEND_URL: process.env.BACKEND_URL || 'https://goldeouro-backend.onrender.com',
  // Intervalo entre pings (5 minutos)
  PING_INTERVAL: 5 * 60 * 1000, // 5 minutos em ms
  // Timeout para cada requisição (30 segundos)
  REQUEST_TIMEOUT: 30 * 1000,
  // Número máximo de tentativas em caso de erro
  MAX_RETRIES: 3,
  // Delay entre tentativas (30 segundos)
  RETRY_DELAY: 30 * 1000
};

// Contadores para estatísticas
let stats = {
  totalPings: 0,
  successfulPings: 0,
  failedPings: 0,
  startTime: new Date(),
  lastPing: null,
  lastError: null
};

/**
 * Função para fazer ping no backend
 */
async function pingBackend() {
  const startTime = Date.now();
  stats.totalPings++;
  
  console.log(`\n🔍 [${new Date().toISOString()}] Fazendo ping no backend...`);
  console.log(`📊 Estatísticas: ${stats.successfulPings}/${stats.totalPings} sucessos`);
  
  try {
    const response = await makeRequest(`${CONFIG.BACKEND_URL}/api/health`);
    const duration = Date.now() - startTime;
    
    if (response.status === 200) {
      stats.successfulPings++;
      stats.lastPing = new Date();
      stats.lastError = null;
      
      console.log(`✅ Ping bem-sucedido! (${duration}ms)`);
      console.log(`📊 Status: ${response.data.status}`);
      console.log(`⏱️  Uptime: ${response.data.uptime}s`);
      console.log(`💾 Memória: ${response.data.memory.rss}MB RSS, ${response.data.memory.heapPercent}% heap`);
      
    } else {
      throw new Error(`Status HTTP ${response.status}: ${response.statusText}`);
    }
    
  } catch (error) {
    stats.failedPings++;
    stats.lastError = error.message;
    
    console.log(`❌ Erro no ping: ${error.message}`);
    
    // Tentar novamente se não excedeu o limite
    if (stats.failedPings <= CONFIG.MAX_RETRIES) {
      console.log(`🔄 Tentando novamente em ${CONFIG.RETRY_DELAY / 1000}s...`);
      setTimeout(pingBackend, CONFIG.RETRY_DELAY);
    } else {
      console.log(`🚨 Máximo de tentativas excedido. Próximo ping em ${CONFIG.PING_INTERVAL / 1000 / 60}min.`);
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
      timeout: CONFIG.REQUEST_TIMEOUT,
      headers: {
        'User-Agent': 'GolDeOuro-KeepAlive/1.0.0',
        'Accept': 'application/json'
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
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

/**
 * Função para exibir estatísticas
 */
function showStats() {
  const uptime = Math.round((Date.now() - stats.startTime.getTime()) / 1000);
  const successRate = stats.totalPings > 0 ? Math.round((stats.successfulPings / stats.totalPings) * 100) : 0;
  
  console.log('\n📊 === ESTATÍSTICAS DO KEEP-ALIVE ===');
  console.log(`⏱️  Tempo ativo: ${Math.floor(uptime / 60)}min ${uptime % 60}s`);
  console.log(`📈 Total de pings: ${stats.totalPings}`);
  console.log(`✅ Sucessos: ${stats.successfulPings}`);
  console.log(`❌ Falhas: ${stats.failedPings}`);
  console.log(`📊 Taxa de sucesso: ${successRate}%`);
  console.log(`🕐 Último ping: ${stats.lastPing ? stats.lastPing.toISOString() : 'Nunca'}`);
  if (stats.lastError) {
    console.log(`⚠️  Último erro: ${stats.lastError}`);
  }
  console.log('=====================================\n');
}

/**
 * Função para limpar e sair
 */
function cleanup() {
  console.log('\n🔄 Encerrando keep-alive...');
  showStats();
  console.log('👋 Keep-alive encerrado.');
  process.exit(0);
}

// Configurar handlers de sinal
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('uncaughtException', (error) => {
  console.error('💥 Erro não capturado:', error);
  cleanup();
});

// Função principal
async function main() {
  console.log('🚀 INICIANDO KEEP-ALIVE - GOL DE OURO BACKEND');
  console.log('==============================================');
  console.log(`🌐 Backend URL: ${CONFIG.BACKEND_URL}`);
  console.log(`⏰ Intervalo: ${CONFIG.PING_INTERVAL / 1000 / 60} minutos`);
  console.log(`⏱️  Timeout: ${CONFIG.REQUEST_TIMEOUT / 1000} segundos`);
  console.log(`🔄 Máximo de tentativas: ${CONFIG.MAX_RETRIES}`);
  console.log('==============================================\n');
  
  // Fazer primeiro ping imediatamente
  await pingBackend();
  
  // Configurar ping periódico
  setInterval(pingBackend, CONFIG.PING_INTERVAL);
  
  // Exibir estatísticas a cada 30 minutos
  setInterval(showStats, 30 * 60 * 1000);
  
  console.log('✅ Keep-alive iniciado com sucesso!');
  console.log('💡 Pressione Ctrl+C para encerrar.\n');
}

// Iniciar o keep-alive
main().catch((error) => {
  console.error('💥 Erro ao iniciar keep-alive:', error);
  process.exit(1);
});
