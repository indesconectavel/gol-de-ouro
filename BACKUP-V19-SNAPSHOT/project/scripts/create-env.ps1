# Script para criar arquivo .env
Write-Host "=== CRIANDO ARQUIVO .ENV ===" -ForegroundColor Green

$envContent = @"
# Configurações do Banco de Dados
DATABASE_URL=postgresql://postgres.uatszaqzdqcwnfbipoxg:J6wGY2EnCyXc0lID@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true

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
Write-Host "✅ Arquivo .env criado com sucesso!" -ForegroundColor Green
Write-Host "`n📋 Conteúdo criado:" -ForegroundColor Yellow
Write-Host "- DATABASE_URL: Configurado" -ForegroundColor White
Write-Host "- JWT_SECRET: Configurado" -ForegroundColor White
Write-Host "- ADMIN_TOKEN: Configurado" -ForegroundColor White
Write-Host "- CORS_ORIGINS: Configurado" -ForegroundColor White
Write-Host "- NODE_ENV: development" -ForegroundColor White
