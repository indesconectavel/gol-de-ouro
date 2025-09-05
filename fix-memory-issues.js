// Script para corrigir problemas de memória no backend
const fs = require('fs');
const path = require('path');

console.log('🔧 CORRIGINDO PROBLEMAS DE MEMÓRIA');
console.log('==================================');

// 1. Otimizar server.js para melhor gestão de memória
const serverOptimizations = `
// Otimizações de memória para server.js
const v8 = require('v8');

// Configurar garbage collection automático
if (global.gc) {
  setInterval(() => {
    if (process.memoryUsage().heapUsed > 100 * 1024 * 1024) { // 100MB
      global.gc();
      console.log('🧹 Garbage collection executado');
    }
  }, 30000); // A cada 30 segundos
}

// Monitor de memória
setInterval(() => {
  const memUsage = process.memoryUsage();
  const memPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  
  if (memPercent > 80) {
    console.log('⚠️ ALERTA: Uso de memória alto:', memPercent.toFixed(2) + '%');
    
    // Forçar garbage collection se disponível
    if (global.gc) {
      global.gc();
      console.log('🧹 Garbage collection forçado');
    }
  }
}, 10000); // A cada 10 segundos

// Limitar tamanho do heap
v8.setFlagsFromString('--max-old-space-size=512');

// Otimizar conexões de banco
process.on('SIGTERM', () => {
  console.log('🔄 Fechando conexões...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🔄 Fechando conexões...');
  process.exit(0);
});
`;

// 2. Criar middleware de limpeza de memória
const memoryMiddleware = `
// Middleware de limpeza de memória
const memoryCleanup = (req, res, next) => {
  // Limpar dados desnecessários da requisição
  if (req.body && req.body.length > 10000) {
    req.body = req.body.substring(0, 10000) + '...';
  }
  
  // Limpar headers desnecessários
  delete req.headers['x-forwarded-for'];
  delete req.headers['x-real-ip'];
  
  next();
};

module.exports = memoryCleanup;
`;

// 3. Otimizar conexões de banco
const dbOptimizations = `
// Otimizações de banco de dados
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5, // Reduzir conexões simultâneas
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  maxUses: 7500, // Reciclar conexões
  allowExitOnIdle: true
});

// Limpar conexões inativas
setInterval(() => {
  pool.totalCount && pool.totalCount > 0 && pool.end();
}, 300000); // A cada 5 minutos
`;

// 4. Criar script de monitoramento
const memoryMonitor = `
// Monitor de memória em tempo real
const os = require('os');

const monitorMemory = () => {
  const memUsage = process.memoryUsage();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  
  const memPercent = (usedMem / totalMem) * 100;
  const heapPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  
  console.log('📊 MEMÓRIA:', {
    sistema: memPercent.toFixed(2) + '%',
    heap: heapPercent.toFixed(2) + '%',
    rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB',
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB'
  });
  
  if (heapPercent > 85) {
    console.log('🚨 ALERTA CRÍTICO: Heap usage > 85%');
    
    // Forçar garbage collection
    if (global.gc) {
      global.gc();
      console.log('🧹 Garbage collection executado');
    }
  }
};

// Monitorar a cada 30 segundos
setInterval(monitorMemory, 30000);

module.exports = { monitorMemory };
`;

// Aplicar otimizações
console.log('📝 Aplicando otimizações...');

// Salvar otimizações
fs.writeFileSync('memory-optimizations.js', serverOptimizations);
fs.writeFileSync('middlewares/memoryCleanup.js', memoryMiddleware);
fs.writeFileSync('utils/memoryMonitor.js', memoryMonitor);
fs.writeFileSync('database/optimizations.js', dbOptimizations);

console.log('✅ Otimizações aplicadas!');
console.log('📋 Próximos passos:');
console.log('1. Reiniciar o servidor no Render');
console.log('2. Monitorar logs de memória');
console.log('3. Verificar se os alertas diminuíram');
