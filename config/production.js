// CONFIGURAÇÃO DE PRODUÇÃO - GOL DE OURO v1.1.1
// Data: 2025-10-08T02:01:16.602Z

const config = {
  // Ambiente
  NODE_ENV: process.env.NODE_ENV || 'production',
  
  // Banco de dados
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://user:pass@localhost:5432/goldeouro',
  
  // JWT
  JWT_SECRET: (() => {
    if (!process.env.JWT_SECRET) throw new Error('Configuração inválida: JWT_SECRET não definido no ambiente');
    return process.env.JWT_SECRET;
  })(),
  JWT_REFRESH_SECRET: (() => {
    if (!process.env.JWT_REFRESH_SECRET) throw new Error('Configuração inválida: JWT_REFRESH_SECRET não definido no ambiente');
    return process.env.JWT_REFRESH_SECRET;
  })(),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  
  // Mercado Pago
  MERCADOPAGO_ACCESS_TOKEN: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
  MERCADOPAGO_WEBHOOK_SECRET: process.env.MERCADOPAGO_WEBHOOK_SECRET || '',
  
  // URLs
  FRONTEND_URL: process.env.FRONTEND_URL || 'https://goldeouro.vercel.app',
  ADMIN_URL: process.env.ADMIN_URL || 'https://admin.goldeouro.vercel.app',
  BACKEND_URL: process.env.BACKEND_URL || 'https://goldeouro-backend.fly.dev',
  
  // Redis
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // Monitoramento
  SENTRY_DSN: process.env.SENTRY_DSN || '',
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutos
  RATE_LIMIT_MAX_REQUESTS: 100, // 100 requests por janela
  
  // CORS
  CORS_ORIGINS: [
    process.env.FRONTEND_URL,
    process.env.ADMIN_URL,
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174'
  ].filter(Boolean),
  
  // Logs
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_FILE: process.env.LOG_FILE || './logs/app.log',
  
  // Backup
  BACKUP_SCHEDULE: '0 2 * * *', // Diário às 2h
  BACKUP_RETENTION_DAYS: 30,
  
  // WebSocket
  WS_HEARTBEAT_INTERVAL: 30000, // 30s
  WS_CONNECTION_TIMEOUT: 60000, // 1min
  
  // Jogo
  MAX_PLAYERS_PER_GAME: 10,
  GAME_TIMEOUT: 300000, // 5min
  MIN_BET_AMOUNT: 1.00,
  MAX_BET_AMOUNT: 1000.00,
  
  // Pagamentos
  MIN_WITHDRAWAL: 10.00,
  MAX_WITHDRAWAL: 5000.00,
  WITHDRAWAL_FEE: 0.05, // 5%
  
  // Segurança
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REQUIRE_SPECIAL: true,
  SESSION_TIMEOUT: 3600000, // 1h
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 900000, // 15min
};

module.exports = config;
