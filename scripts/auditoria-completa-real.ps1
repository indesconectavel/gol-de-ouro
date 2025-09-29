# scripts/auditoria-completa-real.ps1 - Auditoria completa real do sistema
Write-Host "=== AUDITORIA COMPLETA REAL - ANÁLISE DO JOGADOR COMUM ===" -ForegroundColor Red
Write-Host ""

$ApiBase = "https://goldeouro-backend-v2.fly.dev"
$PlayerUrl = "https://goldeouro.lol"
$AdminUrl = "https://admin.goldeouro.lol"

$problemas = @()
$sucessos = @()

Write-Host "🔍 1. TESTANDO COMO JOGADOR COMUM - CADASTRO:" -ForegroundColor Cyan

# Teste de cadastro real
try {
  $userData = @{
    name = "Jogador Teste"
    email = "jogador.teste@example.com"
    password = "senha123456"
  } | ConvertTo-Json
  
  $response = Invoke-WebRequest "$ApiBase/auth/register" -Method POST -Body $userData -ContentType "application/json" -UseBasicParsing -TimeoutSec 10
  Write-Host "  Status: $($response.StatusCode)" -ForegroundColor Green
  Write-Host "  Response: $($response.Content)" -ForegroundColor White
  
  if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 201) {
    $sucessos += "Cadastro: FUNCIONANDO"
  } else {
    $problemas += "Cadastro: Falha ($($response.StatusCode)) - $($response.Content)"
  }
} catch {
  $problemas += "Cadastro: ERRO - $($_.Exception.Message)"
}

Write-Host "`n🔍 2. TESTANDO COMO JOGADOR COMUM - LOGIN:" -ForegroundColor Cyan

# Teste de login real
try {
  $loginData = @{
    email = "jogador.teste@example.com"
    password = "senha123456"
  } | ConvertTo-Json
  
  $response = Invoke-WebRequest "$ApiBase/auth/login" -Method POST -Body $loginData -ContentType "application/json" -UseBasicParsing -TimeoutSec 10
  Write-Host "  Status: $($response.StatusCode)" -ForegroundColor Green
  Write-Host "  Response: $($response.Content)" -ForegroundColor White
  
  if ($response.StatusCode -eq 200) {
    $loginResponse = $response.Content | ConvertFrom-Json
    if ($loginResponse.token -or $loginResponse.access_token) {
      $sucessos += "Login: FUNCIONANDO (token recebido)"
      $token = $loginResponse.token -or $loginResponse.access_token
    } else {
      $problemas += "Login: Falha (sem token) - $($response.Content)"
    }
  } else {
    $problemas += "Login: Falha ($($response.StatusCode)) - $($response.Content)"
  }
} catch {
  $problemas += "Login: ERRO - $($_.Exception.Message)"
}

Write-Host "`n🔍 3. TESTANDO COMO JOGADOR COMUM - PIX:" -ForegroundColor Cyan

# Teste de PIX real
try {
  $pixData = @{
    amount = 5
    description = "Depósito para jogar"
  } | ConvertTo-Json
  
  $response = Invoke-WebRequest "$ApiBase/api/payments/pix/criar" -Method POST -Body $pixData -ContentType "application/json" -UseBasicParsing -TimeoutSec 10
  Write-Host "  Status: $($response.StatusCode)" -ForegroundColor Green
  Write-Host "  Response: $($response.Content)" -ForegroundColor White
  
  if ($response.StatusCode -eq 200) {
    $pixResponse = $response.Content | ConvertFrom-Json
    if ($pixResponse.init_point -or $pixResponse.qr_code -or $pixResponse.payment_link) {
      $sucessos += "PIX: FUNCIONANDO (link gerado)"
    } else {
      $problemas += "PIX: Falha (sem link) - $($response.Content)"
    }
  } else {
    $problemas += "PIX: Falha ($($response.StatusCode)) - $($response.Content)"
  }
} catch {
  $problemas += "PIX: ERRO - $($_.Exception.Message)"
}

Write-Host "`n🔍 4. TESTANDO COMO JOGADOR COMUM - JOGO:" -ForegroundColor Cyan

