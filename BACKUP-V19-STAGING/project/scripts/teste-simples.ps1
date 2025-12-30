Write-Host "=== TESTE SIMPLES - IDENTIFICANDO PROBLEMAS ===" -ForegroundColor Red

Write-Host "`n1. SECRETS CONFIGURADOS:" -ForegroundColor Cyan
flyctl secrets list

Write-Host "`n2. BACKEND HEALTH:" -ForegroundColor Cyan
try {
  $response = Invoke-WebRequest "https://goldeouro-backend-v2.fly.dev/health" -UseBasicParsing -TimeoutSec 5
  Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
  Write-Host "Content: $($response.Content)" -ForegroundColor White
} catch {
  Write-Host "ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n3. CADASTRO:" -ForegroundColor Cyan
try {
  $userData = @{
    name = "Teste"
    email = "teste@test.com"
    password = "123"
  } | ConvertTo-Json
  
  $response = Invoke-WebRequest "https://goldeouro-backend-v2.fly.dev/auth/register" -Method POST -Body $userData -ContentType "application/json" -UseBasicParsing -TimeoutSec 5
  Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
  Write-Host "Content: $($response.Content)" -ForegroundColor White
} catch {
  Write-Host "ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n4. PIX:" -ForegroundColor Cyan
try {
  $pixData = @{
    amount = 10
    user_id = 1
  } | ConvertTo-Json
  
  $response = Invoke-WebRequest "https://goldeouro-backend-v2.fly.dev/api/payments/pix/criar" -Method POST -Body $pixData -ContentType "application/json" -UseBasicParsing -TimeoutSec 5
  Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
  Write-Host "Content: $($response.Content)" -ForegroundColor White
} catch {
  Write-Host "ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n5. FRONTEND:" -ForegroundColor Cyan
try {
  $response = Invoke-WebRequest "https://goldeouro.lol" -UseBasicParsing -TimeoutSec 5
  Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
  Write-Host "ERRO: $($_.Exception.Message)" -ForegroundColor Red
}
