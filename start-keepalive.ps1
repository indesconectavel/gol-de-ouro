# START KEEP-ALIVE - Gol de Ouro Backend
# Script PowerShell para iniciar o keep-alive facilmente

param(
    [string]$Environment = "prod",
    [switch]$Help
)

if ($Help) {
    Write-Host "🚀 KEEP-ALIVE - Gol de Ouro Backend" -ForegroundColor Green
    Write-Host ""
    Write-Host "Uso: .\start-keepalive.ps1 [Environment]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Environments disponíveis:" -ForegroundColor Cyan
    Write-Host "  local  - Backend local (http://localhost:3000)" -ForegroundColor White
    Write-Host "  prod   - Backend produção (https://goldeouro-backend.onrender.com)" -ForegroundColor White
    Write-Host ""
    Write-Host "Exemplos:" -ForegroundColor Cyan
    Write-Host "  .\start-keepalive.ps1 local" -ForegroundColor White
    Write-Host "  .\start-keepalive.ps1 prod" -ForegroundColor White
    Write-Host "  .\start-keepalive.ps1 -Help" -ForegroundColor White
    exit 0
}

Write-Host "🚀 INICIANDO KEEP-ALIVE - GOL DE OURO BACKEND" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green

# Verificar se o Node.js está instalado
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js encontrado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js não encontrado! Instale o Node.js primeiro." -ForegroundColor Red
    exit 1
}

# Verificar se o arquivo keep-alive.js existe
if (-not (Test-Path "keep-alive.js")) {
    Write-Host "❌ Arquivo keep-alive.js não encontrado!" -ForegroundColor Red
    exit 1
}

# Configurar URL baseada no ambiente
$backendUrl = switch ($Environment.ToLower()) {
    "local" { 
        Write-Host "🏠 Ambiente: LOCAL" -ForegroundColor Cyan
        "http://localhost:3000"
    }
    "prod" { 
        Write-Host "🌐 Ambiente: PRODUÇÃO" -ForegroundColor Cyan
        "https://goldeouro-backend.onrender.com"
    }
    default { 
        Write-Host "❌ Ambiente inválido: $Environment" -ForegroundColor Red
        Write-Host "Use 'local' ou 'prod'" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "🔗 Backend URL: $backendUrl" -ForegroundColor Cyan
Write-Host ""

# Testar conectividade antes de iniciar
Write-Host "🔍 Testando conectividade..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$backendUrl/api/health" -TimeoutSec 10 -ErrorAction Stop
    Write-Host "✅ Backend respondendo: $($response.status)" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Backend não respondeu, mas keep-alive será iniciado mesmo assim" -ForegroundColor Yellow
    Write-Host "   Erro: $($_.Exception.Message)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "🚀 Iniciando keep-alive..." -ForegroundColor Green
Write-Host "💡 Pressione Ctrl+C para parar" -ForegroundColor Yellow
Write-Host ""

# Iniciar o keep-alive
$env:BACKEND_URL = $backendUrl
node keep-alive.js
