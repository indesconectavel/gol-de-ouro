# Gol de Ouro Backend - Smoke Test
# ===================================
# 
# INSTRUÇÕES:
# 1. Certifique-se de que o backend está rodando (npm start)
# 2. Execute: .\scripts\smoke.ps1 -AdminToken "seu_token_aqui"
# 3. Ou configure: $env:ADMIN_TOKEN="seu_token_aqui"
# 
# ROTAS TESTADAS:
# - GET / (rota raiz - pública - esperado: 200)
# - GET /admin/lista-usuarios (protegida - esperado: 403 sem token, 200 com token)
# - GET /health (rota de saúde - esperado: 200)

param([string]$API = "http://localhost:3000")

$ProgressPreference = 'SilentlyContinue'

Write-Host "Health..." -ForegroundColor Cyan
$h = Invoke-WebRequest -Uri "$API/health" -TimeoutSec 30 -Method GET
Write-Host "HEALTH: $($h.StatusCode) $($h.StatusDescription)" -ForegroundColor Green

Write-Host "Dashboard..." -ForegroundColor Cyan
$d = Invoke-WebRequest -Uri "$API/api/public/dashboard" -TimeoutSec 30 -Method GET
Write-Host "DASHBOARD: $($d.StatusCode) $($d.StatusDescription)" -ForegroundColor Green
