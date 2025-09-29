# Deploy Simples para Producao
Write-Host "Deploy para producao..." -ForegroundColor Cyan

# 1. Substituir router.js pelo router de produção
Write-Host "1. Atualizando router.js..." -NoNewline
try {
    Copy-Item "router-producao.js" "router.js" -Force
    Write-Host " OK" -ForegroundColor Green
} catch {
    Write-Host " ERRO" -ForegroundColor Red
    exit 1
}

# 2. Testar backend
Write-Host "2. Testando backend..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri "https://goldeouro-backend-v2.fly.dev/health" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host " OK" -ForegroundColor Green
    } else {
        Write-Host " ERRO: $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host " ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. Testar player mode
Write-Host "3. Testando player mode..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri "https://goldeouro.lol" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host " OK" -ForegroundColor Green
    } else {
        Write-Host " ERRO: $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host " ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. Testar admin panel
Write-Host "4. Testando admin panel..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri "https://admin.goldeouro.lol" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host " OK" -ForegroundColor Green
    } else {
        Write-Host " ERRO: $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host " ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Configuracoes de producao aplicadas!" -ForegroundColor Green
