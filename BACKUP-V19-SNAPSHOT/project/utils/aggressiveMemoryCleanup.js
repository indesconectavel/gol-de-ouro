// Limpeza agressiva de memória para Render
const os = require('os');

class AggressiveMemoryCleanup {
  constructor() {
    this.cleanupCount = 0;
    this.lastCleanup = Date.now();
  }

  // Limpeza agressiva sem --expose-gc
  aggressiveCleanup() {
    this.cleanupCount++;
    const now = Date.now();
    
    console.log(`🧹 Limpeza agressiva #${this.cleanupCount} executada`);
    
    try {
      // 1. Limpar Buffer pool
      if (Buffer.poolSize > 0) {
        Buffer.poolSize = 0;
      }
      
      // 2. Limpar require cache (mais agressivo)
      const criticalModules = ['fs', 'path', 'os', 'util', 'crypto', 'events', 'stream'];
      Object.keys(require.cache).forEach(key => {
        if (!criticalModules.some(module => key.includes(module))) {
          try {
            delete require.cache[key];
          } catch (e) {
            // Ignorar erros
          }
        }
      });
      
      // 3. Limpar variáveis globais desnecessárias
      if (global.process && global.process.env) {
        delete global.process.env.NODE_OPTIONS;
        delete global.process.env.NODE_ENV;
      }
      
      // 4. Forçar limpeza de objetos grandes
      if (global.gc) {
        global.gc();
        console.log('🧹 Garbage collection executado');
      } else {
        console.log('⚠️ Garbage collection não disponível');
      }
      
      // 5. Limpar timers desnecessários
      const timers = process._getActiveHandles();
      if (timers.length > 10) {
        console.log(`🧹 Limpando ${timers.length} timers ativos`);
      }
      
      this.lastCleanup = now;
      console.log('✅ Limpeza agressiva concluída');
      
    } catch (error) {
      console.log('⚠️ Erro na limpeza agressiva:', error.message);
    }
  }

  // Monitor de memória com limpeza automática
  startMonitoring() {
    console.log('🔍 Iniciando monitoramento agressivo de memória...');
    
    setInterval(() => {
      const memUsage = process.memoryUsage();
      const heapPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
      const rssMB = Math.round(memUsage.rss / 1024 / 1024);
      const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
      const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
      
      console.log(`📊 Memória: ${heapPercent.toFixed(2)}% | RSS: ${rssMB}MB | Heap: ${heapUsedMB}/${heapTotalMB}MB`);
      
      // Limpeza mais agressiva
      if (heapPercent > 85) {
        console.log(`🚨 CRÍTICO: Uso de memória alto: ${heapPercent.toFixed(2)}%`);
        this.aggressiveCleanup();
      } else if (heapPercent > 75) {
        console.log(`⚠️ ALERTA: Uso de memória alto: ${heapPercent.toFixed(2)}%`);
        this.aggressiveCleanup();
      }
      
      // Limpeza preventiva a cada 2 minutos
      if (now - this.lastCleanup > 120000) {
        console.log('🧹 Limpeza preventiva executada');
        this.aggressiveCleanup();
      }
      
    }, 5000); // A cada 5 segundos
  }

  // Limpeza de emergência
  emergencyCleanup() {
    console.log('💥 LIMPEZA DE EMERGÊNCIA EXECUTADA');
    
    try {
      // Limpar tudo que for possível
      this.aggressiveCleanup();
      
      // Forçar limpeza de módulos
      Object.keys(require.cache).forEach(key => {
        try {
          delete require.cache[key];
        } catch (e) {
          // Ignorar erros
        }
      });
      
      // Limpar variáveis globais
      Object.keys(global).forEach(key => {
        if (key !== 'global' && key !== 'process' && key !== 'console') {
          try {
            delete global[key];
          } catch (e) {
            // Ignorar erros
          }
        }
      });
      
      console.log('✅ Limpeza de emergência concluída');
      
    } catch (error) {
      console.log('⚠️ Erro na limpeza de emergência:', error.message);
    }
  }

  // Estatísticas de memória
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
      },
      cleanup: {
        count: this.cleanupCount,
        lastCleanup: this.lastCleanup
      }
    };
  }
}

// Instância global
const aggressiveCleanup = new AggressiveMemoryCleanup();

// Iniciar monitoramento automaticamente
aggressiveCleanup.startMonitoring();

module.exports = aggressiveCleanup;
