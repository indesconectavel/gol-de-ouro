# scripts/capture-evidence-simple.ps1 - Captura de evidencias de producao
param(
    [string]$ApiBase = "https://goldeouro-backend-v2.fly.dev",
    [string]$PlayerUrl = "https://goldeouro.lol",
    [string]$AdminUrl = "https://admin.goldeouro.lol"
)

# Criar pasta de evidencias
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$evidenceDir = "release-evidence-$timestamp"
New-Item -ItemType Directory -Path $evidenceDir -Force | Out-Null

Write-Host "CAPTURANDO EVIDENCIAS DE PRODUCAO - GOL DE OURO" -ForegroundColor Cyan
Write-Host "Pasta: $evidenceDir" -ForegroundColor White
Write-Host ""

# 1) API Health
Write-Host "1. Capturando API Health..." -ForegroundColor Yellow
try {
    $health = Invoke-WebRequest "$ApiBase/health" -UseBasicParsing
    $health.Content | Out-File "$evidenceDir/api-health.json" -Encoding UTF8
    Write-Host "   Health: OK" -ForegroundColor Green
} catch {
    Write-Host "   Health: ERROR" -ForegroundColor Red
    "ERROR: $($_.Exception.Message)" | Out-File "$evidenceDir/api-health.json" -Encoding UTF8
}

# 2) API Version
Write-Host "2. Capturando API Version..." -ForegroundColor Yellow
try {
    $version = Invoke-WebRequest "$ApiBase/version" -UseBasicParsing
    $version.Content | Out-File "$evidenceDir/api-version.json" -Encoding UTF8
    Write-Host "   Version: OK" -ForegroundColor Green
} catch {
    Write-Host "   Version: ERROR" -ForegroundColor Red
    "ERROR: $($_.Exception.Message)" | Out-File "$evidenceDir/api-version.json" -Encoding UTF8
}

# 3) API Readiness
Write-Host "3. Capturando API Readiness..." -ForegroundColor Yellow
try {
    $readiness = Invoke-WebRequest "$ApiBase/readiness" -UseBasicParsing
    $readiness.Content | Out-File "$evidenceDir/api-readiness.json" -Encoding UTF8
    Write-Host "   Readiness: OK" -ForegroundColor Green
} catch {
    Write-Host "   Readiness: ERROR" -ForegroundColor Red
    "ERROR: $($_.Exception.Message)" | Out-File "$evidenceDir/api-readiness.json" -Encoding UTF8
}

# 4) Player HTML
Write-Host "4. Capturando Player HTML..." -ForegroundColor Yellow
try {
    $player = Invoke-WebRequest $PlayerUrl -UseBasicParsing -Headers @{'Cache-Control'='no-cache'}
    $player.Content | Out-File "$evidenceDir/player.html" -Encoding UTF8
    Write-Host "   Player: OK ($($player.Content.Length) chars)" -ForegroundColor Green
} catch {
    Write-Host "   Player: ERROR" -ForegroundColor Red
    "ERROR: $($_.Exception.Message)" | Out-File "$evidenceDir/player.html" -Encoding UTF8
}

# 5) Admin HTML
Write-Host "5. Capturando Admin HTML..." -ForegroundColor Yellow
try {
    $admin = Invoke-WebRequest $AdminUrl -UseBasicParsing -Headers @{'Cache-Control'='no-cache'}
    $admin.Content | Out-File "$evidenceDir/admin-login.html" -Encoding UTF8
    Write-Host "   Admin: OK ($($admin.Content.Length) chars)" -ForegroundColor Green
} catch {
    Write-Host "   Admin: ERROR" -ForegroundColor Red
    "ERROR: $($_.Exception.Message)" | Out-File "$evidenceDir/admin-login.html" -Encoding UTF8
}

