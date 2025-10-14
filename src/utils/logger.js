// Sistema de Logs Estruturados - Gol de Ouro v1.1.1
const fs = require('fs-extra');
const path = require('path');

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '..', '..', 'logs');
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
    this.currentLevel = process.env.LOG_LEVEL || 'info';
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.maxFiles = 5;
    
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  log(level, message, meta = {}) {
    if (this.levels[level] > this.levels[this.currentLevel]) {
      return;
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message: message,
      meta: meta,
      pid: process.pid,
      hostname: require('os').hostname()
    };

    // Log para console
    this.logToConsole(logEntry);

    // Log para arquivo
    this.logToFile(level, logEntry);
  }

  logToConsole(entry) {
    const colors = {
      ERROR: '\x1b[31m', // Vermelho
      WARN: '\x1b[33m',  // Amarelo
      INFO: '\x1b[36m',  // Ciano
      DEBUG: '\x1b[37m'  // Branco
    };
    const reset = '\x1b[0m';

    const color = colors[entry.level] || '';
    const metaStr = Object.keys(entry.meta).length > 0 ? 
      ` ${JSON.stringify(entry.meta)}` : '';

    console.log(
      `${color}[${entry.timestamp}] ${entry.level}: ${entry.message}${metaStr}${reset}`
    );
  }

  logToFile(level, entry) {
    const logFile = path.join(this.logDir, `${level}.log`);
    const logLine = JSON.stringify(entry) + '\n';

    // Verificar tamanho do arquivo
    this.rotateLogFileIfNeeded(logFile);

    // Escrever no arquivo
    fs.appendFileSync(logFile, logLine);
  }

  rotateLogFileIfNeeded(logFile) {
    if (!fs.existsSync(logFile)) return;

    const stats = fs.statSync(logFile);
    if (stats.size > this.maxFileSize) {
      // Rotacionar arquivo
      for (let i = this.maxFiles - 1; i > 0; i--) {
        const oldFile = `${logFile}.${i}`;
        const newFile = `${logFile}.${i + 1}`;
        
        if (fs.existsSync(oldFile)) {
          fs.renameSync(oldFile, newFile);
        }
      }
      
      // Mover arquivo atual para .1
      fs.renameSync(logFile, `${logFile}.1`);
    }
  }

  error(message, meta = {}) {
    this.log('error', message, meta);
  }

  warn(message, meta = {}) {
    this.log('warn', message, meta);
  }

  info(message, meta = {}) {
    this.log('info', message, meta);
  }

  debug(message, meta = {}) {
    this.log('debug', message, meta);
  }

  // Logs específicos do sistema
  logAuth(action, userId, success, meta = {}) {
    this.info(`Auth: ${action}`, {
      userId,
      success,
      action: 'auth',
      ...meta
    });
  }

  logGame(action, gameId, userId, meta = {}) {
    this.info(`Game: ${action}`, {
      gameId,
      userId,
      action: 'game',
      ...meta
    });
  }

  logPayment(action, transactionId, userId, amount, meta = {}) {
    this.info(`Payment: ${action}`, {
      transactionId,
      userId,
      amount,
      action: 'payment',
      ...meta
    });
  }

  logError(error, context = {}) {
    this.error('System Error', {
      message: error.message,
      stack: error.stack,
      ...context
    });
  }

  logSecurity(event, userId, ip, meta = {}) {
    this.warn(`Security: ${event}`, {
      userId,
      ip,
      event: 'security',
      ...meta
    });
  }

  // Métricas de performance
  logPerformance(operation, duration, meta = {}) {
    this.info(`Performance: ${operation}`, {
      operation,
      duration: `${duration}ms`,
      action: 'performance',
      ...meta
    });
  }

  // Logs de API
  logAPI(method, url, statusCode, duration, userId = null) {
    const level = statusCode >= 400 ? 'warn' : 'info';
    this.log(level, `API: ${method} ${url}`, {
      method,
      url,
      statusCode,
      duration: `${duration}ms`,
      userId,
      action: 'api'
    });
  }

  // Logs de WebSocket
  logWebSocket(event, userId, meta = {}) {
    this.info(`WebSocket: ${event}`, {
      userId,
      event: 'websocket',
      ...meta
    });
  }

  // Logs de banco de dados
  logDatabase(operation, table, duration, meta = {}) {
    this.debug(`Database: ${operation}`, {
      operation,
      table,
      duration: `${duration}ms`,
      action: 'database',
      ...meta
    });
  }

  // Obter logs recentes
  async getRecentLogs(level = 'info', limit = 100) {
    const logFile = path.join(this.logDir, `${level}.log`);
    
    if (!fs.existsSync(logFile)) {
      return [];
    }

    try {
      const content = fs.readFileSync(logFile, 'utf8');
      const lines = content.trim().split('\n').slice(-limit);
      
      return lines.map(line => {
        try {
          return JSON.parse(line);
        } catch (error) {
          return { message: line, timestamp: new Date().toISOString() };
        }
      });
    } catch (error) {
      this.error('Erro ao ler logs', { error: error.message });
      return [];
    }
  }

  // Limpar logs antigos
  async cleanOldLogs(days = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    try {
      const files = fs.readdirSync(this.logDir);
      
      for (const file of files) {
        const filePath = path.join(this.logDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime < cutoffDate) {
          fs.removeSync(filePath);
          this.info(`Log removido: ${file}`);
        }
      }
    } catch (error) {
      this.error('Erro ao limpar logs antigos', { error: error.message });
    }
  }
}

// Instância singleton
const logger = new Logger();

module.exports = logger;