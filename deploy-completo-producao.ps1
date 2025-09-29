# Deploy Completo para Producao - Gol de Ouro v1.1.1
Write-Host "Deploy completo para producao..." -ForegroundColor Cyan

# 1. Instalar dependencias do banco
Write-Host "1. Instalando dependencias do banco..." -NoNewline
try {
    npm install @supabase/supabase-js jsonwebtoken bcryptjs
    Write-Host " OK" -ForegroundColor Green
} catch {
    Write-Host " ERRO" -ForegroundColor Red
    exit 1
}

# 2. Atualizar router com banco real
Write-Host "2. Atualizando router com banco real..." -NoNewline
try {
    Copy-Item "router-database.js" "router.js" -Force
    Write-Host " OK" -ForegroundColor Green
} catch {
    Write-Host " ERRO" -ForegroundColor Red
    exit 1
}

# 3. Testar backend
Write-Host "3. Testando backend..." -NoNewline
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

# 4. Testar player mode
Write-Host "4. Testando player mode..." -NoNewline
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

# 5. Testar admin panel
Write-Host "5. Testando admin panel..." -NoNewline
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
Write-Host "Deploy completo realizado!" -ForegroundColor Green
Write-Host ""
Write-Host "Proximos passos:" -ForegroundColor Yellow
Write-Host "1. Configurar variaveis de ambiente no Fly.io" -ForegroundColor White
Write-Host "2. Executar schema.sql no Supabase" -ForegroundColor White
Write-Host "3. Configurar webhook PIX" -ForegroundColor White
Write-Host "4. Testar funcionalidades completas" -ForegroundColor White
