# scripts/assert-prod-simple.ps1 - Validacao estrita de producao (sem falso-positivo)
# Modo estrito: falha dura se qualquer assert falhar

param(
    [Parameter(Mandatory=$true)]
    [string]$ApiBase,
    
    [Parameter(Mandatory=$true)]
    [string]$PlayerUrl,
    
    [Parameter(Mandatory=$true)]
    [string]$AdminUrl
)

$ErrorActionPreference = 'Stop'
$global:ASSERT_FAILED = $false

function Write-Assert {
    param([string]$Message, [string]$Status = "OK")
    if ($Status -eq "OK") {
        Write-Host "✅ $Message" -ForegroundColor Green
    } else {
        Write-Host "❌ $Message" -ForegroundColor Red
        $global:ASSERT_FAILED = $true
    }
}

function Write-Fail {
    param([string]$Message)
    Write-Host "❌ NO-GO: $Message" -ForegroundColor Red
    Write-Host "💡 Dica: Verifique a configuracao e tente novamente" -ForegroundColor Yellow
    exit 1
}

Write-Host "🔎 VALIDACAO ESTRITA DE PRODUCAO - GOL DE OURO" -ForegroundColor Cyan
Write-Host "API Base: $ApiBase" -ForegroundColor White
Write-Host "Player URL: $PlayerUrl" -ForegroundColor White
Write-Host "Admin URL: $AdminUrl" -ForegroundColor White
Write-Host ""

# 1) GET $ApiBase/health → 200 e {"ok":true}
Write-Host "1. Verificando /health..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-WebRequest -Uri "$ApiBase/health" -Method GET -UseBasicParsing
    $healthJson = $healthResponse.Content | ConvertFrom-Json
    
    if ($healthResponse.StatusCode -eq 200 -and $healthJson.ok -eq $true) {
        Write-Assert "GET /health → 200 e {ok:true}" "OK"
        Write-Host "   Resposta salva: $($healthResponse.Content.Substring(0, [Math]::Min(100, $healthResponse.Content.Length)))..." -ForegroundColor Gray
    } else {
        Write-Assert "GET /health → 200 e {ok:true}" "FAIL"
        Write-Fail "Health check falhou: Status=$($healthResponse.StatusCode), ok=$($healthJson.ok)"
    }
} catch {
    Write-Assert "GET /health → 200 e {ok:true}" "FAIL"
    Write-Fail "Erro ao acessar /health: $($_.Exception.Message)"
}

# 2) GET $ApiBase/version → JSON com version e commit
Write-Host "`n2. Verificando /version..." -ForegroundColor Yellow
try {
    $versionResponse = Invoke-WebRequest -Uri "$ApiBase/version" -Method GET -UseBasicParsing
    
    if ($versionResponse.StatusCode -eq 200) {
        $versionJson = $versionResponse.Content | ConvertFrom-Json
        if ($versionJson.version -and $versionJson.commit) {
            Write-Assert "GET /version → 200 com version e commit" "OK"
            Write-Host "   Resposta salva: $($versionResponse.Content)" -ForegroundColor Gray
        } else {
            Write-Assert "GET /version → 200 com version e commit" "FAIL"
            Write-Fail "Version endpoint nao contem version/commit: $($versionResponse.Content)"
        }
    } else {
        Write-Assert "GET /version → 200 com version e commit" "FAIL"
        Write-Fail "Version endpoint retornou status $($versionResponse.StatusCode)"
    }
} catch {
    Write-Assert "GET /version → 200 com version e commit" "FAIL"
    Write-Fail "Erro ao acessar /version: $($_.Exception.Message)"
}

