// Otimizador de memória avançado
const os = require('os');
const v8 = require('v8');

class MemoryOptimizer {
  constructor() {
    this.monitoring = false;
    this.cleanupInterval = null;
    this.gcInterval = null;
    this.thresholds = {
      warning: 80,
      critical: 90,
      emergency: 95
    };
  }

  startMonitoring() {
    if (this.monitoring) return;
    
    this.monitoring = true;
    console.log('🔍 Iniciando monitoramento de memória...');
    
    // Monitor principal a cada 10 segundos
    this.cleanupInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, 10000);
    
    // Garbage collection automático a cada 30 segundos
    this.gcInterval = setInterval(() => {
      this.performGarbageCollection();
    }, 30000);
  }

  stopMonitoring() {
    if (!this.monitoring) return;
    
    this.monitoring = false;
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    if (this.gcInterval) {
      clearInterval(this.gcInterval);
      this.gcInterval = null;
    }
    
    console.log('🛑 Monitoramento de memória parado');
  }

  checkMemoryUsage() {
    const memUsage = process.memoryUsage();
    const heapPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    const rssMB = Math.round(memUsage.rss / 1024 / 1024);
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    
    // Log detalhado a cada verificação
    console.log(`📊 Memória: ${heapPercent.toFixed(2)}% | RSS: ${rssMB}MB | Heap: ${heapUsedMB}/${heapTotalMB}MB`);
    
    if (heapPercent >= this.thresholds.emergency) {
      this.handleEmergencyCleanup(heapPercent);
    } else if (heapPercent >= this.thresholds.critical) {
      this.handleCriticalCleanup(heapPercent);
    } else if (heapPercent >= this.thresholds.warning) {
      this.handleWarningCleanup(heapPercent);
    }
  }

  handleWarningCleanup(heapPercent) {
    console.log(`⚠️ ALERTA: Uso de memória alto: ${heapPercent.toFixed(2)}%`);
    
    // Limpeza básica
    this.performGarbageCollection();
  }

  handleCriticalCleanup(heapPercent) {
    console.log(`🚨 CRÍTICO: Uso de memória crítico: ${heapPercent.toFixed(2)}%`);
    
    // Limpeza agressiva
    this.performGarbageCollection();
    this.clearCaches();
  }

  handleEmergencyCleanup(heapPercent) {
    console.log(`💥 EMERGÊNCIA: Uso de memória crítico: ${heapPercent.toFixed(2)}%`);
    
    // Limpeza de emergência
    this.performGarbageCollection();
    this.clearCaches();
    this.forceMemoryCleanup();
  }

  performGarbageCollection() {
    if (global.gc) {
      const beforeGC = process.memoryUsage();
      global.gc();
      const afterGC = process.memoryUsage();
      
      const freed = Math.round((beforeGC.heapUsed - afterGC.heapUsed) / 1024 / 1024);
      console.log(`🧹 Garbage collection executado - Liberados: ${freed}MB`);
    } else {
      console.log('⚠️ Garbage collection não disponível (execute com --expose-gc)');
    }
  }

  clearCaches() {
    // Limpar caches do Node.js
    if (global.gc) {
      global.gc();
    }
    
    // Forçar limpeza de buffers
    if (Buffer.poolSize > 0) {
      Buffer.poolSize = 0;
    }
    
    console.log('🧹 Caches limpos');
  }

  forceMemoryCleanup() {
    // Limpeza forçada de memória
    try {
      // Limpar require cache (cuidado!)
      const modulesToKeep = ['fs', 'path', 'os', 'v8', 'util'];
      Object.keys(require.cache).forEach(key => {
        if (!modulesToKeep.some(module => key.includes(module))) {
          delete require.cache[key];
        }
      });
      
      console.log('🧹 Limpeza forçada de memória executada');
    } catch (error) {
      console.log('⚠️ Erro na limpeza forçada:', error.message);
    }
  }

  getMemoryStats() {
    const memUsage = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    
    return {
      heap: {
        used: Math.round(memUsage.heapUsed / 1024 / 1024),
        total: Math.round(memUsage.heapTotal / 1024 / 1024),
        percent: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
      },
      rss: Math.round(memUsage.rss / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024),
      system: {
        total: Math.round(totalMem / 1024 / 1024),
        free: Math.round(freeMem / 1024 / 1024),
        used: Math.round((totalMem - freeMem) / 1024 / 1024)
      }
    };
  }
}

// Instância global
const memoryOptimizer = new MemoryOptimizer();

// Iniciar monitoramento automaticamente
memoryOptimizer.startMonitoring();

module.exports = memoryOptimizer;
