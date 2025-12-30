# Check de producao
Write-Host "CHECK FINAL DE PRODUCAO - GOL DE OURO" -ForegroundColor Cyan

# Test 1: Health
Write-Host "1. Testando Health..." -ForegroundColor Yellow
try {
    $h = Invoke-WebRequest "https://goldeouro-backend-v2.fly.dev/health" -UseBasicParsing
    if ($h.StatusCode -eq 200) {
        Write-Host "   Health: OK" -ForegroundColor Green
    } else {
        Write-Host "   Health: FAIL" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   Health: ERROR" -ForegroundColor Red
    exit 1
}

# Test 2: Player
Write-Host "2. Testando Player..." -ForegroundColor Yellow
try {
    $p = Invoke-WebRequest "https://goldeouro.lol" -UseBasicParsing
    if ($p.StatusCode -eq 200) {
        Write-Host "   Player: OK" -ForegroundColor Green
    } else {
        Write-Host "   Player: FAIL" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   Player: ERROR" -ForegroundColor Red
    exit 1
}

# Test 3: Admin
Write-Host "3. Testando Admin..." -ForegroundColor Yellow
try {
    $a = Invoke-WebRequest "https://admin.goldeouro.lol" -UseBasicParsing
    if ($a.StatusCode -eq 200) {
        Write-Host "   Admin: OK" -ForegroundColor Green
    } else {
        Write-Host "   Admin: FAIL" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   Admin: ERROR" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "GO - pronto para jogadores reais" -ForegroundColor Green