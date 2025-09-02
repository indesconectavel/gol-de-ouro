# Script simples para corrigir credenciais
Write-Host "=== CORRIGINDO CREDENCIAIS EXPOSTAS ===" -ForegroundColor Cyan

# Nova senha segura
$newPassword = "J6wGY2EnCyXc0lID"
$newDatabaseUrl = "postgresql://postgres.uatszaqzdqcwnfbipoxg:$newPassword@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

Write-Host "🔐 Nova senha: $newPassword" -ForegroundColor Green
Write-Host "📝 Nova URL: $newDatabaseUrl" -ForegroundColor Yellow

# Criar arquivo .env
$envContent = @"
# Configurações do Banco de Dados
DATABASE_URL=$newDatabaseUrl

# Configurações do Servidor
PORT=3000

# Configurações de Segurança
JWT_SECRET=c3f1a3d8e9f2b4c6a0d1f3b7a9c5e2d8f1a3c5e7b9d2f4a6c8e0b2d4f6a8c0e2
ADMIN_TOKEN=adm_8d1e3c7a5b9f2a4c6e0d1f3b7a9c5e2d

# Configurações de CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:5174,https://goldeouro-admin.vercel.app

# Ambiente
NODE_ENV=development
"@

$envContent | Out-File -FilePath ".env" -Encoding UTF8
Write-Host "✅ Arquivo .env criado com novas credenciais!" -ForegroundColor Green

Write-Host "`n⚠️  IMPORTANTE: Atualize a senha no Supabase Dashboard!" -ForegroundColor Red
Write-Host "1. Acesse: https://supabase.com/dashboard" -ForegroundColor White
Write-Host "2. Vá em: Settings > Database" -ForegroundColor White
Write-Host "3. Clique em: 'Reset database password'" -ForegroundColor White
Write-Host "4. Use a senha: $newPassword" -ForegroundColor White

Write-Host "`n✅ Credenciais atualizadas localmente!" -ForegroundColor Green
