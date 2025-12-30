# Script para limpeza completa de segurança
Write-Host "=== LIMPEZA COMPLETA DE SEGURANÇA ===" -ForegroundColor Red

Write-Host "`n🧹 REMOVENDO ARQUIVOS SENSÍVEIS DO GIT..." -ForegroundColor Yellow

# 1. Remover arquivos sensíveis do Git
$sensitiveFiles = @(".env", ".env.local", ".env.production", "config/database.js")
foreach ($file in $sensitiveFiles) {
    if (Test-Path $file) {
        Write-Host "Removendo $file do Git..." -ForegroundColor Yellow
        git rm --cached $file 2>$null
        Write-Host "✅ $file removido do Git" -ForegroundColor Green
    }
}

# 2. Limpar histórico Git de credenciais
Write-Host "`n🔍 LIMPANDO HISTÓRICO GIT..." -ForegroundColor Yellow
Write-Host "⚠️  ATENÇÃO: Isso irá reescrever o histórico Git!" -ForegroundColor Red
Write-Host "Execute manualmente se necessário:" -ForegroundColor White
Write-Host "git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch .env' --prune-empty --tag-name-filter cat -- --all" -ForegroundColor Cyan

# 3. Criar arquivo .env.example
Write-Host "`n📝 CRIANDO .ENV.EXAMPLE..." -ForegroundColor Yellow
$envExample = @"
# Configurações do Banco de Dados
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require

# Configurações do Servidor
PORT=3000

# Configurações de Segurança
JWT_SECRET=your_jwt_secret_here_minimum_32_characters
ADMIN_TOKEN=your_admin_token_here

# Configurações de CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:5174,https://your-domain.com

# Ambiente
NODE_ENV=development
"@

$envExample | Out-File -FilePath ".env.example" -Encoding UTF8
Write-Host "✅ .env.example criado" -ForegroundColor Green

# 4. Verificar se .env está no .gitignore
Write-Host "`n🔍 VERIFICANDO .GITIGNORE..." -ForegroundColor Yellow
if (Test-Path ".gitignore") {
    $gitignoreContent = Get-Content ".gitignore" -Raw
    if ($gitignoreContent -match "\.env\*") {
        Write-Host "✅ .env* está no .gitignore" -ForegroundColor Green
    } else {
        Write-Host "❌ .env* NÃO está no .gitignore!" -ForegroundColor Red
        Write-Host "Adicionando .env* ao .gitignore..." -ForegroundColor Yellow
        Add-Content -Path ".gitignore" -Value "`n# Arquivos de ambiente`n.env*`n!.env.example"
        Write-Host "✅ .env* adicionado ao .gitignore" -ForegroundColor Green
    }
} else {
    Write-Host "❌ Arquivo .gitignore não existe!" -ForegroundColor Red
}

Write-Host "`n✅ LIMPEZA DE SEGURANÇA CONCLUÍDA!" -ForegroundColor Green
Write-Host "`n📋 PRÓXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host "1. Fazer commit das mudanças" -ForegroundColor White
Write-Host "2. Configurar variáveis de ambiente no servidor" -ForegroundColor White
Write-Host "3. Testar aplicação" -ForegroundColor White
Write-Host "4. Configurar GitGuardian" -ForegroundColor White
