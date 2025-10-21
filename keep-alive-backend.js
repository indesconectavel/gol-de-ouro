// 🔄 KEEP-ALIVE BACKEND - EVITAR PAUSA DO SUPABASE
// Data: 16 de Outubro de 2025
// Objetivo: Manter backend ativo para evitar pausa por inatividade

const https = require('https');

const keepAlive = () => {
  const options = {
    hostname: 'goldeouro-backend.fly.dev',
    port: 443,
    path: '/health',
    method: 'GET',
    timeout: 10000
  };

  const req = https.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log(`✅ [KEEP-ALIVE] Backend OK: ${res.statusCode} - ${response.message || 'OK'} - ${new Date().toISOString()}`);
      } catch (e) {
        console.log(`✅ [KEEP-ALIVE] Backend OK: ${res.statusCode} - ${new Date().toISOString()}`);
      }
    });
  });

  req.on('error', (e) => {
    console.error(`❌ [KEEP-ALIVE] Backend Error: ${e.message} - ${new Date().toISOString()}`);
  });

  req.on('timeout', () => {
    console.error(`⏰ [KEEP-ALIVE] Backend Timeout - ${new Date().toISOString()}`);
    req.destroy();
  });

  req.setTimeout(10000);
  req.end();
};

// Executar a cada 5 minutos (300000ms)
const interval = setInterval(keepAlive, 5 * 60 * 1000);

// Executar imediatamente
console.log('🔄 [KEEP-ALIVE] Iniciando keep-alive do backend...');
keepAlive();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 [KEEP-ALIVE] Parando keep-alive...');
  clearInterval(interval);
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 [KEEP-ALIVE] Parando keep-alive...');
  clearInterval(interval);
  process.exit(0);
});

console.log('✅ [KEEP-ALIVE] Keep-alive ativo - Backend será mantido ativo a cada 5 minutos');