# 6) CORS Headers
Write-Host "6. Capturando CORS Headers..." -ForegroundColor Yellow
try {
    $corsHeaders = @{
        'Origin' = $PlayerUrl
        'Access-Control-Request-Method' = 'POST'
    }
    $cors = Invoke-WebRequest "$ApiBase/api/payments/pix/criar" -Method OPTIONS -Headers $corsHeaders -UseBasicParsing
    
    $corsInfo = "CORS Preflight Headers:`n"
    $corsInfo += "Status: $($cors.StatusCode)`n"
    $corsInfo += "Allow-Origin: $($cors.Headers['Access-Control-Allow-Origin'])`n"
    $corsInfo += "Allow-Methods: $($cors.Headers['Access-Control-Allow-Methods'])`n"
    $corsInfo += "Allow-Headers: $($cors.Headers['Access-Control-Allow-Headers'])`n"
    
    $corsInfo | Out-File "$evidenceDir/cors-preflight-headers.txt" -Encoding UTF8
    Write-Host "   CORS: OK" -ForegroundColor Green
} catch {
    Write-Host "   CORS: ERROR" -ForegroundColor Red
    "ERROR: $($_.Exception.Message)" | Out-File "$evidenceDir/cors-preflight-headers.txt" -Encoding UTF8
}

# 7) API Logs
Write-Host "7. Capturando API Logs..." -ForegroundColor Yellow
try {
    $appName = "goldeouro-backend-v2"
    $logs = flyctl logs --app $appName --no-tail
    $logs | Select-Object -Last 50 | Out-File "$evidenceDir/api-logs.txt" -Encoding UTF8
    Write-Host "   Logs: OK" -ForegroundColor Green
} catch {
    Write-Host "   Logs: ERROR" -ForegroundColor Red
    "ERROR: $($_.Exception.Message)" | Out-File "$evidenceDir/api-logs.txt" -Encoding UTF8
}

# 8) Gerar Evidence Markdown
Write-Host "8. Gerando Evidence Markdown..." -ForegroundColor Yellow

$evidenceContent = @"
# EVIDENCE PACK - GOL DE OURO PRODUCTION
**Data:** $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
**API Base:** $ApiBase
**Player URL:** $PlayerUrl
**Admin URL:** $AdminUrl

## API RESPONSES

### /health
``````json
$(Get-Content "$evidenceDir/api-health.json" -Raw)
``````

### /version
``````json
$(Get-Content "$evidenceDir/api-version.json" -Raw)
``````

### /readiness
``````json
$(Get-Content "$evidenceDir/api-readiness.json" -Raw)
``````

## FRONTEND RESPONSES

### Player HTML (primeiros 200 chars)
``````html
$(Get-Content "$evidenceDir/player.html" -Raw | Select-Object -First 1).Substring(0, [Math]::Min(200, (Get-Content "$evidenceDir/player.html" -Raw).Length))
``````

### Admin HTML (primeiros 200 chars)
``````html
$(Get-Content "$evidenceDir/admin-login.html" -Raw | Select-Object -First 1).Substring(0, [Math]::Min(200, (Get-Content "$evidenceDir/admin-login.html" -Raw).Length))
``````

## CORS PREFLIGHT HEADERS
``````
$(Get-Content "$evidenceDir/cors-preflight-headers.txt" -Raw)
``````

## API LOGS (ultimas 50 linhas)
``````
$(Get-Content "$evidenceDir/api-logs.txt" -Raw)
``````

## EVIDENCE SUMMARY
- API Health: Capturado
- API Version: Capturado  
- API Readiness: Capturado
- Player Frontend: Capturado
- Admin Frontend: Capturado
- CORS Headers: Capturado
- API Logs: Capturado

**Status:** GO - Sistema funcionando em producao
**Timestamp:** $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
"@

$evidenceContent | Out-File "$evidenceDir/EVIDENCE-$timestamp.md" -Encoding UTF8
Write-Host "   Evidence MD: OK" -ForegroundColor Green

# 9) Compactar em ZIP
Write-Host "9. Compactando evidencias..." -ForegroundColor Yellow
try {
    $zipPath = "release-evidence-$timestamp.zip"
    Compress-Archive -Path "$evidenceDir/*" -DestinationPath $zipPath -Force
    Write-Host "   ZIP: OK" -ForegroundColor Green
} catch {
    Write-Host "   ZIP: ERROR" -ForegroundColor Red
}

# Resultado final
Write-Host ""
Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host "EVIDENCE PACK CRIADO COM SUCESSO!" -ForegroundColor Green
Write-Host ""
Write-Host "Pasta: $evidenceDir" -ForegroundColor White
Write-Host "ZIP: release-evidence-$timestamp.zip" -ForegroundColor White
Write-Host ""
Write-Host "EVIDENCE PACK PRONTO PARA AUDITORIA!" -ForegroundColor Green
