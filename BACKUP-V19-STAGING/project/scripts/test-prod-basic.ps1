# Teste basico de producao
param(
    [string]$ApiBase = "https://goldeouro-backend-v2.fly.dev",
    [string]$PlayerUrl = "https://goldeouro.lol",
    [string]$AdminUrl = "https://admin.goldeouro.lol"
)

Write-Host "Testando producao..." -ForegroundColor Green

# Test 1: Health
try {
    $h = Invoke-WebRequest "$ApiBase/health" -UseBasicParsing
    if ($h.StatusCode -eq 200) {
        Write-Host "✅ Health: OK" -ForegroundColor Green
    } else {
        Write-Host "❌ Health: FAIL ($($h.StatusCode))" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Health: ERROR" -ForegroundColor Red
    exit 1
}

# Test 2: Player
try {
    $p = Invoke-WebRequest $PlayerUrl -UseBasicParsing
    if ($p.StatusCode -eq 200) {
        Write-Host "✅ Player: OK" -ForegroundColor Green
    } else {
        Write-Host "❌ Player: FAIL ($($p.StatusCode))" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Player: ERROR" -ForegroundColor Red
    exit 1
}

# Test 3: Admin
try {
    $a = Invoke-WebRequest $AdminUrl -UseBasicParsing
    if ($a.StatusCode -eq 200) {
        Write-Host "✅ Admin: OK" -ForegroundColor Green
    } else {
        Write-Host "❌ Admin: FAIL ($($a.StatusCode))" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Admin: ERROR" -ForegroundColor Red
    exit 1
}

Write-Host "✅ GO - Sistema pronto!" -ForegroundColor Green
