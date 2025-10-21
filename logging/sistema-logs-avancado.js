// 📝 SISTEMA DE LOGS AVANÇADO - GOL DE OURO
// Data: 16 de Outubro de 2025
// Objetivo: Sistema de logs completo e estruturado

const fs = require('fs');
const path = require('path');
const { createWriteStream } = require('fs');

class SistemaLogs {
  constructor() {
    this.config = {
      logDir: path.join(__dirname, '..', 'logs'),
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10,
      levels: {
        ERROR: 0,
        WARN: 1,
        INFO: 2,
        DEBUG: 3
      },
      colors: {
        ERROR: '\x1b[31m', // Vermelho
        WARN: '\x1b[33m',  // Amarelo
        INFO: '\x1b[36m',  // Ciano
        DEBUG: '\x1b[37m', // Branco
        RESET: '\x1b[0m'   // Reset
      }
    };
    
    this.currentLogFile = null;
    this.currentLogStream = null;
    this.ensureLogDirectory();
    this.initializeLogFile();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.config.logDir)) {
      fs.mkdirSync(this.config.logDir, { recursive: true });
    }
  }

  initializeLogFile() {
    const timestamp = new Date().toISOString().split('T')[0];
    this.currentLogFile = path.join(this.config.logDir, `goldeouro-${timestamp}.log`);
    this.currentLogStream = createWriteStream(this.currentLogFile, { flags: 'a' });
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const pid = process.pid;
    const hostname = require('os').hostname();
    
    const logEntry = {
      timestamp,
      level,
      message,
      pid,
      hostname,
      ...meta
    };

    return JSON.stringify(logEntry);
  }

  formatConsoleMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const color = this.config.colors[level] || this.config.colors.INFO;
    const reset = this.config.colors.RESET;
    
    let consoleMessage = `${color}[${timestamp}] [${level}] ${message}${reset}`;
    
    if (Object.keys(meta).length > 0) {
      consoleMessage += `\n${color}  Meta: ${JSON.stringify(meta, null, 2)}${reset}`;
    }
    
    return consoleMessage;
  }

  writeToFile(logEntry) {
    if (this.currentLogStream) {
      this.currentLogStream.write(logEntry + '\n');
    }
  }

  async rotateLogFile() {
    if (this.currentLogStream) {
      this.currentLogStream.end();
    }

    // Verificar tamanho do arquivo atual
    if (fs.existsSync(this.currentLogFile)) {
      const stats = fs.statSync(this.currentLogFile);
      if (stats.size >= this.config.maxFileSize) {
        // Rotacionar arquivo
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const rotatedFile = this.currentLogFile.replace('.log', `-${timestamp}.log`);
        fs.renameSync(this.currentLogFile, rotatedFile);
        
        // Limpar arquivos antigos
        this.cleanupOldLogs();
      }
    }

    // Inicializar novo arquivo
    this.initializeLogFile();
  }

  cleanupOldLogs() {
    try {
      const files = fs.readdirSync(this.config.logDir)
        .filter(file => file.startsWith('goldeouro-') && file.endsWith('.log'))
        .map(file => ({
          name: file,
          path: path.join(this.config.logDir, file),
          stats: fs.statSync(path.join(this.config.logDir, file))
        }))
        .sort((a, b) => b.stats.mtime - a.stats.mtime);

      if (files.length > this.config.maxFiles) {
        const toDelete = files.slice(this.config.maxFiles);
        toDelete.forEach(file => {
          fs.unlinkSync(file.path);
          console.log(`🗑️ [LOGS] Arquivo antigo removido: ${file.name}`);
        });
      }
    } catch (error) {
      console.error('❌ [LOGS] Erro ao limpar logs antigos:', error.message);
    }
  }

  log(level, message, meta = {}) {
    const logEntry = this.formatMessage(level, message, meta);
    const consoleMessage = this.formatConsoleMessage(level, message, meta);
    
    // Escrever no console
    console.log(consoleMessage);
    
    // Escrever no arquivo
    this.writeToFile(logEntry);
    
    // Verificar rotação de arquivo
    if (fs.existsSync(this.currentLogFile)) {
      const stats = fs.statSync(this.currentLogFile);
      if (stats.size >= this.config.maxFileSize) {
        this.rotateLogFile();
      }
    }
  }

  error(message, meta = {}) {
    this.log('ERROR', message, meta);
  }

  warn(message, meta = {}) {
    this.log('WARN', message, meta);
  }

  info(message, meta = {}) {
    this.log('INFO', message, meta);
  }

  debug(message, meta = {}) {
    this.log('DEBUG', message, meta);
  }

  // Logs específicos do sistema
  logAuth(action, user, meta = {}) {
    this.info(`[AUTH] ${action}`, {
      user: user.email || user.username || 'unknown',
      action,
      ...meta
    });
  }

  logPayment(action, amount, user, meta = {}) {
    this.info(`[PAYMENT] ${action}`, {
      user: user.email || user.username || 'unknown',
      amount,
      action,
      ...meta
    });
  }

  logGame(action, loteId, user, meta = {}) {
    this.info(`[GAME] ${action}`, {
      user: user.email || user.username || 'unknown',
      loteId,
      action,
      ...meta
    });
  }

  logSystem(action, component, meta = {}) {
    this.info(`[SYSTEM] ${action}`, {
      component,
      action,
      ...meta
    });
  }

  logError(error, context = {}) {
    this.error('Erro capturado', {
      message: error.message,
      stack: error.stack,
      ...context
    });
  }

  // Métricas e estatísticas
  getLogStats() {
    try {
      const files = fs.readdirSync(this.config.logDir)
        .filter(file => file.startsWith('goldeouro-') && file.endsWith('.log'));

      let totalSize = 0;
      let totalLines = 0;
      const levelCounts = { ERROR: 0, WARN: 0, INFO: 0, DEBUG: 0 };

      files.forEach(file => {
        const filePath = path.join(this.config.logDir, file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;

        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n').filter(line => line.trim());
        totalLines += lines.length;

        lines.forEach(line => {
          try {
            const logEntry = JSON.parse(line);
            if (levelCounts.hasOwnProperty(logEntry.level)) {
              levelCounts[logEntry.level]++;
            }
          } catch (e) {
            // Ignorar linhas que não são JSON válido
          }
        });
      });

      return {
        totalFiles: files.length,
        totalSize: `${(totalSize / 1024 / 1024).toFixed(2)} MB`,
        totalLines,
        levelCounts,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      this.error('Erro ao obter estatísticas de logs', { error: error.message });
      return null;
    }
  }

  // Busca em logs
  searchLogs(query, level = null, limit = 100) {
    try {
      const files = fs.readdirSync(this.config.logDir)
        .filter(file => file.startsWith('goldeouro-') && file.endsWith('.log'))
        .sort()
        .reverse(); // Mais recentes primeiro

      const results = [];

      for (const file of files) {
        if (results.length >= limit) break;

        const filePath = path.join(this.config.logDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n').filter(line => line.trim());

        for (const line of lines) {
          if (results.length >= limit) break;

          try {
            const logEntry = JSON.parse(line);
            
            const matchesQuery = !query || 
              logEntry.message.toLowerCase().includes(query.toLowerCase()) ||
              JSON.stringify(logEntry).toLowerCase().includes(query.toLowerCase());
            
            const matchesLevel = !level || logEntry.level === level;

            if (matchesQuery && matchesLevel) {
              results.push(logEntry);
            }
          } catch (e) {
            // Ignorar linhas que não são JSON válido
          }
        }
      }

      return results;
    } catch (error) {
      this.error('Erro ao buscar logs', { error: error.message });
      return [];
    }
  }

  // Fechar streams
  close() {
    if (this.currentLogStream) {
      this.currentLogStream.end();
    }
  }
}

// Singleton para uso global
const logger = new SistemaLogs();

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Sistema de logs encerrando...');
  logger.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Sistema de logs encerrando...');
  logger.close();
  process.exit(0);
});

module.exports = { SistemaLogs, logger };
