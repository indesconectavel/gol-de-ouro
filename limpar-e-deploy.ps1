# Script de Limpeza e Deploy - Gol de Ouro v1.1.1
Write-Host "=== LIMPEZA E DEPLOY GOL DE OURO v1.1.1 ===" -ForegroundColor Cyan
Write-Host ""

# 1. Limpar arquivos problemáticos
Write-Host "1. Limpando arquivos problemáticos..." -NoNewline
try {
    # Remover arquivos com nomes muito longos
    Get-ChildItem -File | Where-Object { $_.Name.Length -gt 50 } | Remove-Item -Force
    # Remover arquivos de backup grandes
    Get-ChildItem -File -Filter "*.bundle" | Remove-Item -Force
    # Remover arquivos de log
    Get-ChildItem -File -Filter "*.log" | Remove-Item -Force
    # Remover arquivos de teste
    Get-ChildItem -File -Filter "test-*" | Remove-Item -Force
    # Remover arquivos de debug
    Get-ChildItem -File -Filter "debug-*" | Remove-Item -Force
    # Remover arquivos de diagnóstico
    Get-ChildItem -File -Filter "diagnostico-*" | Remove-Item -Force
    Write-Host " OK" -ForegroundColor Green
} catch {
    Write-Host " FALHA" -ForegroundColor Red
    Write-Host "   Erro: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 2. Verificar arquivos essenciais
Write-Host "2. Verificando arquivos essenciais..." -NoNewline
$essentialFiles = @("Dockerfile", "fly.toml", "server-fly.js", ".dockerignore")
$allEssentialExist = $true
foreach ($file in $essentialFiles) {
    if (!(Test-Path $file)) {
        $allEssentialExist = $false
        break
    }
}
if ($allEssentialExist) {
    Write-Host " OK" -ForegroundColor Green
} else {
    Write-Host " FALHA" -ForegroundColor Red
    exit 1
}

# 3. Verificar flyctl
Write-Host "3. Verificando flyctl..." -NoNewline
try {
    flyctl version 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host " OK" -ForegroundColor Green
    } else {
        Write-Host " FALHA" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host " FALHA" -ForegroundColor Red
    exit 1
}

# 4. Login no Fly.io
Write-Host "4. Login no Fly.io..." -NoNewline
try {
    flyctl auth whoami 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host " JA LOGADO" -ForegroundColor Yellow
    } else {
        flyctl auth login
        if ($LASTEXITCODE -eq 0) {
            Write-Host " OK" -ForegroundColor Green
        } else {
            Write-Host " FALHA" -ForegroundColor Red
            exit 1
        }
    }
} catch {
    Write-Host " FALHA" -ForegroundColor Red
    exit 1
}

# 5. Criar app
Write-Host "5. Criando app..." -NoNewline
try {
    flyctl apps create goldeouro-backend-v3
    Write-Host " OK" -ForegroundColor Green
} catch {
    Write-Host " JA EXISTE" -ForegroundColor Yellow
}

# 6. Configurar secrets
Write-Host "6. Configurando secrets..." -NoNewline
Write-Host ""
Write-Host "IMPORTANTE: Configure as credenciais reais!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Execute os comandos abaixo:" -ForegroundColor White
Write-Host "flyctl secrets set DATABASE_URL='[SUA_URL_SUPABASE]' --app goldeouro-backend-v3" -ForegroundColor Gray
Write-Host "flyctl secrets set MP_ACCESS_TOKEN='[SEU_TOKEN]' --app goldeouro-backend-v3" -ForegroundColor Gray
Write-Host "flyctl secrets set MP_PUBLIC_KEY='[SUA_KEY]' --app goldeouro-backend-v3" -ForegroundColor Gray
Write-Host "flyctl secrets set ADMIN_TOKEN_PROD='admin-prod-token-2025' --app goldeouro-backend-v3" -ForegroundColor Gray
Write-Host "flyctl secrets set NODE_ENV='production' --app goldeouro-backend-v3" -ForegroundColor Gray
Write-Host ""
$continue = Read-Host "Pressione Enter apos configurar os secrets"
Write-Host " OK" -ForegroundColor Green

# 7. Deploy
Write-Host "7. Fazendo deploy..." -NoNewline
try {
    flyctl deploy --app goldeouro-backend-v3 --no-cache
    if ($LASTEXITCODE -eq 0) {
        Write-Host " OK" -ForegroundColor Green
    } else {
        Write-Host " FALHA" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host " FALHA" -ForegroundColor Red
    exit 1
}

# 8. Testar
Write-Host "8. Testando deploy..." -NoNewline
try {
    Start-Sleep -Seconds 15
    $response = Invoke-WebRequest -Uri "https://goldeouro-backend-v3.fly.dev/health" -UseBasicParsing -TimeoutSec 20
    if ($response.StatusCode -eq 200) {
        Write-Host " OK" -ForegroundColor Green
        Write-Host "   URL: https://goldeouro-backend-v3.fly.dev" -ForegroundColor Gray
    } else {
        Write-Host " FALHA (Status: $($response.StatusCode))" -ForegroundColor Red
    }
} catch {
    Write-Host " FALHA" -ForegroundColor Red
    Write-Host "   Erro: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== DEPLOY CONCLUIDO ===" -ForegroundColor Green
Write-Host "Backend: https://goldeouro-backend-v3.fly.dev" -ForegroundColor White
