# READ-ONLY: Executa coleta final E2E e grava em docs/relatorios/final-*.json
# Nao altera codigo, deploy, envs. PowerShell-friendly.
$ErrorActionPreference = "Continue"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent $scriptDir
$relatorios = Join-Path $root "docs\relatorios"
$ts = Get-Date -Format "yyyy-MM-dd"

Push-Location $root

# A1/A2 - Fingerprint frontend
$env:OUT_FILE = Join-Path $relatorios "final-game-fingerprint.json"
node (Join-Path $scriptDir "investigate-game-fingerprint-readonly.js") 2>&1 | Out-Null

# B - Fly snapshot (script grava com nome fixo; copiamos para final)
node (Join-Path $scriptDir "audit-fly-snapshot-readonly.js") 2>&1 | Out-Null
$flySrc = Join-Path $relatorios "auditoria-fly-snapshot-$ts.json"
if (Test-Path $flySrc) {
  $flyContent = Get-Content $flySrc -Raw
  Set-Content (Join-Path $relatorios "final-fly-snapshot.json") $flyContent -Encoding UTF8
}

# C - Schema final
node (Join-Path $scriptDir "final-schema-check-readonly.js") 2>&1 | Out-Null

# D - Endpoints financeiros
node (Join-Path $scriptDir "final-finance-endpoints-readonly.js") 2>&1 | Out-Null

# E - Depositos PIX (script existente grava com data; copiamos para final)
node (Join-Path $scriptDir "prova-depositos-pix-readonly.js") 2>&1 | Out-Null
$depSrc = Join-Path $relatorios "prova-depositos-pix-readonly-$ts.json"
if (Test-Path $depSrc) {
  Copy-Item $depSrc (Join-Path $relatorios "final-depositos-check.json") -Force
}

# F - Saques + Worker logs
node (Join-Path $scriptDir "final-saques-check-readonly.js") 2>&1 | Out-Null
node (Join-Path $scriptDir "final-worker-logs-check-readonly.js") 2>&1 | Out-Null

# G - Ledger 24h/7d/30d
node (Join-Path $scriptDir "final-ledger-check-readonly.js") 2>&1 | Out-Null

# H - Saldo (script existente grava com data; copiamos para final)
node (Join-Path $scriptDir "prova-saldo-persistencia-readonly.js") 2>&1 | Out-Null
$saldoSrc = Join-Path $relatorios "prova-saldo-persistencia-$ts.json"
if (Test-Path $saldoSrc) {
  Copy-Item $saldoSrc (Join-Path $relatorios "final-saldo-check.json") -Force
}

Pop-Location
Write-Host "Coleta final E2E read-only concluida. Verifique docs\relatorios\final-*.json"
