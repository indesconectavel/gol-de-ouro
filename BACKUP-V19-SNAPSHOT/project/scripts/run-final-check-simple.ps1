# scripts/run-final-check-simple.ps1 - Check final de producao
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

# Test 2: API Version
Write-Host "2. Testando API Version..." -ForegroundColor Yellow
try {
    $version = Invoke-WebRequest "$ApiBase/version" -UseBasicParsing
    if ($version.StatusCode -eq 200) {
        $versionJson = $version.Content | ConvertFrom-Json
        if ($versionJson.version) {
            Write-Host "   ✅ GET /version → 200 com version" -ForegroundColor Green
        } else {
            Write-Host "   ❌ GET /version → 200 mas sem version" -ForegroundColor Red
            $allTestsPassed = $false
        }
    } else {
        Write-Host "   ❌ GET /version → $($version.StatusCode)" -ForegroundColor Red
        $allTestsPassed = $false
    }
} catch {
    Write-Host "   ❌ GET /version → ERROR" -ForegroundColor Red
    $allTestsPassed = $false
}

# Test 3: Player Frontend
Write-Host "3. Testando Player Frontend..." -ForegroundColor Yellow
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

# Test 4: Admin Frontend
Write-Host "4. Testando Admin Frontend..." -ForegroundColor Yellow
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

# Test 5: CORS
Write-Host "5. Testando CORS..." -ForegroundColor Yellow
try {
    $corsHeaders = @{
        'Origin' = $PlayerUrl
        'Access-Control-Request-Method' = 'POST'
    }
    $cors = Invoke-WebRequest "$ApiBase/api/payments/pix/criar" -Method OPTIONS -Headers $corsHeaders -UseBasicParsing
    if ($cors.StatusCode -eq 200 -or $cors.StatusCode -eq 204) {
        Write-Host "   ✅ CORS preflight → OK" -ForegroundColor Green
    } else {
        Write-Host "   ❌ CORS preflight → $($cors.StatusCode)" -ForegroundColor Red
        $allTestsPassed = $false
    }
} catch {
    Write-Host "   ❌ CORS preflight → ERROR" -ForegroundColor Red
    $allTestsPassed = $false
}

# Resultado final
Write-Host ""
Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host "📊 RESUMO FINAL:" -ForegroundColor White
Write-Host ""

if ($allTestsPassed) {
    Write-Host "[API] /health,/version ................... OK" -ForegroundColor Green
    Write-Host "[WEB] Player/Admin 200 .................. OK" -ForegroundColor Green
    Write-Host "[CORS] Preflight completo .............. OK" -ForegroundColor Green
    Write-Host ""
    Write-Host "✅ GO — pronto para jogadores reais" -ForegroundColor Green
    Write-Host "🎉 SISTEMA VALIDADO COM SUCESSO!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "[API] /health,/version ................... FAIL" -ForegroundColor Red
    Write-Host "[WEB] Player/Admin 200 .................. FAIL" -ForegroundColor Red
    Write-Host "[CORS] Preflight completo .............. FAIL" -ForegroundColor Red
    Write-Host ""
    Write-Host "❌ NO-GO — sistema NAO esta pronto" -ForegroundColor Red
    Write-Host "🔧 Verifique as configuracoes e tente novamente" -ForegroundColor Yellow
    exit 1
}
