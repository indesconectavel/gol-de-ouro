# Final check de producao
param(
    [string]$ApiBase = "https://goldeouro-backend-v2.fly.dev",
    [string]$PlayerUrl = "https://goldeouro.lol",
    [string]$AdminUrl = "https://admin.goldeouro.lol"
)

Write-Host "🚀 CHECK FINAL DE PRODUCAO - GOL DE OURO" -ForegroundColor Cyan
Write-Host ""

$allTestsPassed = $true

# Test 1: API Health
Write-Host "1. Testando API Health..." -ForegroundColor Yellow
try {
    $health = Invoke-WebRequest "$ApiBase/health" -UseBasicParsing
    if ($health.StatusCode -eq 200) {
        $healthJson = $health.Content | ConvertFrom-Json
        if ($healthJson.ok -eq $true) {
            Write-Host "   ✅ GET /health → 200 e {ok:true}" -ForegroundColor Green
        } else {
            Write-Host "   ❌ GET /health → 200 mas {ok:false}" -ForegroundColor Red
            $allTestsPassed = $false
        }
    } else {
        Write-Host "   ❌ GET /health → $($health.StatusCode)" -ForegroundColor Red
        $allTestsPassed = $false
    }
} catch {
    Write-Host "   ❌ GET /health → ERROR" -ForegroundColor Red
    $allTestsPassed = $false
}

# Test 2: Player Frontend
Write-Host "2. Testando Player Frontend..." -ForegroundColor Yellow
try {
    $player = Invoke-WebRequest $PlayerUrl -UseBasicParsing
    if ($player.StatusCode -eq 200) {
        Write-Host "   ✅ GET Player → 200" -ForegroundColor Green
    } else {
        Write-Host "   ❌ GET Player → $($player.StatusCode)" -ForegroundColor Red
        $allTestsPassed = $false
    }
} catch {
    Write-Host "   ❌ GET Player → ERROR" -ForegroundColor Red
    $allTestsPassed = $false
}

# Test 3: Admin Frontend
Write-Host "3. Testando Admin Frontend..." -ForegroundColor Yellow
try {
    $admin = Invoke-WebRequest $AdminUrl -UseBasicParsing
    if ($admin.StatusCode -eq 200) {
        Write-Host "   ✅ GET Admin → 200" -ForegroundColor Green
    } else {
        Write-Host "   ❌ GET Admin → $($admin.StatusCode)" -ForegroundColor Red
        $allTestsPassed = $false
    }
} catch {
    Write-Host "   ❌ GET Admin → ERROR" -ForegroundColor Red
    $allTestsPassed = $false
}

# Resultado final
Write-Host ""
Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host "📊 RESUMO FINAL:" -ForegroundColor White
Write-Host ""

if ($allTestsPassed) {
    Write-Host "[API] /health ............................ OK" -ForegroundColor Green
    Write-Host "[WEB] Player/Admin 200 .................. OK" -ForegroundColor Green
    Write-Host ""
    Write-Host "✅ GO — pronto para jogadores reais" -ForegroundColor Green
    Write-Host "🎉 SISTEMA VALIDADO COM SUCESSO!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "[API] /health ............................ FAIL" -ForegroundColor Red
    Write-Host "[WEB] Player/Admin 200 .................. FAIL" -ForegroundColor Red
    Write-Host ""
    Write-Host "❌ NO-GO — sistema NAO esta pronto" -ForegroundColor Red
    Write-Host "🔧 Verifique as configuracoes e tente novamente" -ForegroundColor Yellow
    exit 1
}
