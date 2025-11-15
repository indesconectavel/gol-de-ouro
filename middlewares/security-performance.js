// MIDDLEWARES DE SEGURANÇA E PERFORMANCE - GOL DE OURO v1.2.0
// ============================================================
// Data: 21/10/2025
// Status: SEGURANÇA E PERFORMANCE IMPLEMENTADAS
// Versão: v1.2.0-final-production
// GPT-4o Auto-Fix: Middlewares de segurança e performance

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const winston = require('winston');

// =====================================================
// CONFIGURAÇÃO DE LOGS DE SEGURANÇA
// =====================================================

const securityLogger = winston.createLogger({
  level: 'warn',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: 'security.log', 
      level: 'warn',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// =====================================================
// MIDDLEWARE DE RATE LIMITING AVANÇADO
// =====================================================

// Rate limiting geral
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
  message: {
    success: false,
    message: 'Muitas tentativas. Tente novamente em 15 minutos.',
    retryAfter: '15 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    securityLogger.warn('Rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      timestamp: new Date().toISOString()
    });
    
    res.status(429).json({
      success: false,
      message: 'Muitas tentativas. Tente novamente em 15 minutos.',
      retryAfter: '15 minutos'
    });
  }
});

// Rate limiting para autenticação
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // máximo 10 tentativas de login por IP
  message: {
    success: false,
    message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
    retryAfter: '15 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    securityLogger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      body: req.body?.email ? { email: req.body.email } : {},
      timestamp: new Date().toISOString()
    });
    
    res.status(429).json({
      success: false,
      message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
      retryAfter: '15 minutos'
    });
  }
});

// Rate limiting para PIX
const pixLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 5, // máximo 5 tentativas de PIX por IP
  message: {
    success: false,
    message: 'Muitas tentativas de pagamento. Tente novamente em 5 minutos.',
    retryAfter: '5 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    securityLogger.warn('PIX rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      timestamp: new Date().toISOString()
    });
    
    res.status(429).json({
      success: false,
      message: 'Muitas tentativas de pagamento. Tente novamente em 5 minutos.',
      retryAfter: '5 minutos'
    });
  }
});

// Rate limiting para jogos
const gameLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 30, // máximo 30 chutes por minuto
  message: {
    success: false,
    message: 'Muitos chutes em pouco tempo. Aguarde um momento.',
    retryAfter: '1 minuto'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    securityLogger.warn('Game rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      userId: req.user?.userId,
      timestamp: new Date().toISOString()
    });
    
    res.status(429).json({
      success: false,
      message: 'Muitos chutes em pouco tempo. Aguarde um momento.',
      retryAfter: '1 minuto'
    });
  }
});

// =====================================================
// MIDDLEWARE DE SEGURANÇA HELMET
// =====================================================

const securityHeaders = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "https://api.mercadopago.com", "https://*.supabase.co"],
      mediaSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"]
    }
  },
  
  // HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000, // 1 ano
    includeSubDomains: true,
    preload: true
  },
  
  // X-Frame-Options
  frameguard: {
    action: 'deny'
  },
  
  // X-Content-Type-Options
  noSniff: true,
  
  // X-XSS-Protection
  xssFilter: true,
  
  // Referrer Policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  },
  
  // Permissions Policy
  permissionsPolicy: {
    camera: [],
    microphone: [],
    geolocation: [],
    payment: ['self']
  }
});

// =====================================================
// MIDDLEWARE DE CORS SEGURO
// =====================================================

const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requests sem origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://goldeouro.lol',
      'https://www.goldeouro.lol',
      'https://admin.goldeouro.lol',
      'https://goldeouro-player.vercel.app'
    ];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      securityLogger.warn('CORS blocked origin', {
        origin: origin,
        ip: origin,
        timestamp: new Date().toISOString()
      });
      callback(new Error('Não permitido pelo CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'X-Idempotency-Key'
  ],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  maxAge: 86400 // 24 horas
};

const secureCors = cors(corsOptions);

// =====================================================
// MIDDLEWARE DE COMPRESSÃO OTIMIZADA
// =====================================================

const compressionOptions = {
  level: 6, // Nível de compressão balanceado
  threshold: 1024, // Comprimir apenas arquivos > 1KB
  filter: (req, res) => {
    // Não comprimir se já foi comprimido
    if (req.headers['x-no-compression']) {
      return false;
    }
    
    // Usar compressão padrão
    return compression.filter(req, res);
  }
};

const optimizedCompression = compression(compressionOptions);

// =====================================================
// MIDDLEWARE DE VALIDAÇÃO DE DADOS
// =====================================================

const { body, validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    securityLogger.warn('Validation error', {
      ip: req.ip,
      path: req.path,
      errors: errors.array(),
      body: req.body,
      timestamp: new Date().toISOString()
    });
    
    return res.status(400).json({
      success: false,
      message: 'Dados inválidos',
      errors: errors.array()
    });
  }
  next();
};

// =====================================================
// MIDDLEWARE DE AUDITORIA DE SEGURANÇA
// =====================================================

