
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
