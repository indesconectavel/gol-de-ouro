const { cleanEnv, str, num, url } = require('envalid');

const env = cleanEnv(process.env, {
  // Banco de dados
  DATABASE_URL: url({
    desc: 'URL de conexão com PostgreSQL (Supabase)',
    example: 'postgresql://user:pass@host:port/db?sslmode=require'
  }),

  // Servidor
  PORT: num({
    desc: 'Porta do servidor',
    default: 3000,
    example: 3000
  }),

  // Segurança
  JWT_SECRET: str({
    desc: 'Chave secreta para assinatura de JWT (mínimo 32 caracteres)',
    example: 'sua_chave_jwt_super_secreta_aqui_minimo_32_chars'
  }),

  ADMIN_TOKEN: str({
    desc: 'Token de autenticação para rotas administrativas',
    example: 'seu_token_admin_unico_aqui'
  }),

  // CORS
  CORS_ORIGINS: str({
    desc: 'Origens permitidas para CORS (separadas por vírgula)',
    default: 'http://localhost:5174,https://goldeouro-admin.vercel.app',
    example: 'http://localhost:5174,https://seu-admin.vercel.app'
  }),

  // Ambiente
  NODE_ENV: str({
    desc: 'Ambiente de execução',
    choices: ['development', 'staging', 'production', 'test'],
    default: 'development'
  })
});

// Validações adicionais
if (env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET deve ter pelo menos 32 caracteres para segurança');
}

if (env.ADMIN_TOKEN.length < 16) {
  throw new Error('ADMIN_TOKEN deve ter pelo menos 16 caracteres');
}

// Log de configuração (apenas em desenvolvimento)
if (env.NODE_ENV === 'development') {
  console.log('🔧 Configuração de ambiente carregada:');
  console.log(`   📍 Porta: ${env.PORT}`);
  console.log(`   🌐 CORS Origins: ${env.CORS_ORIGINS}`);
  console.log(`   🔐 JWT Secret: ${env.JWT_SECRET.substring(0, 8)}...`);
  console.log(`   🛡️ Admin Token: ${env.ADMIN_TOKEN.substring(0, 8)}...`);
  console.log(`   🗄️ Database: ${env.DATABASE_URL.split('@')[1] || 'configurado'}`);
}

module.exports = env;
