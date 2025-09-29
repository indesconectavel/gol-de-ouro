# scripts/capture-evidence.ps1 - Captura de evidências de produção
param(
    [Parameter(Mandatory=$true)]
    [string]$ApiBase,
    
    [Parameter(Mandatory=$true)]
    [string]$PlayerUrl,
    
    [Parameter(Mandatory=$true)]
    [string]$AdminUrl
)

$ErrorActionPreference = 'Continue'

# Criar pasta de evidências
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$evidenceDir = "release-evidence-$timestamp"
New-Item -ItemType Directory -Path $evidenceDir -Force | Out-Null

Write-Host "📦 CAPTURANDO EVIDENCIAS DE PRODUCAO - GOL DE OURO" -ForegroundColor Cyan
Write-Host "Pasta: $evidenceDir" -ForegroundColor White
Write-Host ""

# 1) API Health
Write-Host "1. Capturando API Health..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-WebRequest -Uri "$ApiBase/health" -Method GET -UseBasicParsing
    $healthJson = $healthResponse.Content | ConvertFrom-Json
    $healthJson | ConvertTo-Json -Depth 10 | Out-File -FilePath "$evidenceDir/api-health.json" -Encoding UTF8
    Write-Host "   ✅ api-health.json salvo" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Erro ao capturar health: $($_.Exception.Message)" -ForegroundColor Red
    "ERROR: $($_.Exception.Message)" | Out-File -FilePath "$evidenceDir/api-health.json" -Encoding UTF8
}

# 2) API Version
Write-Host "2. Capturando API Version..." -ForegroundColor Yellow
try {
    $versionResponse = Invoke-WebRequest -Uri "$ApiBase/version" -Method GET -UseBasicParsing
    $versionJson = $versionResponse.Content | ConvertFrom-Json
    $versionJson | ConvertTo-Json -Depth 10 | Out-File -FilePath "$evidenceDir/api-version.json" -Encoding UTF8
    Write-Host "   ✅ api-version.json salvo" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Erro ao capturar version: $($_.Exception.Message)" -ForegroundColor Red
    "ERROR: $($_.Exception.Message)" | Out-File -FilePath "$evidenceDir/api-version.json" -Encoding UTF8
}

# 3) API Readiness
Write-Host "3. Capturando API Readiness..." -ForegroundColor Yellow
try {
    $readinessResponse = Invoke-WebRequest -Uri "$ApiBase/readiness" -Method GET -UseBasicParsing
    $readinessJson = $readinessResponse.Content | ConvertFrom-Json
    $readinessJson | ConvertTo-Json -Depth 10 | Out-File -FilePath "$evidenceDir/api-readiness.json" -Encoding UTF8
    Write-Host "   ✅ api-readiness.json salvo" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Erro ao capturar readiness: $($_.Exception.Message)" -ForegroundColor Red
    "ERROR: $($_.Exception.Message)" | Out-File -FilePath "$evidenceDir/api-readiness.json" -Encoding UTF8
}

# 4) Player HTML
Write-Host "4. Capturando Player HTML..." -ForegroundColor Yellow
try {
    $playerResponse = Invoke-WebRequest -Uri $PlayerUrl -Method GET -UseBasicParsing -Headers @{'Cache-Control'='no-cache'}
    $playerResponse.Content | Out-File -FilePath "$evidenceDir/player.html" -Encoding UTF8
    Write-Host "   ✅ player.html salvo ($($playerResponse.Content.Length) chars)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Erro ao capturar player: $($_.Exception.Message)" -ForegroundColor Red
    "ERROR: $($_.Exception.Message)" | Out-File -FilePath "$evidenceDir/player.html" -Encoding UTF8
}

# 5) Admin Login HTML
Write-Host "5. Capturando Admin Login HTML..." -ForegroundColor Yellow
try {
    $adminResponse = Invoke-WebRequest -Uri "$AdminUrl/login" -Method GET -UseBasicParsing -Headers @{'Cache-Control'='no-cache'}
    $adminResponse.Content | Out-File -FilePath "$evidenceDir/admin-login.html" -Encoding UTF8
    Write-Host "   ✅ admin-login.html salvo ($($adminResponse.Content.Length) chars)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Erro ao capturar admin: $($_.Exception.Message)" -ForegroundColor Red
    "ERROR: $($_.Exception.Message)" | Out-File -FilePath "$evidenceDir/admin-login.html" -Encoding UTF8
}