# Teste de jogo (se tivermos token)
if ($token) {
  try {
    $gameData = @{
      amount = 5
      direction = "left"
    } | ConvertTo-Json
    
    $headers = @{
      "Authorization" = "Bearer $token"
      "Content-Type" = "application/json"
    }
    
    $response = Invoke-WebRequest "$ApiBase/api/games/shoot" -Method POST -Body $gameData -Headers $headers -UseBasicParsing -TimeoutSec 10
    Write-Host "  Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "  Response: $($response.Content)" -ForegroundColor White
    
    if ($response.StatusCode -eq 200) {
      $sucessos += "Jogo: FUNCIONANDO"
    } else {
      $problemas += "Jogo: Falha ($($response.StatusCode)) - $($response.Content)"
    }
  } catch {
    $problemas += "Jogo: ERRO - $($_.Exception.Message)"
  }
} else {
  $problemas += "Jogo: Não testado (sem token de login)"
}

Write-Host "`n🔍 5. TESTANDO FRONTEND - PÁGINA /GAME:" -ForegroundColor Cyan

# Teste da página do jogo no frontend
try {
  $response = Invoke-WebRequest "$PlayerUrl/game" -UseBasicParsing -TimeoutSec 10
  Write-Host "  Status: $($response.StatusCode)" -ForegroundColor Green
  
  if ($response.StatusCode -eq 200) {
    $content = $response.Content
    if ($content -match "game" -or $content -match "jogo" -or $content -match "shoot") {
      $sucessos += "Página /game: CARREGANDO"
    } else {
      $problemas += "Página /game: Carregando mas sem conteúdo do jogo"
    }
  } else {
    $problemas += "Página /game: Falha ($($response.StatusCode))"
  }
} catch {
  $problemas += "Página /game: ERRO - $($_.Exception.Message)"
}

Write-Host "`n🔍 6. VERIFICANDO VARIÁVEIS DE AMBIENTE:" -ForegroundColor Cyan

$secrets = flyctl secrets list 2>$null
Write-Host "  Secrets configurados:" -ForegroundColor White
Write-Host "  $secrets" -ForegroundColor White

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

Write-Host "`n🔍 7. VERIFICANDO ESTRUTURA DO FRONTEND:" -ForegroundColor Cyan

# Verificar se o frontend tem as páginas necessárias
try {
  $response = Invoke-WebRequest "$PlayerUrl" -UseBasicParsing -TimeoutSec 10
  $content = $response.Content
  
  if ($content -match "login" -or $content -match "Login") {
    $sucessos += "Frontend: Página de login detectada"
  } else {
    $problemas += "Frontend: Página de login não detectada"
  }
  
  if ($content -match "register" -or $content -match "Register" -or $content -match "cadastro") {
    $sucessos += "Frontend: Página de cadastro detectada"
  } else {
    $problemas += "Frontend: Página de cadastro não detectada"
  }
  
  if ($content -match "game" -or $content -match "jogo") {
    $sucessos += "Frontend: Página de jogo detectada"
  } else {
    $problemas += "Frontend: Página de jogo não detectada"
  }
} catch {
  $problemas += "Frontend: ERRO ao verificar estrutura"
}

Write-Host "`n🚨 RELATÓRIO FINAL - ANÁLISE REAL:" -ForegroundColor Red
Write-Host "===============================================" -ForegroundColor Red

if ($problemas.Count -gt 0) {
  Write-Host "`n❌ PROBLEMAS IDENTIFICADOS ($($problemas.Count)):" -ForegroundColor Red
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

Write-Host "`n📊 RESUMO DA ANÁLISE:" -ForegroundColor Cyan
Write-Host "   Total de verificações: $($problemas.Count + $sucessos.Count)" -ForegroundColor White
Write-Host "   Problemas: $($problemas.Count)" -ForegroundColor Red
Write-Host "   Sucessos: $($sucessos.Count)" -ForegroundColor Green

if ($problemas.Count -gt 0) {
  Write-Host "`n🔧 AÇÕES NECESSÁRIAS PARA FUNCIONAR:" -ForegroundColor Yellow
  Write-Host "1. Configurar variáveis de ambiente faltantes" -ForegroundColor White
  Write-Host "2. Corrigir funcionalidades quebradas" -ForegroundColor White
  Write-Host "3. Fazer deploy correto" -ForegroundColor White
  Write-Host "4. Testar fluxo completo do jogador" -ForegroundColor White
} else {
  Write-Host "`n🎉 SISTEMA REALMENTE FUNCIONANDO!" -ForegroundColor Green
}

Write-Host "`n📋 PRÓXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host "1. Corrigir problemas identificados" -ForegroundColor White
Write-Host "2. Testar fluxo completo: Cadastro → Login → PIX → Jogo" -ForegroundColor White
Write-Host "3. Validar que jogador comum consegue usar tudo" -ForegroundColor White
