# Gol de Ouro Backend - Smoke Test Local
# ========================================
# 
# INSTRUCOES:
# 1. Certifique-se de que o backend esta rodando (npm start)
# 2. Execute: .\scripts\smoke.local.ps1
# 
# ROTAS TESTADAS:
# - GET / (rota raiz - publica - esperado: 200)
# - GET /health (rota de saude - esperado: 200)
# - GET /api/public/dashboard (dashboard publico - esperado: 200)

param([string]$API = "http://localhost:3000")

$ProgressPreference = 'SilentlyContinue'
$ErrorActionPreference = 'Continue'

Write-Host "SMOKE TEST LOCAL - Gol de Ouro Backend" -ForegroundColor Yellow
Write-Host "=============================================" -ForegroundColor Yellow
Write-Host "API: $API" -ForegroundColor Cyan
Write-Host ""

# Verificar se a porta 3000 esta ativa
Write-Host "Verificando porta 3000..." -ForegroundColor Cyan
try {
    $tcpConnection = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
    if ($tcpConnection) {
        Write-Host "Porta 3000 ativa - Backend rodando" -ForegroundColor Green
    } else {
        Write-Host "Porta 3000 nao encontrada - Verifique se o backend esta rodando" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Nao foi possivel verificar a porta 3000" -ForegroundColor Gray
}

Write-Host ""

$startTime = Get-Date
$results = @()

# Teste 1: Health Check
Write-Host "Testando /health..." -ForegroundColor Cyan
try {
    $start = Get-Date
    $response = Invoke-RestMethod -Uri "$API/health" -TimeoutSec 30 -Method GET
    $duration = (Get-Date) - $start
    
    if ($response.status -eq 'healthy') {
        Write-Host "HEALTH: $($response.status) - $($response.environment) - Uptime: $([math]::Round($response.uptime, 2))s" -ForegroundColor Green
        $results += @{ Test = "Health"; Status = "PASS"; Duration = $duration.TotalMilliseconds; Details = $response }
    } else {
        Write-Host "HEALTH: Status invalido - $($response.status)" -ForegroundColor Red
        $results += @{ Test = "Health"; Status = "FAIL"; Duration = $duration.TotalMilliseconds; Details = $response }
    }
} catch {
    Write-Host "HEALTH: Erro - $($_.Exception.Message)" -ForegroundColor Red
    $results += @{ Test = "Health"; Status = "ERROR"; Duration = 0; Details = $_.Exception.Message }
}

Write-Host ""

# Teste 2: Rota Raiz
Write-Host "Testando / (rota raiz)..." -ForegroundColor Cyan
try {
    $start = Get-Date
    $response = Invoke-RestMethod -Uri "$API/" -TimeoutSec 30 -Method GET
    $duration = (Get-Date) - $start
    
    if ($response.message -and $response.version) {
        Write-Host "ROOT: $($response.message) - v$($response.version)" -ForegroundColor Green
        $results += @{ Test = "Root"; Status = "PASS"; Duration = $duration.TotalMilliseconds; Details = $response }
    } else {
        Write-Host "ROOT: Resposta invalida" -ForegroundColor Red
        $results += @{ Test = "Root"; Status = "FAIL"; Duration = $duration.TotalMilliseconds; Details = $response }
    }
} catch {
    Write-Host "ROOT: Erro - $($_.Exception.Message)" -ForegroundColor Red
    $results += @{ Test = "Root"; Status = "ERROR"; Duration = 0; Details = $_.Exception.Message }
}

Write-Host ""

# Teste 3: Dashboard Publico
Write-Host "Testando /api/public/dashboard..." -ForegroundColor Cyan
try {
    $start = Get-Date
    $response = Invoke-RestMethod -Uri "$API/api/public/dashboard" -TimeoutSec 30 -Method GET
    $duration = (Get-Date) - $start
    
    if ($response.ok -and $response.players -ne $null) {
        Write-Host "DASHBOARD: OK - Jogadores: $($response.players), Partidas: $($response.matches), Palpites: $($response.guesses)" -ForegroundColor Green
        $results += @{ Test = "Dashboard"; Status = "PASS"; Duration = $duration.TotalMilliseconds; Details = $response }
    } else {
        Write-Host "DASHBOARD: Resposta invalida" -ForegroundColor Red
        $results += @{ Test = "Dashboard"; Status = "FAIL"; Duration = $duration.TotalMilliseconds; Details = $response }
    }
} catch {
    Write-Host "DASHBOARD: Erro - $($_.Exception.Message)" -ForegroundColor Red
    $results += @{ Test = "Dashboard"; Status = "ERROR"; Duration = 0; Details = $_.Exception.Message }
}

Write-Host ""

# Resumo dos resultados
$totalTime = (Get-Date) - $startTime
$passed = ($results | Where-Object { $_.Status -eq "PASS" }).Count
$failed = ($results | Where-Object { $_.Status -eq "FAIL" }).Count
$errors = ($results | Where-Object { $_.Status -eq "ERROR" }).Count

Write-Host "RESUMO DOS TESTES" -ForegroundColor Yellow
Write-Host "====================" -ForegroundColor Yellow
Write-Host "PASS: $passed" -ForegroundColor Green
Write-Host "FAIL: $failed" -ForegroundColor Red
Write-Host "ERROR: $errors" -ForegroundColor Red
Write-Host "Tempo total: $([math]::Round($totalTime.TotalSeconds, 2))s" -ForegroundColor Cyan

if ($passed -eq 3) {
    Write-Host ""
    Write-Host "TODOS OS TESTES PASSARAM! Backend funcionando perfeitamente." -ForegroundColor Green
    Write-Host "URL local: $API" -ForegroundColor Cyan
    Write-Host "Health: $API/health" -ForegroundColor Cyan
    Write-Host "Dashboard: $API/api/public/dashboard" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Proximo passo: Execute o admin em outro terminal:" -ForegroundColor Yellow
    Write-Host "   cd goldeouro-admin" -ForegroundColor Cyan
    Write-Host "   npm run dev" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "ALGUNS TESTES FALHARAM. Verifique o backend." -ForegroundColor Yellow
    Write-Host "Dica: Execute npm start na pasta goldeouro-backend" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Detalhes dos testes:" -ForegroundColor Yellow
$results | ForEach-Object {
    $color = if ($_.Status -eq "PASS") { "Green" } elseif ($_.Status -eq "FAIL") { "Red" } else { "Red" }
    Write-Host "  $($_.Test): $($_.Status) - $([math]::Round($_.Duration, 0))ms" -ForegroundColor $color
}