# 3) GET $ApiBase/readiness → 200 e validacao de DB
Write-Host "`n3. Verificando /readiness..." -ForegroundColor Yellow
try {
    $readinessResponse = Invoke-WebRequest -Uri "$ApiBase/readiness" -Method GET -UseBasicParsing
    
    if ($readinessResponse.StatusCode -eq 200) {
        $readinessJson = $readinessResponse.Content | ConvertFrom-Json
        if ($readinessJson.status -eq "ready" -or $readinessJson.database) {
            Write-Assert "GET /readiness → 200 e validacao de DB" "OK"
            Write-Host "   Resposta salva: $($readinessResponse.Content)" -ForegroundColor Gray
        } else {
            Write-Assert "GET /readiness → 200 e validacao de DB" "FAIL"
            Write-Fail "Readiness endpoint nao validou DB: $($readinessResponse.Content)"
        }
    } else {
        Write-Assert "GET /readiness → 200 e validacao de DB" "FAIL"
        Write-Fail "Readiness endpoint retornou status $($readinessResponse.StatusCode)"
    }
} catch {
    Write-Assert "GET /readiness → 200 e validacao de DB" "FAIL"
    Write-Fail "Erro ao acessar /readiness: $($_.Exception.Message)"
}

# 4) GET $PlayerUrl → 200
Write-Host "`n4. Verificando Player URL..." -ForegroundColor Yellow
try {
    $playerResponse = Invoke-WebRequest -Uri $PlayerUrl -Method GET -UseBasicParsing
    
    if ($playerResponse.StatusCode -eq 200) {
        Write-Assert "GET Player URL → 200" "OK"
        Write-Host "   Cabecalhos salvos: $($playerResponse.Headers.Count) headers" -ForegroundColor Gray
        Write-Host "   Content-Type: $($playerResponse.Headers['Content-Type'])" -ForegroundColor Gray
    } else {
        Write-Assert "GET Player URL → 200" "FAIL"
        Write-Fail "Player URL retornou status $($playerResponse.StatusCode)"
    }
} catch {
    Write-Assert "GET Player URL → 200" "FAIL"
    Write-Fail "Erro ao acessar Player URL: $($_.Exception.Message)"
}

# 5) GET $AdminUrl/login → 200 (SPA fallback)
Write-Host "`n5. Verificando Admin URL..." -ForegroundColor Yellow
try {
    $adminResponse = Invoke-WebRequest -Uri "$AdminUrl/login" -Method GET -UseBasicParsing
    
    if ($adminResponse.StatusCode -eq 200) {
        Write-Assert "GET Admin URL → 200 (SPA fallback)" "OK"
        $htmlStart = $adminResponse.Content.Substring(0, [Math]::Min(200, $adminResponse.Content.Length))
        Write-Host "   HTML inicial salvo: $htmlStart..." -ForegroundColor Gray
    } else {
        Write-Assert "GET Admin URL → 200 (SPA fallback)" "FAIL"
        Write-Fail "Admin URL retornou status $($adminResponse.StatusCode)"
    }
} catch {
    Write-Assert "GET Admin URL → 200 (SPA fallback)" "FAIL"
    Write-Fail "Erro ao acessar Admin URL: $($_.Exception.Message)"
}

