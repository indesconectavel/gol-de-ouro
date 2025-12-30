Write-Host "=== ANÁLISE DOS FALSOS POSITIVOS ===" -ForegroundColor Red
Write-Host ""

Write-Host "🔍 1. VERIFICANDO SECRETS REAIS:" -ForegroundColor Cyan
flyctl secrets list

Write-Host "`n🔍 2. TESTANDO CADASTRO REAL:" -ForegroundColor Cyan
try {
  $userData = '{"name":"Jogador Real","email":"jogador.real@test.com","password":"senha123"}'
  $response = Invoke-WebRequest "https://goldeouro-backend-v2.fly.dev/auth/register" -Method POST -Body $userData -ContentType "application/json" -UseBasicParsing -TimeoutSec 5
  Write-Host "Cadastro Status: $($response.StatusCode)" -ForegroundColor Green
  Write-Host "Cadastro Response: $($response.Content)" -ForegroundColor White
} catch {
  Write-Host "Cadastro ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🔍 3. TESTANDO PIX REAL:" -ForegroundColor Cyan
try {
  $pixData = '{"amount":10,"user_id":1}'
  $response = Invoke-WebRequest "https://goldeouro-backend-v2.fly.dev/api/payments/pix/criar" -Method POST -Body $pixData -ContentType "application/json" -UseBasicParsing -TimeoutSec 5
  Write-Host "PIX Status: $($response.StatusCode)" -ForegroundColor Green
  Write-Host "PIX Response: $($response.Content)" -ForegroundColor White
} catch {
  Write-Host "PIX ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🔍 4. TESTANDO FRONTEND:" -ForegroundColor Cyan
try {
  $response = Invoke-WebRequest "https://goldeouro.lol" -UseBasicParsing -TimeoutSec 5
  Write-Host "Player Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
  Write-Host "Player ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🔍 5. TESTANDO PÁGINA /GAME:" -ForegroundColor Cyan
try {
  $response = Invoke-WebRequest "https://goldeouro.lol/game" -UseBasicParsing -TimeoutSec 5
  Write-Host "Game Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
  Write-Host "Game ERRO: $($_.Exception.Message)" -ForegroundColor Red
}