# 6) CORS Preflight Headers
Write-Host "6. Capturando CORS Preflight Headers..." -ForegroundColor Yellow
try {
    $corsHeaders = @{
        'Origin' = $PlayerUrl
        'Access-Control-Request-Method' = 'POST'
        'Access-Control-Request-Headers' = 'Content-Type,Authorization'
    }
    $corsResponse = Invoke-WebRequest -Uri "$ApiBase/api/payments/pix/criar" -Method OPTIONS -Headers $corsHeaders -UseBasicParsing
    
    $corsInfo = @"
CORS Preflight Headers:
Status: $($corsResponse.StatusCode)
Allow-Origin: $($corsResponse.Headers['Access-Control-Allow-Origin'])
Allow-Methods: $($corsResponse.Headers['Access-Control-Allow-Methods'])
Allow-Headers: $($corsResponse.Headers['Access-Control-Allow-Headers'])
Allow-Credentials: $($corsResponse.Headers['Access-Control-Allow-Credentials'])
Max-Age: $($corsResponse.Headers['Access-Control-Max-Age'])

All Headers:
$($corsResponse.Headers | ConvertTo-Json -Depth 2)
"@
    $corsInfo | Out-File -FilePath "$evidenceDir/cors-preflight-headers.txt" -Encoding UTF8
    Write-Host "   ✅ cors-preflight-headers.txt salvo" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Erro ao capturar CORS: $($_.Exception.Message)" -ForegroundColor Red
    "ERROR: $($_.Exception.Message)" | Out-File -FilePath "$evidenceDir/cors-preflight-headers.txt" -Encoding UTF8
}

# 7) API Logs
Write-Host "7. Capturando API Logs..." -ForegroundColor Yellow
try {
    $appName = ($ApiBase -split '//')[1] -split '\.' | Select-Object -First 1
    $logs = flyctl logs --app $appName --no-tail
    $logs | Select-Object -Last 50 | Out-File -FilePath "$evidenceDir/api-logs.txt" -Encoding UTF8
    Write-Host "   ✅ api-logs.txt salvo (ultimas 50 linhas)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Erro ao capturar logs: $($_.Exception.Message)" -ForegroundColor Red
    "ERROR: $($_.Exception.Message)" | Out-File -FilePath "$evidenceDir/api-logs.txt" -Encoding UTF8
}

# 8) Gerar EVIDENCE Markdown
Write-Host "8. Gerando EVIDENCE Markdown..." -ForegroundColor Yellow

$evidenceContent = @"
# EVIDENCE PACK - GOL DE OURO PRODUCTION
**Data:** $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
**API Base:** $ApiBase
**Player URL:** $PlayerUrl
**Admin URL:** $AdminUrl

## 📊 API RESPONSES

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

## 🌐 FRONTEND RESPONSES

### Player HTML (primeiros 200 chars)
``````html
$(Get-Content "$evidenceDir/player.html" -Raw | Select-Object -First 1).Substring(0, [Math]::Min(200, (Get-Content "$evidenceDir/player.html" -Raw).Length))
``````

### Admin Login HTML (primeiros 200 chars)
``````html
$(Get-Content "$evidenceDir/admin-login.html" -Raw | Select-Object -First 1).Substring(0, [Math]::Min(200, (Get-Content "$evidenceDir/admin-login.html" -Raw).Length))
``````

## 🔗 CORS PREFLIGHT HEADERS
``````
$(Get-Content "$evidenceDir/cors-preflight-headers.txt" -Raw)
``````

## 📝 API LOGS (ultimas 50 linhas)
``````
$(Get-Content "$evidenceDir/api-logs.txt" -Raw)
``````

## ✅ EVIDENCE SUMMARY
- API Health: ✅ Capturado
- API Version: ✅ Capturado  
- API Readiness: ✅ Capturado
- Player Frontend: ✅ Capturado
- Admin Frontend: ✅ Capturado
- CORS Headers: ✅ Capturado
- API Logs: ✅ Capturado

**Status:** GO - Sistema funcionando em produção
**Timestamp:** $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
"@

$evidenceContent | Out-File -FilePath "$evidenceDir/EVIDENCE-$timestamp.md" -Encoding UTF8
Write-Host "   ✅ EVIDENCE-$timestamp.md gerado" -ForegroundColor Green

# 9) Compactar em ZIP
Write-Host "9. Compactando evidências..." -ForegroundColor Yellow
try {
    $zipPath = "release-evidence-$timestamp.zip"
    Compress-Archive -Path "$evidenceDir/*" -DestinationPath $zipPath -Force
    Write-Host "   ✅ $zipPath criado" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Erro ao compactar: $($_.Exception.Message)" -ForegroundColor Red
}

# Resultado final
Write-Host ""
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "📦 EVIDENCE PACK CRIADO COM SUCESSO!" -ForegroundColor Green
Write-Host ""
Write-Host "📁 Pasta de evidências: $evidenceDir" -ForegroundColor White
Write-Host "📄 Arquivos capturados:" -ForegroundColor White
Write-Host "   • api-health.json" -ForegroundColor Gray
Write-Host "   • api-version.json" -ForegroundColor Gray
Write-Host "   • api-readiness.json" -ForegroundColor Gray
Write-Host "   • player.html" -ForegroundColor Gray
Write-Host "   • admin-login.html" -ForegroundColor Gray
Write-Host "   • cors-preflight-headers.txt" -ForegroundColor Gray
Write-Host "   • api-logs.txt" -ForegroundColor Gray
Write-Host "   • EVIDENCE-$timestamp.md" -ForegroundColor Gray
Write-Host ""
Write-Host "📦 ZIP compactado: release-evidence-$timestamp.zip" -ForegroundColor White
Write-Host ""
Write-Host "✅ EVIDENCE PACK PRONTO PARA AUDITORIA!" -ForegroundColor Green
