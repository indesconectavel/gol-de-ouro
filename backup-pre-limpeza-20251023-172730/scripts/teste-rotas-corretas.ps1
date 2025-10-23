Write-Host "=== TESTE DAS ROTAS CORRETAS ===" -ForegroundColor Cyan
Write-Host ""

$ApiBase = "https://goldeouro-backend-v2.fly.dev"

Write-Host "1. TESTANDO PIX (rota correta):" -ForegroundColor Yellow
try {
  $pixData = @{
    amount = 1
    description = "Teste PIX"
  } | ConvertTo-Json
  
  $response = Invoke-WebRequest "$ApiBase/api/payments/pix/criar" -Method POST -Body $pixData -ContentType "application/json" -UseBasicParsing -TimeoutSec 10
  Write-Host "  Status: $($response.StatusCode)" -ForegroundColor Green
  Write-Host "  Response: $($response.Content.Substring(0, [Math]::Min(200, $response.Content.Length)))" -ForegroundColor White
} catch {
  Write-Host "  ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n2. TESTANDO CADASTRO (rota correta):" -ForegroundColor Yellow
try {
  $userData = @{
    name = "Teste Usuario"
    email = "teste@example.com"
    password = "senha123"
  } | ConvertTo-Json
  
  $response = Invoke-WebRequest "$ApiBase/auth/register" -Method POST -Body $userData -ContentType "application/json" -UseBasicParsing -TimeoutSec 10
  Write-Host "  Status: $($response.StatusCode)" -ForegroundColor Green
  Write-Host "  Response: $($response.Content.Substring(0, [Math]::Min(200, $response.Content.Length)))" -ForegroundColor White
} catch {
  Write-Host "  ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n3. TESTANDO LOGIN (rota correta):" -ForegroundColor Yellow
try {
  $loginData = @{
    email = "teste@example.com"
    password = "senha123"
  } | ConvertTo-Json
  
  $response = Invoke-WebRequest "$ApiBase/auth/login" -Method POST -Body $loginData -ContentType "application/json" -UseBasicParsing -TimeoutSec 10
  Write-Host "  Status: $($response.StatusCode)" -ForegroundColor Green
  Write-Host "  Response: $($response.Content.Substring(0, [Math]::Min(200, $response.Content.Length)))" -ForegroundColor White
} catch {
  Write-Host "  ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n4. TESTANDO DASHBOARD:" -ForegroundColor Yellow
try {
  $response = Invoke-WebRequest "$ApiBase/api/public/dashboard" -UseBasicParsing -TimeoutSec 10
  Write-Host "  Status: $($response.StatusCode)" -ForegroundColor Green
  Write-Host "  Response: $($response.Content.Substring(0, [Math]::Min(200, $response.Content.Length)))" -ForegroundColor White
} catch {
  Write-Host "  ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n5. VERIFICANDO SECRETS:" -ForegroundColor Yellow
$secrets = flyctl secrets list 2>$null
Write-Host "  Secrets configurados:" -ForegroundColor White
Write-Host "  $secrets" -ForegroundColor White
