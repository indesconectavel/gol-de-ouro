# Script para atualizar credenciais do banco
param(
    [Parameter(Mandatory=$true)]
    [string]$NewDatabaseUrl
)

Write-Host "=== ATUALIZANDO CREDENCIAIS DO BANCO ===" -ForegroundColor Cyan

# Verificar se o arquivo .env existe
if (-not (Test-Path ".env")) {
    Write-Host "❌ Arquivo .env não encontrado!" -ForegroundColor Red
    Write-Host "Criando arquivo .env..." -ForegroundColor Yellow
    
    # Criar arquivo .env básico
    $envContent = @"
# Configurações do Banco de Dados
DATABASE_URL=$NewDatabaseUrl

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
    Write-Host "✅ Arquivo .env criado!" -ForegroundColor Green
} else {
    Write-Host "📝 Atualizando arquivo .env existente..." -ForegroundColor Yellow
    
    # Ler arquivo .env atual
    $envContent = Get-Content ".env" -Raw
    
    # Atualizar DATABASE_URL
    $envContent = $envContent -replace "DATABASE_URL=.*", "DATABASE_URL=$NewDatabaseUrl"
    
    # Salvar arquivo atualizado
    $envContent | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "✅ DATABASE_URL atualizada!" -ForegroundColor Green
}

Write-Host "`n🧪 Testando nova conexão..." -ForegroundColor Yellow

# Testar conexão
try {
    $testResult = Invoke-RestMethod -Uri "http://localhost:3000/api/public/dashboard" -Method GET -TimeoutSec 10
    Write-Host "✅ Conexão com banco funcionando!" -ForegroundColor Green
    Write-Host "   Usuários: $($testResult.users)" -ForegroundColor White
    Write-Host "   Jogos: $($testResult.games.total)" -ForegroundColor White
} catch {
    Write-Host "❌ Erro na conexão: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Verifique se o backend está rodando e as credenciais estão corretas" -ForegroundColor Yellow
}

Write-Host "`n📋 PRÓXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host "1. Remover credenciais expostas do GitHub" -ForegroundColor White
Write-Host "2. Fazer commit das mudanças" -ForegroundColor White
Write-Host "3. Testar em produção" -ForegroundColor White

Write-Host "`n✅ Credenciais atualizadas com sucesso!" -ForegroundColor Green
