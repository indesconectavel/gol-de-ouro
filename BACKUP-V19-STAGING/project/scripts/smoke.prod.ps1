# Gol de Ouro Backend - Smoke Test Producao
# ==========================================
# 
# INSTRUCOES:
# 1. Configure a URL do backend em scripts/prod.backend.url.txt
# 2. Execute: .\scripts\smoke.prod.ps1
# 
# ROTAS TESTADAS (somente leitura):
# - GET / (rota raiz - publica)
# - GET /health (rota de saude)
# - GET /api/public/dashboard (dashboard publico)

$urlFile = "scripts/prod.backend.url.txt"

# Verificar se o arquivo de URL existe
if (-not (Test-Path $urlFile)) {
    Write-Host "Arquivo $urlFile nao encontrado!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Crie o arquivo $urlFile com a URL do backend de producao:" -ForegroundColor Yellow
    Write-Host "   Exemplo: https://goldeouro-backend.onrender.com" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Dica: A URL deve ser a do seu backend no Render" -ForegroundColor Yellow
    Write-Host "Apos criar, execute: .\scripts\smoke.prod.ps1" -ForegroundColor Cyan
    exit 1
}

# Ler URL do arquivo
$API = Get-Content $urlFile -Raw | ForEach-Object { $_.Trim() }

if (-not $API -or $API -eq "") {
    Write-Host "URL vazia no arquivo $urlFile" -ForegroundColor Red
    exit 1
}

Write-Host "URL de producao: $API" -ForegroundColor Cyan
Write-Host ""

# Verificar conectividade basica
Write-Host "Verificando conectividade..." -ForegroundColor Cyan
try {
    $pingResult = Test-NetConnection -ComputerName ($API -replace 'https?://', '') -Port 443 -InformationLevel Quiet -WarningAction SilentlyContinue
    if ($pingResult) {
        Write-Host "Conectividade OK - Backend acessivel" -ForegroundColor Green
    } else {
        Write-Host "Conectividade limitada - Testando mesmo assim" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Nao foi possivel verificar conectividade - Continuando testes" -ForegroundColor Gray
}

Write-Host ""

$ProgressPreference = 'SilentlyContinue'
$ErrorActionPreference = 'Continue'

Write-Host "SMOKE TEST PRODUCAO - Gol de Ouro Backend" -ForegroundColor Yellow
Write-Host "===========================================" -ForegroundColor Yellow
Write-Host "API: $API" -ForegroundColor Cyan
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
Write-Host "==================" -ForegroundColor Yellow
Write-Host "PASS: $passed" -ForegroundColor Green
Write-Host "FAIL: $failed" -ForegroundColor Red
Write-Host "ERROR: $errors" -ForegroundColor Red
Write-Host "Tempo total: $([math]::Round($totalTime.TotalSeconds, 2))s" -ForegroundColor Cyan

if ($passed -eq 3) {
    Write-Host ""
    Write-Host "TODOS OS TESTES PASSARAM! Backend de producao funcionando." -ForegroundColor Green
    Write-Host "URL producao: $API" -ForegroundColor Cyan
    Write-Host "Health: $API/health" -ForegroundColor Cyan
    Write-Host "Dashboard: $API/api/public/dashboard" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Backend OK - Admin deve funcionar corretamente" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "ALGUNS TESTES FALHARAM. Verifique o backend de producao." -ForegroundColor Yellow
    Write-Host "Possiveis causas:" -ForegroundColor Cyan
    Write-Host "   - Backend nao esta rodando no Render" -ForegroundColor Gray
    Write-Host "   - Variaveis de ambiente nao configuradas" -ForegroundColor Gray
    Write-Host "   - Problemas de rede/firewall" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Detalhes dos testes:" -ForegroundColor Yellow
$results | ForEach-Object {
    $color = if ($_.Status -eq "PASS") { "Green" } elseif ($_.Status -eq "FAIL") { "Red" } else { "Red" }
    Write-Host "  $($_.Test): $($_.Status) - $([math]::Round($_.Duration, 0))ms" -ForegroundColor $color
}

Write-Host ""
Write-Host "Proximo passo:" -ForegroundColor Yellow
Write-Host "   Configure VITE_API_URL=$API no Vercel para o admin funcionar" -ForegroundColor Cyan
Write-Host "   Execute: vercel env add VITE_API_URL production" -ForegroundColor Cyan