const securityAudit = (req, res, next) => {
  // Log de tentativas suspeitas
  const suspiciousPatterns = [
    /script/i,
    /<script/i,
    /javascript:/i,
    /onload=/i,
    /onerror=/i,
    /union.*select/i,
    /drop.*table/i,
    /insert.*into/i,
    /delete.*from/i
  ];
  
  const requestString = JSON.stringify({
    body: req.body,
    query: req.query,
    params: req.params,
    headers: req.headers
  });
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(requestString)) {
      securityLogger.error('Suspicious request detected', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
        pattern: pattern.toString(),
        request: requestString,
        timestamp: new Date().toISOString()
      });
      
      return res.status(400).json({
        success: false,
        message: 'Requisição suspeita detectada'
      });
    }
  }
  
  next();
};

// =====================================================
// MIDDLEWARE DE MONITORAMENTO DE PERFORMANCE
// =====================================================

const performanceMonitor = (req, res, next) => {
  const startTime = Date.now();
  
  // Interceptar o método end para medir tempo de resposta
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = Date.now() - startTime;
    
    // Log de performance para requests lentos
    if (duration > 1000) { // > 1 segundo
      securityLogger.warn('Slow request detected', {
        ip: req.ip,
        path: req.path,
        method: req.method,
        duration: duration,
        statusCode: res.statusCode,
        timestamp: new Date().toISOString()
      });
    }
    
    // Adicionar header de tempo de resposta
    res.setHeader('X-Response-Time', `${duration}ms`);
    
    originalEnd.apply(this, args);
  };
  
  next();
};

// =====================================================
// MIDDLEWARE DE LIMPEZA DE DADOS
// =====================================================

const sanitizeInput = (req, res, next) => {
  // ✅ CORREÇÃO HTML FILTERING: Sanitização mais completa e robusta com aplicação RECURSIVA
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    
    // ✅ Remover caracteres de controle e normalizar
    let sanitized = str.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
    
    // ✅ CORREÇÃO: Repetidamente aplicar filtros até string estabilizar
    // Isso garante que padrões perigosos revelados após uma substituição sejam removidos
    let previous;
    do {
      previous = sanitized;
      sanitized = sanitized
        .replace(/<[^>]*>/g, '') // Remover todas as tags HTML
        .replace(/[<>\"'`]/g, '') // Remover caracteres perigosos
        .replace(/javascript:/gi, '') // Remover javascript:
        .replace(/data:/gi, '') // Remover data: URLs
        .replace(/vbscript:/gi, '') // Remover vbscript:
        .replace(/on\w+\s*=/gi, '') // Remover event handlers (onclick=, onerror=, etc.)
        .replace(/&#x?[0-9a-f]+;/gi, '') // Remover entidades HTML
        .trim();
    } while (sanitized !== previous);
    
    // ✅ Limitar tamanho para prevenir DoS
    if (sanitized.length > 10000) {
      sanitized = sanitized.substring(0, 10000);
    }
    
    return sanitized;
  };
  
  // Sanitizar body
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeString(req.body[key]);
      }
    }
  }
  
  // Sanitizar query
  if (req.query) {
    for (const key in req.query) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitizeString(req.query[key]);
      }
    }
  }
  
  next();
};

// =====================================================
// MIDDLEWARE DE PROTEÇÃO CONTRA BRUTE FORCE
// =====================================================

const bruteForceProtection = (req, res, next) => {
  const ip = req.ip;
  const path = req.path;
  const key = `${ip}:${path}`;
  
  // Simular proteção básica (em produção, usar Redis)
  if (!global.bruteForceAttempts) {
    global.bruteForceAttempts = new Map();
  }
  
  const attempts = global.bruteForceAttempts.get(key) || { count: 0, lastAttempt: 0 };
  const now = Date.now();
  
  // Reset contador após 15 minutos
  if (now - attempts.lastAttempt > 15 * 60 * 1000) {
    attempts.count = 0;
  }
  
  // Incrementar contador
  attempts.count++;
  attempts.lastAttempt = now;
  global.bruteForceAttempts.set(key, attempts);
  
  // Bloquear se muitas tentativas
  if (attempts.count > 20) {
    securityLogger.error('Brute force attack detected', {
      ip: ip,
      path: path,
      attempts: attempts.count,
      timestamp: new Date().toISOString()
    });
    
    return res.status(429).json({
      success: false,
      message: 'Muitas tentativas suspeitas. IP bloqueado temporariamente.'
    });
  }
  
  next();
};

// =====================================================
// EXPORTAÇÃO DOS MIDDLEWARES
// =====================================================

module.exports = {
  // Rate Limiters
  generalLimiter,
  authLimiter,
  pixLimiter,
  gameLimiter,
  
  // Segurança
  securityHeaders,
  secureCors,
  optimizedCompression,
  securityAudit,
  bruteForceProtection,
  
  // Validação e Sanitização
  validateRequest,
  sanitizeInput,
  
  // Monitoramento
  performanceMonitor,
  securityLogger,
  
  // Utilitários
  corsOptions
};

// =====================================================
// MIDDLEWARES DE SEGURANÇA E PERFORMANCE v1.2.0 - PRODUÇÃO REAL 100%
// =====================================================
