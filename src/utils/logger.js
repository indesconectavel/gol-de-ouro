/**
 * Sistema de Logging Estruturado com Winston
 * ETAPA 5 - Analytics e Monitoramento
 */

const winston = require('winston');
const path = require('path');

// Configuração de formatos personalizados
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}] ${message}`;
    
    // Adicionar metadados se existirem
    if (Object.keys(meta).length > 0) {
      log += ` | ${JSON.stringify(meta)}`;
    }
    
    return log;
  })
);

// Configuração de transportes
const transports = [
  // Console para desenvolvimento
  new winston.transports.Console({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }),
  
  // Arquivo para todos os logs
  new winston.transports.File({
    filename: path.join(__dirname, '../../logs/application.log'),
    level: 'info',
    format: logFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }),
  
  // Arquivo apenas para erros
  new winston.transports.File({
    filename: path.join(__dirname, '../../logs/error.log'),
    level: 'error',
    format: logFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5
  })
];

// Criar logger principal
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports,
  exitOnError: false
});

// Logger especializado para analytics
const analyticsLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/analytics.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 10
    })
  ]
});

// Logger para performance
const performanceLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/performance.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Logger para segurança
const securityLogger = winston.createLogger({
  level: 'warn',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/security.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 10
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Métodos utilitários para logging estruturado
const loggers = {
  // Logger principal
  info: (message, meta = {}) => logger.info(message, meta),
  warn: (message, meta = {}) => logger.warn(message, meta),
  error: (message, meta = {}) => logger.error(message, meta),
  debug: (message, meta = {}) => logger.debug(message, meta),
  
  // Analytics
  analytics: (event, data = {}) => {
    analyticsLogger.info('ANALYTICS_EVENT', {
      event,
      timestamp: new Date().toISOString(),
      ...data
    });
  },
  
  // Performance
  performance: (operation, duration, meta = {}) => {
    performanceLogger.info('PERFORMANCE_METRIC', {
      operation,
      duration,
      timestamp: new Date().toISOString(),
      ...meta
    });
  },
  
  // Segurança
  security: (event, data = {}) => {
    securityLogger.warn('SECURITY_EVENT', {
      event,
      timestamp: new Date().toISOString(),
      ...data
    });
  },
  
  // Métricas de negócio
  business: (metric, value, meta = {}) => {
    analyticsLogger.info('BUSINESS_METRIC', {
      metric,
      value,
      timestamp: new Date().toISOString(),
      ...meta
    });
  }
};

// Middleware para logging de requisições HTTP
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log da requisição
  loggers.info('HTTP_REQUEST', {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: req.user?.id || null
  });
  
  // Interceptar resposta para log de performance
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - start;
    
    loggers.performance('HTTP_REQUEST', duration, {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      contentLength: data ? data.length : 0
    });
    
    originalSend.call(this, data);
  };
  
  next();
};

// Middleware para logging de erros
const errorLogger = (err, req, res, next) => {
  loggers.error('HTTP_ERROR', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userId: req.user?.id || null
  });
  
  next(err);
};

module.exports = {
  logger,
  analyticsLogger,
  performanceLogger,
  securityLogger,
  ...loggers,
  requestLogger,
  errorLogger
};
