// Configuração para PRODUÇÃO - GOL DE OURO
module.exports = {
  // Banco de dados (sua URL real do Supabase)
  DATABASE_URL: 'SUA_URL_DO_SUPABASE_AQUI', // ⚠️ SUBSTITUA PELA SUA URL REAL DO SUPABASE
  
  // Servidor
  PORT: 3000,
  NODE_ENV: 'production',
  
  // Segurança (CHAVES SEGURAS GERADAS AUTOMATICAMENTE)
  JWT_SECRET: '8841259ba3f27fcdbfb1c26758d965874836178d0699cbc136237e600535c1d4',
  ADMIN_TOKEN: 'be81dd1b229fd4f1737ada13cbab37eb',
  
  // CORS
  CORS_ORIGINS: 'https://goldeouro-admin.vercel.app,https://goldeouro-backend.onrender.com',
  
  // Mercado Pago - PRODUÇÃO (CREDENCIAIS REAIS DA SUA APLICAÇÃO)
  MERCADOPAGO_ACCESS_TOKEN: 'APP_USR-7954357605868928-090204-e9f5fb668c0f91f6b729328b1e14adf5-468718642',
  MERCADOPAGO_WEBHOOK_SECRET: '157e633722bf94eb817dcd66d6e13c08425517779a7962feb034ddd26671f9bf'
};

/*
INSTRUÇÕES PARA CONFIGURAR:

1. SUBSTITUA os valores acima pelos seus valores reais:

   DATABASE_URL: 
   - Vá no Supabase > Settings > Database
   - Copie a "Connection string" 
   - Exemplo: postgresql://postgres.xxx:senha@aws-0-sa-east-1.pooler.supabase.com:6543/postgres

   JWT_SECRET:
   - Gere uma chave aleatória de pelo menos 32 caracteres
   - Exemplo: goldeouro_jwt_secret_super_seguro_2025_123456789

   ADMIN_TOKEN:
   - Gere um token único de pelo menos 16 caracteres
   - Exemplo: admin_goldeouro_2025

   MERCADOPAGO_ACCESS_TOKEN:
   - Após ativar as credenciais de produção, copie o Access Token
   - Começa com APP_USR-

   MERCADOPAGO_WEBHOOK_SECRET:
   - Configure no painel do Mercado Pago > Webhooks
   - Gere um secret único

2. RENOMEIE este arquivo para .env

3. Execute: npm run db:update

4. Teste o sistema: npm run dev
*/
