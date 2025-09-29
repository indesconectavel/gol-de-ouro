# scripts/verificacao-real.ps1 - Verificação real sem falsos positivos
Write-Host "=== VERIFICAÇÃO REAL - SEM FALSOS POSITIVOS ===" -ForegroundColor Red
Write-Host ""

$ApiBase = "https://goldeouro-backend-v2.fly.dev"
$PlayerUrl = "https://goldeouro.lol"
$AdminUrl = "https://admin.goldeouro.lol"

$problemas = @()
$sucessos = @()

Write-Host "🔍 1. TESTANDO CONECTIVIDADE REAL..." -ForegroundColor Cyan

# Backend
try {
  $response = Invoke-WebRequest "$ApiBase/health" -UseBasicParsing -TimeoutSec 5
  if ($response.StatusCode -eq 200) {
    $sucessos += "Backend API: ONLINE"
  } else {
    $problemas += "Backend API: Status $($response.StatusCode)"
  }
} catch {
  $problemas += "Backend API: OFFLINE"
}

# Player
try {
  $response = Invoke-WebRequest $PlayerUrl -UseBasicParsing -TimeoutSec 5
  if ($response.StatusCode -eq 200) {
    $sucessos += "Player: ONLINE"
  } else {
    $problemas += "Player: Status $($response.StatusCode)"
  }
} catch {
  $problemas += "Player: OFFLINE"
}

# Admin
try {
  $response = Invoke-WebRequest $AdminUrl -UseBasicParsing -TimeoutSec 5
  if ($response.StatusCode -eq 200) {
    $sucessos += "Admin: ONLINE"
  } else {
    $problemas += "Admin: Status $($response.StatusCode)"
  }
} catch {
  $problemas += "Admin: OFFLINE"
}

Write-Host "`n🔍 2. VERIFICANDO VARIÁVEIS DE AMBIENTE..." -ForegroundColor Cyan

$secrets = flyctl secrets list 2>$null

if ($secrets -match "DATABASE_URL") {
  $sucessos += "DATABASE_URL: Configurada"
} else {
  $problemas += "DATABASE_URL: FALTANDO (CRÍTICO)"
}

if ($secrets -match "MP_ACCESS_TOKEN") {
  $sucessos += "MP_ACCESS_TOKEN: Configurado"
} else {
  $problemas += "MP_ACCESS_TOKEN: FALTANDO (CRÍTICO)"
}

if ($secrets -match "MP_PUBLIC_KEY") {
  $sucessos += "MP_PUBLIC_KEY: Configurada"
} else {
  $problemas += "MP_PUBLIC_KEY: FALTANDO (CRÍTICO)"
}

Write-Host "`n🔍 3. TESTANDO FUNCIONALIDADES REAIS..." -ForegroundColor Cyan

# Teste de PIX
try {
  $pixData = '{"amount":1,"description":"Teste Real"}'
  $response = Invoke-WebRequest "$ApiBase/payments/create" -Method POST -Body $pixData -ContentType "application/json" -UseBasicParsing -TimeoutSec 5
  if ($response.StatusCode -eq 200) {
    $sucessos += "PIX: Funcionando"
  } else {
    $problemas += "PIX: Falha ($($response.StatusCode))"
  }
} catch {
  $problemas += "PIX: Erro - $($_.Exception.Message)"
}

# Teste de usuários
try {
  $response = Invoke-WebRequest "$ApiBase/users" -UseBasicParsing -TimeoutSec 5
  if ($response.StatusCode -eq 200) {
    $sucessos += "Users: Funcionando"
  } else {
    $problemas += "Users: Falha ($($response.StatusCode))"
  }
} catch {
  $problemas += "Users: Erro - $($_.Exception.Message)"
}

Write-Host "`n🚨 RELATÓRIO FINAL:" -ForegroundColor Red
Write-Host "==================" -ForegroundColor Red

if ($problemas.Count -gt 0) {
  Write-Host "`n❌ PROBLEMAS ENCONTRADOS ($($problemas.Count)):" -ForegroundColor Red
  foreach ($problema in $problemas) {
    Write-Host "   $problema" -ForegroundColor Yellow
  }
} else {
  Write-Host "`n✅ NENHUM PROBLEMA ENCONTRADO!" -ForegroundColor Green
}

if ($sucessos.Count -gt 0) {
  Write-Host "`n✅ FUNCIONALIDADES CONFIRMADAS ($($sucessos.Count)):" -ForegroundColor Green
  foreach ($sucesso in $sucessos) {
    Write-Host "   $sucesso" -ForegroundColor White
  }
}

Write-Host "`n📊 RESUMO:" -ForegroundColor Cyan
Write-Host "   Total: $($problemas.Count + $sucessos.Count)" -ForegroundColor White
Write-Host "   Problemas: $($problemas.Count)" -ForegroundColor Red
Write-Host "   Sucessos: $($sucessos.Count)" -ForegroundColor Green

if ($problemas.Count -gt 0) {
  Write-Host "`n🔧 AÇÕES NECESSÁRIAS:" -ForegroundColor Yellow
  Write-Host "1. Configurar variáveis faltantes" -ForegroundColor White
  Write-Host "2. Corrigir funcionalidades quebradas" -ForegroundColor White
  Write-Host "3. Fazer deploy correto" -ForegroundColor White
} else {
  Write-Host "`n🎉 SISTEMA REALMENTE PRONTO!" -ForegroundColor Green
}
