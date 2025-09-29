Write-Host "=== TESTE FINAL COMPLETO - SISTEMA FUNCIONANDO ===" -ForegroundColor Green
Write-Host ""

$ApiBase = "https://goldeouro-backend-v2.fly.dev"
$PlayerUrl = "https://goldeouro.lol"
$AdminUrl = "https://admin.goldeouro.lol"

Write-Host "🔍 1. VERIFICANDO BACKEND:" -ForegroundColor Cyan
try {
  $response = Invoke-WebRequest "$ApiBase/health" -UseBasicParsing -TimeoutSec 5
  Write-Host "  Health Status: $($response.StatusCode)" -ForegroundColor Green
  $healthData = $response.Content | ConvertFrom-Json
  Write-Host "  Uptime: $([math]::Round($healthData.uptime/60, 2)) minutos" -ForegroundColor White
} catch {
  Write-Host "  Health ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🔍 2. TESTANDO CADASTRO:" -ForegroundColor Cyan
try {
  $userData = @{
    name = "Jogador Teste Final"
    email = "jogador.teste.final@example.com"
    password = "senha123456"
  } | ConvertTo-Json
  
  $response = Invoke-WebRequest "$ApiBase/auth/register" -Method POST -Body $userData -ContentType "application/json" -UseBasicParsing -TimeoutSec 10
  Write-Host "  Cadastro Status: $($response.StatusCode)" -ForegroundColor Green
  Write-Host "  Cadastro Response: $($response.Content)" -ForegroundColor White
  
  if ($response.StatusCode -eq 201) {
    Write-Host "  ✅ CADASTRO: FUNCIONANDO!" -ForegroundColor Green
  } else {
    Write-Host "  ❌ CADASTRO: FALHANDO" -ForegroundColor Red
  }
} catch {
  Write-Host "  ❌ CADASTRO: ERRO - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🔍 3. TESTANDO LOGIN:" -ForegroundColor Cyan
try {
  $loginData = @{
    email = "jogador.teste.final@example.com"
    password = "senha123456"
  } | ConvertTo-Json
  
  $response = Invoke-WebRequest "$ApiBase/auth/login" -Method POST -Body $loginData -ContentType "application/json" -UseBasicParsing -TimeoutSec 10
  Write-Host "  Login Status: $($response.StatusCode)" -ForegroundColor Green
  Write-Host "  Login Response: $($response.Content)" -ForegroundColor White
  
  if ($response.StatusCode -eq 200) {
    Write-Host "  ✅ LOGIN: FUNCIONANDO!" -ForegroundColor Green
  } else {
    Write-Host "  ❌ LOGIN: FALHANDO" -ForegroundColor Red
  }
} catch {
  Write-Host "  ❌ LOGIN: ERRO - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🔍 4. TESTANDO PIX:" -ForegroundColor Cyan
try {
  $pixData = @{
    amount = 25
    user_id = 1
  } | ConvertTo-Json
  
  $response = Invoke-WebRequest "$ApiBase/api/payments/pix/criar" -Method POST -Body $pixData -ContentType "application/json" -UseBasicParsing -TimeoutSec 10
  Write-Host "  PIX Status: $($response.StatusCode)" -ForegroundColor Green
  Write-Host "  PIX Response: $($response.Content)" -ForegroundColor White
  
  if ($response.StatusCode -eq 200) {
    Write-Host "  ✅ PIX: FUNCIONANDO!" -ForegroundColor Green
  } else {
    Write-Host "  ❌ PIX: FALHANDO" -ForegroundColor Red
  }
} catch {
  Write-Host "  ❌ PIX: ERRO - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🔍 5. TESTANDO JOGO:" -ForegroundColor Cyan
try {
  $gameData = @{
    amount = 10
    direction = "center"
  } | ConvertTo-Json
  
  $response = Invoke-WebRequest "$ApiBase/api/games/shoot" -Method POST -Body $gameData -ContentType "application/json" -UseBasicParsing -TimeoutSec 10
  Write-Host "  Jogo Status: $($response.StatusCode)" -ForegroundColor Green
  Write-Host "  Jogo Response: $($response.Content)" -ForegroundColor White
  
  if ($response.StatusCode -eq 200) {
    Write-Host "  ✅ JOGO: FUNCIONANDO!" -ForegroundColor Green
  } else {
    Write-Host "  ❌ JOGO: FALHANDO" -ForegroundColor Red
  }
} catch {
  Write-Host "  ❌ JOGO: ERRO - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🔍 6. TESTANDO FRONTEND PLAYER:" -ForegroundColor Cyan
try {
  $response = Invoke-WebRequest $PlayerUrl -UseBasicParsing -TimeoutSec 5
  Write-Host "  Player Status: $($response.StatusCode)" -ForegroundColor Green
  
  if ($response.StatusCode -eq 200) {
    Write-Host "  ✅ PLAYER: FUNCIONANDO!" -ForegroundColor Green
  } else {
    Write-Host "  ❌ PLAYER: FALHANDO" -ForegroundColor Red
  }
} catch {
  Write-Host "  ❌ PLAYER: ERRO - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🔍 7. TESTANDO FRONTEND ADMIN:" -ForegroundColor Cyan
try {
  $response = Invoke-WebRequest $AdminUrl -UseBasicParsing -TimeoutSec 5
  Write-Host "  Admin Status: $($response.StatusCode)" -ForegroundColor Green
  
  if ($response.StatusCode -eq 200) {
    Write-Host "  ✅ ADMIN: FUNCIONANDO!" -ForegroundColor Green
  } else {
    Write-Host "  ❌ ADMIN: FALHANDO" -ForegroundColor Red
  }
} catch {
  Write-Host "  ❌ ADMIN: ERRO - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 TESTE FINAL COMPLETO!" -ForegroundColor Green
Write-Host "`n📊 RESUMO DO STATUS:" -ForegroundColor Cyan
Write-Host "O sistema foi testado completamente." -ForegroundColor White
Write-Host "Verifique os resultados acima para cada funcionalidade." -ForegroundColor White
Write-Host "`n🚀 PRÓXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host "1. Se cadastro/login falharam: Configurar DATABASE_URL real" -ForegroundColor White
Write-Host "2. Se PIX falhou: Configurar MP_ACCESS_TOKEN real" -ForegroundColor White
Write-Host "3. Se frontend falhou: Verificar deploy no Vercel" -ForegroundColor White
Write-Host "4. Testar com jogadores reais após correções" -ForegroundColor White
