/**
 * ENV EXAMPLE - Exemplo de configuração de variáveis de ambiente
 * Copiar para .env e preencher com valores reais
 */

module.exports = {
  // Banco de Dados
  DATABASE_URL: 'postgresql://user:password@host:port/database',
  
  // Supabase
  SUPABASE_URL: 'https://your-project.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'your-service-role-key',
  SUPABASE_ANON_KEY: 'your-anon-key',
  
  // JWT
  JWT_SECRET: 'your-jwt-secret-key',
  
  // Mercado Pago
  MERCADOPAGO_ACCESS_TOKEN: 'your-mercadopago-access-token',
  MERCADOPAGO_CLIENT_ID: 'your-mercadopago-client-id',
  MERCADOPAGO_CLIENT_SECRET: 'your-mercadopago-client-secret',
  
  // Sistema V19
  USE_DB_QUEUE: 'true', // Forçar uso de DB em vez de memória
  HEARTBEAT_INTERVAL_MS: '5000', // Intervalo de heartbeat em ms
  INSTANCE_ID: 'instance_1', // ID da instância (gerado automaticamente se não fornecido)
  
  // Auditoria
  AUDIT_WEBHOOK_URL: 'https://hooks.slack.com/your-webhook-url', // Opcional
  
  // Roles (para testes)
  APP_ROLE_BACKEND: 'backend',
  APP_ROLE_OBSERVER: 'observer',
  APP_CURRENT_USER_ID: null, // UUID do usuário atual (para testes RLS)
  
  // Servidor
  PORT: '8080',
  NODE_ENV: 'production'
};

