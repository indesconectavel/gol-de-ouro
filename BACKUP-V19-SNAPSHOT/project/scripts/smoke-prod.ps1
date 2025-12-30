# scripts/smoke-prod.ps1 - Smoke Test de Produção
Param(
  [Parameter(Mandatory=$true)][string]$ApiBase,
  [Parameter(Mandatory=$true)][string]$PlayerUrl,
  [Parameter(Mandatory=$true)][string]$AdminUrl
)

Write-Host "== SMOKE PROD ==" -ForegroundColor Cyan

# API /health
try {
  $h = (Invoke-WebRequest "$ApiBase/health" -UseBasicParsing -TimeoutSec 10).Content
  if ($h -notmatch '"ok":\s*true') { throw "Conteúdo inesperado: $h" }
  Write-Host "API /health ................. OK" -ForegroundColor Green
} catch { Write-Error "API /health FAIL: $_"; exit 1 }

# Player online
try {
  $p = (Invoke-WebRequest $PlayerUrl -UseBasicParsing -TimeoutSec 10).StatusCode
  if ($p -ne 200) { throw "HTTP $p" }
  Write-Host "Player online (200) ......... OK" -ForegroundColor Green
} catch { Write-Error "Player FAIL: $_"; exit 1 }

# Admin /login direto (SPA fallback)
try {
  $a = (Invoke-WebRequest "$AdminUrl/login" -UseBasicParsing -TimeoutSec 10).StatusCode
  if ($a -ne 200) { throw "HTTP $a" }
  Write-Host "Admin /login (200) .......... OK" -ForegroundColor Green
} catch { Write-Error "Admin /login FAIL: $_"; exit 1 }

Write-Host "[SMOKE] OK" -ForegroundColor Green