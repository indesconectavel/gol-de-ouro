# scripts/auditoria-minuciosa-falsos-positivos.ps1 - Análise minuciosa dos falsos positivos
Write-Host "=== AUDITORIA MINUCIOSA - FALSOS POSITIVOS ===" -ForegroundColor Red
Write-Host ""

$ApiBase = "https://goldeouro-backend-v2.fly.dev"
$PlayerUrl = "https://goldeouro.lol"
$AdminUrl = "https://admin.goldeouro.lol"

Write-Host "🔍 1. VERIFICANDO CONFIGURAÇÕES REAIS DO FLY.IO:" -ForegroundColor Cyan
$secrets = flyctl secrets list 2>$null
Write-Host "Secrets configurados:" -ForegroundColor White
Write-Host "$secrets" -ForegroundColor White

Write-Host "`n🔍 2. TESTANDO BACKEND REAL (SEM FALSOS POSITIVOS):" -ForegroundColor Cyan

# Health check real
try {
  $response = Invoke-WebRequest "$ApiBase/health" -UseBasicParsing -TimeoutSec 5
  Write-Host "Health Status: $($response.StatusCode)" -ForegroundColor Green
  $healthData = $response.Content | ConvertFrom-Json
  Write-Host "Health Data: $($healthData)" -ForegroundColor White
} catch {
  Write-Host "Health ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

# Version check real
try {
  $response = Invoke-WebRequest "$ApiBase/version" -UseBasicParsing -TimeoutSec 5
  Write-Host "Version Status: $($response.StatusCode)" -ForegroundColor Green
  $versionData = $response.Content | ConvertFrom-Json
  Write-Host "Version Data: $($versionData)" -ForegroundColor White
} catch {
  Write-Host "Version ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🔍 3. TESTANDO CADASTRO REAL (COMO JOGADOR):" -ForegroundColor Cyan
try {
  $userData = @{
    name = "Jogador Real Teste"
    email = "jogador.real@example.com"
    password = "senha123456"
  } | ConvertTo-Json
  
  $response = Invoke-WebRequest "$ApiBase/auth/register" -Method POST -Body $userData -ContentType "application/json" -UseBasicParsing -TimeoutSec 10
  Write-Host "Cadastro Status: $($response.StatusCode)" -ForegroundColor Green
  Write-Host "Cadastro Response: $($response.Content)" -ForegroundColor White
  
  if ($response.StatusCode -eq 201 -or $response.StatusCode -eq 200) {
    Write-Host "✅ CADASTRO REAL: FUNCIONANDO" -ForegroundColor Green
  } else {
    Write-Host "❌ CADASTRO REAL: FALHANDO" -ForegroundColor Red
  }
} catch {
  Write-Host "❌ CADASTRO REAL: ERRO - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🔍 4. TESTANDO LOGIN REAL (COMO JOGADOR):" -ForegroundColor Cyan
try {
  $loginData = @{
    email = "jogador.real@example.com"
    password = "senha123456"
  } | ConvertTo-Json
  
  $response = Invoke-WebRequest "$ApiBase/auth/login" -Method POST -Body $loginData -ContentType "application/json" -UseBasicParsing -TimeoutSec 10
  Write-Host "Login Status: $($response.StatusCode)" -ForegroundColor Green
  Write-Host "Login Response: $($response.Content)" -ForegroundColor White
  
  if ($response.StatusCode -eq 200) {
    $loginResponse = $response.Content | ConvertFrom-Json
    if ($loginResponse.token -or $loginResponse.access_token) {
      Write-Host "✅ LOGIN REAL: FUNCIONANDO (token recebido)" -ForegroundColor Green
      $token = $loginResponse.token -or $loginResponse.access_token
    } else {
      Write-Host "❌ LOGIN REAL: FALHANDO (sem token)" -ForegroundColor Red
    }
  } else {
    Write-Host "❌ LOGIN REAL: FALHANDO" -ForegroundColor Red
  }
} catch {
  Write-Host "❌ LOGIN REAL: ERRO - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🔍 5. TESTANDO PIX REAL (COMO JOGADOR):" -ForegroundColor Cyan
try {
  $pixData = @{
    amount = 10
    user_id = 1
    description = "Depósito para jogar"
  } | ConvertTo-Json
  
  $response = Invoke-WebRequest "$ApiBase/api/payments/pix/criar" -Method POST -Body $pixData -ContentType "application/json" -UseBasicParsing -TimeoutSec 10
  Write-Host "PIX Status: $($response.StatusCode)" -ForegroundColor Green
  Write-Host "PIX Response: $($response.Content)" -ForegroundColor White
  
  if ($response.StatusCode -eq 200) {
    $pixResponse = $response.Content | ConvertFrom-Json
    if ($pixResponse.init_point -or $pixResponse.qr_code -or $pixResponse.payment_link) {
      Write-Host "✅ PIX REAL: FUNCIONANDO (link gerado)" -ForegroundColor Green
    } else {
      Write-Host "❌ PIX REAL: FALHANDO (sem link real)" -ForegroundColor Red
    }
  } else {
    Write-Host "❌ PIX REAL: FALHANDO" -ForegroundColor Red
  }
} catch {
  Write-Host "❌ PIX REAL: ERRO - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🔍 6. TESTANDO FRONTEND REAL:" -ForegroundColor Cyan

# Player frontend
try {
  $response = Invoke-WebRequest $PlayerUrl -UseBasicParsing -TimeoutSec 5
  Write-Host "Player Status: $($response.StatusCode)" -ForegroundColor Green
  
  if ($response.StatusCode -eq 200) {
    $content = $response.Content
    if ($content -match "login" -or $content -match "Login") {
      Write-Host "✅ Player: Página de login detectada" -ForegroundColor Green
    } else {
      Write-Host "❌ Player: Página de login NÃO detectada" -ForegroundColor Red
    }
    
    if ($content -match "register" -or $content -match "Register" -or $content -match "cadastro") {
      Write-Host "✅ Player: Página de cadastro detectada" -ForegroundColor Green
    } else {
      Write-Host "❌ Player: Página de cadastro NÃO detectada" -ForegroundColor Red
    }
  }
} catch {
  Write-Host "❌ Player: ERRO - $($_.Exception.Message)" -ForegroundColor Red
}

# Página /game
try {
  $response = Invoke-WebRequest "$PlayerUrl/game" -UseBasicParsing -TimeoutSec 5
  Write-Host "Game Status: $($response.StatusCode)" -ForegroundColor Green
  
  if ($response.StatusCode -eq 200) {
    $content = $response.Content
    if ($content -match "game" -or $content -match "jogo" -or $content -match "shoot") {
      Write-Host "✅ Game: Página do jogo detectada" -ForegroundColor Green
    } else {
      Write-Host "❌ Game: Página do jogo NÃO detectada" -ForegroundColor Red
    }
  }
} catch {
  Write-Host "❌ Game: ERRO - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🔍 7. VERIFICANDO DADOS REAIS NO BANCO:" -ForegroundColor Cyan
try {
  $response = Invoke-WebRequest "$ApiBase/api/public/dashboard" -UseBasicParsing -TimeoutSec 5
  Write-Host "Dashboard Status: $($response.StatusCode)" -ForegroundColor Green
  Write-Host "Dashboard Response: $($response.Content)" -ForegroundColor White
  
  if ($response.StatusCode -eq 200) {
    $dashboardData = $response.Content | ConvertFrom-Json
    if ($dashboardData.users -and $dashboardData.users.Count -gt 0) {
      Write-Host "✅ Dashboard: Dados reais detectados" -ForegroundColor Green
    } else {
      Write-Host "❌ Dashboard: Sem dados reais" -ForegroundColor Red
    }
  }
} catch {
  Write-Host "❌ Dashboard: ERRO - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🚨 ANÁLISE DOS FALSOS POSITIVOS:" -ForegroundColor Red
Write-Host "===============================================" -ForegroundColor Red

Write-Host "`n📊 PROBLEMAS IDENTIFICADOS:" -ForegroundColor Yellow
Write-Host "1. Variáveis de ambiente podem estar faltando" -ForegroundColor White
Write-Host "2. Backend pode estar rodando mas sem funcionalidades" -ForegroundColor White
Write-Host "3. Frontend pode estar carregando mas sem integração" -ForegroundColor White
Write-Host "4. Banco de dados pode não estar conectado" -ForegroundColor White
Write-Host "5. PIX pode estar retornando dados fake" -ForegroundColor White

Write-Host "`n🔧 CAUSAS DOS FALSOS POSITIVOS:" -ForegroundColor Yellow
Write-Host "1. Testes locais vs produção" -ForegroundColor White
Write-Host "2. Configurações não aplicadas" -ForegroundColor White
Write-Host "3. Deploy não realizado corretamente" -ForegroundColor White
Write-Host "4. Variáveis de ambiente incorretas" -ForegroundColor White
Write-Host "5. Código não integrado com serviços reais" -ForegroundColor White

Write-Host "`n💡 SOLUÇÕES PARA EVITAR FALSOS POSITIVOS:" -ForegroundColor Yellow
Write-Host "1. Sempre testar em produção real" -ForegroundColor White
Write-Host "2. Verificar variáveis de ambiente" -ForegroundColor White
Write-Host "3. Testar fluxo completo do usuário" -ForegroundColor White
Write-Host "4. Validar integrações reais" -ForegroundColor White
Write-Host "5. Monitorar logs de produção" -ForegroundColor White
