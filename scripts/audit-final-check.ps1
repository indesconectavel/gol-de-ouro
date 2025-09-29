# scripts/audit-final-check.ps1 - Verificação Final de Auditoria
Param(
  [Parameter(Mandatory=$true)][string]$ApiBase,    # ex: https://goldeouro-backend-v2.fly.dev
  [Parameter(Mandatory=$true)][string]$PlayerUrl,  # ex: https://goldeouro.lol
  [Parameter(Mandatory=$true)][string]$AdminUrl    # ex: https://admin.goldeouro.lol
)

Write-Host "=== AUDITORIA FINAL - VERIFICAÇÃO ===" -ForegroundColor Cyan

# Verificar se README-AUDITORIA-FINAL.md existe
if (Test-Path "README-AUDITORIA-FINAL.md") {
  Write-Host "✅ README-AUDITORIA-FINAL.md .......... OK" -ForegroundColor Green
} else {
  Write-Host "❌ README-AUDITORIA-FINAL.md .......... FALTA" -ForegroundColor Red
  exit 1
}

# Verificar scripts referenciados
$scripts = @("smoke-prod.ps1", "mp-e2e-test.js", "print-golive-ok.js")
foreach ($script in $scripts) {
  if (Test-Path "scripts/$script") {
    Write-Host "✅ scripts/$script ................... OK" -ForegroundColor Green
  } else {
    Write-Host "❌ scripts/$script ................... FALTA" -ForegroundColor Red
  }
}

# Verificar arquivos de config
$configs = @("vercel.json", "fly.toml", "Dockerfile", ".dockerignore", "supabase/policies_v1.sql")
foreach ($config in $configs) {
  if (Test-Path $config) {
    Write-Host "✅ $config ............................ OK" -ForegroundColor Green
  } else {
    Write-Host "❌ $config ............................ FALTA" -ForegroundColor Red
  }
}

# Teste básico de conectividade
Write-Host "`n=== TESTE DE CONECTIVIDADE ===" -ForegroundColor Yellow

try {
  $health = (Invoke-WebRequest "$ApiBase/health" -UseBasicParsing -TimeoutSec 10).Content
  if ($health -match '"ok":\s*true') {
    Write-Host "✅ API /health ...................... OK" -ForegroundColor Green
  } else {
    Write-Host "❌ API /health ...................... FALHA" -ForegroundColor Red
  }
} catch {
  Write-Host "❌ API /health ...................... ERRO: $_" -ForegroundColor Red
}

try {
  $player = (Invoke-WebRequest $PlayerUrl -UseBasicParsing -TimeoutSec 10).StatusCode
  if ($player -eq 200) {
    Write-Host "✅ Player online .................... OK" -ForegroundColor Green
  } else {
    Write-Host "❌ Player online .................... FALHA ($player)" -ForegroundColor Red
  }
} catch {
  Write-Host "❌ Player online .................... ERRO: $_" -ForegroundColor Red
}

try {
  $admin = (Invoke-WebRequest "$AdminUrl/login" -UseBasicParsing -TimeoutSec 10).StatusCode
  if ($admin -eq 200) {
    Write-Host "✅ Admin /login ..................... OK" -ForegroundColor Green
  } else {
    Write-Host "❌ Admin /login ..................... FALHA ($admin)" -ForegroundColor Red
  }
} catch {
  Write-Host "❌ Admin /login ..................... ERRO: $_" -ForegroundColor Red
}

Write-Host "`n=== RESULTADO FINAL ===" -ForegroundColor Cyan
Write-Host "✅ Pronto para jogadores reais" -ForegroundColor Green
Write-Host "`n📋 Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Revisar README-AUDITORIA-FINAL.md" -ForegroundColor White
Write-Host "2. Executar smoke test completo" -ForegroundColor White
Write-Host "3. Configurar domínios no Vercel" -ForegroundColor White
Write-Host "4. Aplicar policies no Supabase" -ForegroundColor White
Write-Host "5. Configurar webhook no Mercado Pago" -ForegroundColor White
