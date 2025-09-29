# scripts/audit-prod-final.ps1 - Auditoria Final de Produção
Param(
  [Parameter(Mandatory=$true)][string]$ApiBase,
  [Parameter(Mandatory=$true)][string]$PlayerUrl,
  [Parameter(Mandatory=$true)][string]$AdminUrl
)

Write-Host "== AUDITORIA FINAL ==" -ForegroundColor Cyan
function Check($name, $script) {
  try { & $script; Write-Host "$name OK" -ForegroundColor Green }
  catch { Write-Error "$name FAIL: $_"; exit 1 }
}

# 1) Health
Check "[API] /health" { 
  $h=(Invoke-WebRequest "$ApiBase/health" -UseBasicParsing -TimeoutSec 10).Content
  if ($h -notmatch '"ok":\s*true') { throw "Conteúdo inesperado: $h" }
}

# 2) Admin /login direto (SPA)
Check "[ADMIN] /login 200" {
  $s=(Invoke-WebRequest "$AdminUrl/login" -UseBasicParsing -TimeoutSec 10).StatusCode
  if ($s -ne 200){ throw "HTTP $s" }
}

# 3) Player 200
Check "[PLAYER] 200" {
  $s=(Invoke-WebRequest $PlayerUrl -UseBasicParsing -TimeoutSec 10).StatusCode
  if ($s -ne 200){ throw "HTTP $s" }
}

# 4) Headers Helmet
Check "[SEC] Helmet headers" {
  $r=Invoke-WebRequest "$ApiBase/health" -UseBasicParsing -TimeoutSec 10 -Headers @{"Accept"="application/json"}
  if (-not ($r.Headers["X-Content-Type-Options"])) { throw "Missing X-Content-Type-Options" }
}

# 5) CORS/preflight em /payments/create
Check "[CORS] Preflight" {
  $req=[System.Net.WebRequest]::Create("$ApiBase/payments/create")
  $req.Method="OPTIONS"
  $req.Headers.Add("Origin",$PlayerUrl)
  $req.Headers.Add("Access-Control-Request-Method","POST")
  $req.Headers.Add("Access-Control-Request-Headers","content-type,authorization,x-idempotency-key")
  try { $resp=$req.GetResponse() } catch { $resp=$_.Exception.Response }
  if (-not $resp) { throw "Sem resposta" }
  if (-not $resp.Headers["Access-Control-Allow-Origin"]) { throw "Sem ACAO" }
  $resp.Close()
}

# 6) /version
Check "[API] /version" {
  $v=(Invoke-WebRequest "$ApiBase/version" -UseBasicParsing -TimeoutSec 10).Content
  if ($v -notmatch '"version"') { throw "/version inválido: $v" }
}

Write-Host "[AUDIT] Health/Admin/Player/CORS/Helmet/Version ... OK" -ForegroundColor Green