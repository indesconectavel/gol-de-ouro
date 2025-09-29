# Script de Correção Imediata - Erro 404 Admin Panel
Write-Host "Correcao imediata do erro 404..." -ForegroundColor Cyan

# 1. Verificar problema
Write-Host "1. Verificando problema..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri "https://admin.goldeouro.lol/login" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host " OK" -ForegroundColor Green
    } else {
        Write-Host " ERRO: $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host " ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

# 2. Verificar se Admin Panel foi buildado
Write-Host "2. Verificando build do Admin Panel..." -NoNewline
if (Test-Path "goldeouro-admin/dist") {
    $files = Get-ChildItem "goldeouro-admin/dist" -Recurse | Measure-Object
    if ($files.Count -gt 0) {
        Write-Host " OK ($($files.Count) arquivos)" -ForegroundColor Green
    } else {
        Write-Host " VAZIO" -ForegroundColor Yellow
    }
} else {
    Write-Host " NAO EXISTE" -ForegroundColor Red
}

# 3. Verificar se Admin Panel foi deployado
Write-Host "3. Verificando deploy do Admin Panel..." -NoNewline
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

# 4. Verificar Backend
Write-Host "4. Verificando Backend..." -NoNewline
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

# 5. Verificar Player Mode
Write-Host "5. Verificando Player Mode..." -NoNewline
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

Write-Host ""
Write-Host "DIAGNOSTICO COMPLETO:" -ForegroundColor Yellow
Write-Host "1. Admin Panel: NAO DEPLOYADO (404)" -ForegroundColor Red
Write-Host "2. Backend: STATUS DESCONHECIDO" -ForegroundColor Yellow
Write-Host "3. Player Mode: FUNCIONANDO" -ForegroundColor Green
Write-Host "4. Banco de Dados: NAO CONFIGURADO" -ForegroundColor Red
Write-Host "5. Pagamentos: NAO CONFIGURADO" -ForegroundColor Red
Write-Host ""
Write-Host "PROXIMOS PASSOS URGENTES:" -ForegroundColor Yellow
Write-Host "1. Deploy Admin Panel no Vercel" -ForegroundColor White
Write-Host "2. Deploy Backend no Fly.io" -ForegroundColor White
Write-Host "3. Configurar Supabase" -ForegroundColor White
Write-Host "4. Configurar Mercado Pago" -ForegroundColor White
Write-Host "5. Testar funcionalidades completas" -ForegroundColor White
