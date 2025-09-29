# scripts/diagnostico-producao.ps1 - Diagnóstico rápido de produção
Write-Host "=== DIAGNÓSTICO PRODUÇÃO - GOL DE OURO ===" -ForegroundColor Red

# URLs de produção
$ApiBase = "https://goldeouro-backend-v2.fly.dev"
$PlayerUrl = "https://goldeouro.lol"
$AdminUrl = "https://admin.goldeouro.lol"

Write-Host "🔍 Verificando status dos serviços..." -ForegroundColor Yellow

# 1) Backend API
try {
  $response = Invoke-WebRequest "$ApiBase/health" -UseBasicParsing -TimeoutSec 10
  if ($response.StatusCode -eq 200) {
    Write-Host "✅ Backend API: OK ($($response.StatusCode))" -ForegroundColor Green
  } else {
    Write-Host "❌ Backend API: FALHA ($($response.StatusCode))" -ForegroundColor Red
  }
} catch {
  Write-Host "❌ Backend API: OFFLINE - $($_.Exception.Message)" -ForegroundColor Red
}

# 2) Player
try {
  $response = Invoke-WebRequest $PlayerUrl -UseBasicParsing -TimeoutSec 10
  if ($response.StatusCode -eq 200) {
    Write-Host "✅ Player: OK ($($response.StatusCode))" -ForegroundColor Green
  } else {
    Write-Host "❌ Player: FALHA ($($response.StatusCode))" -ForegroundColor Red
  }
} catch {
  Write-Host "❌ Player: OFFLINE - $($_.Exception.Message)" -ForegroundColor Red
}

# 3) Admin
try {
  $response = Invoke-WebRequest $AdminUrl -UseBasicParsing -TimeoutSec 10
  if ($response.StatusCode -eq 200) {
    Write-Host "✅ Admin: OK ($($response.StatusCode))" -ForegroundColor Green
  } else {
    Write-Host "❌ Admin: FALHA ($($response.StatusCode))" -ForegroundColor Red
  }
} catch {
  Write-Host "❌ Admin: OFFLINE - $($_.Exception.Message)" -ForegroundColor Red
}

# 4) Verificar se está usando dados de produção
Write-Host "`n🔍 Verificando configurações de produção..." -ForegroundColor Yellow

# Verificar se o backend está rodando em modo produção
try {
  $response = Invoke-WebRequest "$ApiBase/version" -UseBasicParsing -TimeoutSec 10
  Write-Host "📋 Versão do backend: $($response.Content)" -ForegroundColor Cyan
} catch {
  Write-Host "⚠️ Não foi possível verificar versão do backend" -ForegroundColor Yellow
}

Write-Host "`n🚨 PROBLEMAS IDENTIFICADOS:" -ForegroundColor Red
Write-Host "1. Dados fictícios no painel de controle" -ForegroundColor Yellow
Write-Host "2. PIX não está funcionando" -ForegroundColor Yellow
Write-Host "3. Redirecionamento para login em /game" -ForegroundColor Yellow
Write-Host "4. Deploy pode estar usando configurações de desenvolvimento" -ForegroundColor Yellow

Write-Host "`n🔧 PRÓXIMOS PASSOS:" -ForegroundColor Green
Write-Host "1. Verificar variáveis de ambiente do backend" -ForegroundColor White
Write-Host "2. Verificar configuração do banco de dados" -ForegroundColor White
Write-Host "3. Verificar configuração do Mercado Pago" -ForegroundColor White
Write-Host "4. Fazer deploy correto com configurações de produção" -ForegroundColor White
