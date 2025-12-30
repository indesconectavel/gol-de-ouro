# Script completo de auditoria de segurança
Write-Host "=== AUDITORIA COMPLETA DE SEGURANÇA ===" -ForegroundColor Red

Write-Host "`n🔍 VERIFICANDO VULNERABILIDADES..." -ForegroundColor Yellow

# 1. Verificar arquivos sensíveis no Git
Write-Host "`n1. VERIFICANDO ARQUIVOS SENSÍVEIS NO GIT:" -ForegroundColor Cyan
$sensitiveFiles = @(".env", ".env.local", ".env.production", "config/database.js", "db.js")
foreach ($file in $sensitiveFiles) {
    if (Test-Path $file) {
        $gitStatus = git ls-files $file 2>$null
        if ($gitStatus) {
            Write-Host "   ❌ $file está sendo rastreado pelo Git!" -ForegroundColor Red
        } else {
            Write-Host "   ✅ $file não está sendo rastreado" -ForegroundColor Green
        }
    }
}

# 2. Verificar .gitignore
Write-Host "`n2. VERIFICANDO .GITIGNORE:" -ForegroundColor Cyan
if (Test-Path ".gitignore") {
    $gitignoreContent = Get-Content ".gitignore" -Raw
    $requiredIgnores = @(".env*", "*.log", "node_modules/", "dist/", "*.key", "*.pem")
    foreach ($ignore in $requiredIgnores) {
        if ($gitignoreContent -match [regex]::Escape($ignore)) {
            Write-Host "   ✅ $ignore está no .gitignore" -ForegroundColor Green
        } else {
            Write-Host "   ❌ $ignore NÃO está no .gitignore!" -ForegroundColor Red
        }
    }
} else {
    Write-Host "   ❌ Arquivo .gitignore não existe!" -ForegroundColor Red
}

# 3. Verificar credenciais hardcoded
Write-Host "`n3. VERIFICANDO CREDENCIAIS HARDCODED:" -ForegroundColor Cyan
$filesToCheck = @("*.js", "*.json", "*.ps1", "*.sql")
foreach ($pattern in $filesToCheck) {
    $files = Get-ChildItem -Path . -Filter $pattern -Recurse | Where-Object { $_.Name -notlike "node_modules*" }
    foreach ($file in $files) {
        $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
        if ($content) {
            # Verificar padrões de credenciais
            $patterns = @(
                "postgresql://.*:.*@",
                "mongodb://.*:.*@",
                "mysql://.*:.*@",
                "password.*=.*['\"].*['\"]",
                "secret.*=.*['\"].*['\"]",
                "token.*=.*['\"].*['\"]"
            )
            foreach ($credPattern in $patterns) {
                if ($content -match $credPattern) {
                    Write-Host "   ❌ Credencial encontrada em: $($file.Name)" -ForegroundColor Red
                }
            }
        }
    }
}

# 4. Verificar variáveis de ambiente
Write-Host "`n4. VERIFICANDO VARIÁVEIS DE AMBIENTE:" -ForegroundColor Cyan
$envVars = @("DATABASE_URL", "JWT_SECRET", "ADMIN_TOKEN", "API_KEY")
foreach ($var in $envVars) {
    if ([Environment]::GetEnvironmentVariable($var)) {
        Write-Host "   ✅ $var está definida" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  $var não está definida" -ForegroundColor Yellow
    }
}

Write-Host "`n📋 RECOMENDAÇÕES DE SEGURANÇA:" -ForegroundColor Yellow
Write-Host "1. Criar .gitignore adequado" -ForegroundColor White
Write-Host "2. Remover credenciais do histórico Git" -ForegroundColor White
Write-Host "3. Usar variáveis de ambiente" -ForegroundColor White
Write-Host "4. Implementar secrets management" -ForegroundColor White
Write-Host "5. Configurar GitGuardian" -ForegroundColor White