# 6) CORS preflight OPTIONS $ApiBase/payments/create
Write-Host "`n6. Verificando CORS preflight..." -ForegroundColor Yellow
try {
    $corsHeaders = @{
        'Origin' = $PlayerUrl
        'Access-Control-Request-Method' = 'POST'
        'Access-Control-Request-Headers' = 'Content-Type,Authorization'
    }
    
    $corsResponse = Invoke-WebRequest -Uri "$ApiBase/api/payments/pix/criar" -Method OPTIONS -Headers $corsHeaders -UseBasicParsing
    
    if ($corsResponse.StatusCode -eq 200 -or $corsResponse.StatusCode -eq 204) {
        $hasOrigin = $corsResponse.Headers['Access-Control-Allow-Origin'] -eq $PlayerUrl -or $corsResponse.Headers['Access-Control-Allow-Origin'] -eq '*'
        $hasMethods = $corsResponse.Headers['Access-Control-Allow-Methods'] -ne $null
        $hasHeaders = $corsResponse.Headers['Access-Control-Allow-Headers'] -ne $null
        
        if ($hasOrigin -and $hasMethods -and $hasHeaders) {
            Write-Assert "CORS preflight completo" "OK"
            Write-Host "   Cabecalhos CORS salvos:" -ForegroundColor Gray
            Write-Host "   - Allow-Origin: $($corsResponse.Headers['Access-Control-Allow-Origin'])" -ForegroundColor Gray
            Write-Host "   - Allow-Methods: $($corsResponse.Headers['Access-Control-Allow-Methods'])" -ForegroundColor Gray
            Write-Host "   - Allow-Headers: $($corsResponse.Headers['Access-Control-Allow-Headers'])" -ForegroundColor Gray
        } else {
            Write-Assert "CORS preflight completo" "FAIL"
            Write-Fail "CORS headers incompletos: Origin=$hasOrigin, Methods=$hasMethods, Headers=$hasHeaders"
        }
    } else {
        Write-Assert "CORS preflight completo" "FAIL"
        Write-Fail "CORS preflight retornou status $($corsResponse.StatusCode)"
    }
} catch {
    Write-Assert "CORS preflight completo" "FAIL"
    Write-Fail "Erro no CORS preflight: $($_.Exception.Message)"
}

# 7) PWA em producao: manifest e sw.js
Write-Host "`n7. Verificando PWA em producao..." -ForegroundColor Yellow

# Verificar Player PWA
try {
    $playerHtml = Invoke-WebRequest -Uri $PlayerUrl -Method GET -UseBasicParsing -Headers @{'Cache-Control'='no-cache'}
    $hasManifest = $playerHtml.Content -match 'manifest\.json'
    $hasServiceWorker = $playerHtml.Content -match 'sw\.js|service.*worker'
    
    if ($hasManifest -and $hasServiceWorker) {
        Write-Assert "Player PWA: manifest + sw.js" "OK"
        Write-Host "   Player HTML baixado (sem cache): $($playerHtml.Content.Length) chars" -ForegroundColor Gray
    } else {
        Write-Assert "Player PWA: manifest + sw.js" "FAIL"
        Write-Fail "Player PWA incompleto: manifest=$hasManifest, sw=$hasServiceWorker"
    }
} catch {
    Write-Assert "Player PWA: manifest + sw.js" "FAIL"
    Write-Fail "Erro ao verificar Player PWA: $($_.Exception.Message)"
}

# Verificar Admin PWA
try {
    $adminHtml = Invoke-WebRequest -Uri $AdminUrl -Method GET -UseBasicParsing -Headers @{'Cache-Control'='no-cache'}
    $hasManifest = $adminHtml.Content -match 'manifest\.json'
    $hasServiceWorker = $adminHtml.Content -match 'sw\.js|service.*worker'
    
    if ($hasManifest -and $hasServiceWorker) {
        Write-Assert "Admin PWA: manifest + sw.js" "OK"
        Write-Host "   Admin HTML baixado (sem cache): $($adminHtml.Content.Length) chars" -ForegroundColor Gray
    } else {
        Write-Assert "Admin PWA: manifest + sw.js" "FAIL"
        Write-Fail "Admin PWA incompleto: manifest=$hasManifest, sw=$hasServiceWorker"
    }
} catch {
    Write-Assert "Admin PWA: manifest + sw.js" "FAIL"
    Write-Fail "Erro ao verificar Admin PWA: $($_.Exception.Message)"
}

# Resultado final
Write-Host "`n" + "="*60 -ForegroundColor Cyan
if ($global:ASSERT_FAILED) {
    Write-Fail "Validacao estrita falhou - sistema NAO esta pronto para producao"
} else {
    Write-Host "✅ TODOS OS ASSERTS PASSARAM - Sistema pronto para producao!" -ForegroundColor Green
}
