const fs = require('fs');

console.log('🔧 CONFIGURANDO SISTEMA FINAL...');

// Configuração completa
const envContent = `DATABASE_URL=postgresql://postgres.uatszaqzdqcwnfbipoxg:J6wGY2EnCyXc0lID@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
PORT=3000
NODE_ENV=production
JWT_SECRET=8841259ba3f27fcdbfb1c26758d965874836178d0699cbc136237e600535c1d4
ADMIN_TOKEN=be81dd1b229fd4f1737ada13cbab37eb
CORS_ORIGINS=https://goldeouro-admin.vercel.app,https://goldeouro-backend.onrender.com
MERCADOPAGO_ACCESS_TOKEN=APP_USR-7954357605868928-090204-e9f5fb668c0f91f6b729328b1e14adf5-468718642
MERCADOPAGO_WEBHOOK_SECRET=157e633722bf94eb817dcd66d6e13c08425517779a7962feb034ddd26671f9bf`;

try {
  // Criar arquivo .env
  fs.writeFileSync('.env', envContent);
  console.log('✅ Arquivo .env criado com sucesso!');
  
  // Verificar se foi criado
  const envFile = fs.readFileSync('.env', 'utf8');
  console.log('📋 Conteúdo do .env:');
  console.log(envFile);
  
  console.log('');
  console.log('🎉 SISTEMA 100% CONFIGURADO!');
  console.log('');
  console.log('📋 RESUMO DA CONFIGURAÇÃO:');
  console.log('✅ DATABASE_URL: Configurada com Supabase');
  console.log('✅ MERCADOPAGO_ACCESS_TOKEN: Configurado');
  console.log('✅ MERCADOPAGO_WEBHOOK_SECRET: Configurado');
  console.log('✅ JWT_SECRET: Gerado e configurado');
  console.log('✅ ADMIN_TOKEN: Gerado e configurado');
  console.log('✅ CORS_ORIGINS: Configurado');
  console.log('');
  console.log('🚀 PRÓXIMOS PASSOS:');
  console.log('1. npm run db:update    # Atualizar banco de dados');
  console.log('2. npm run dev          # Iniciar servidor');
  console.log('3. Testar pagamentos PIX');
  
} catch (error) {
  console.error('❌ Erro ao criar .env:', error.message);
}
