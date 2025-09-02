// Configuração temporária para teste
module.exports = {
  // Banco de dados (você precisa substituir pela sua URL real)
  DATABASE_URL: 'postgresql://user:password@host:port/database?sslmode=require',
  
  // Servidor
  PORT: 3000,
  NODE_ENV: 'development',
  
  // Segurança (valores temporários - você deve alterar)
  JWT_SECRET: 'goldeouro_jwt_secret_temporario_para_teste_123456789',
  ADMIN_TOKEN: 'admin_token_temporario_123456',
  
  // CORS
  CORS_ORIGINS: 'http://localhost:5174,https://goldeouro-admin.vercel.app',
  
  // Mercado Pago - TESTE
  MERCADOPAGO_ACCESS_TOKEN: 'APP_USR-3397625779357299-090204-ee43a5b4a4f79eb52934ecf9addca324-2666662094',
  MERCADOPAGO_WEBHOOK_SECRET: 'webhook_secret_temporario_123456'
};
