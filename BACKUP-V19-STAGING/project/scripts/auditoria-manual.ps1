Write-Host "=== AUDITORIA MANUAL - IDENTIFICANDO FALSOS POSITIVOS ===" -ForegroundColor Red
Write-Host ""

# 1. Verificar secrets
Write-Host "1. VERIFICANDO SECRETS DO FLY.IO:" -ForegroundColor Cyan
flyctl secrets list

Write-Host "`n2. VERIFICANDO STATUS DOS SERVIÇOS:" -ForegroundColor Cyan

# Backend
Write-Host "Backend API:" -ForegroundColor Yellow
try {
  $response = Invoke-WebRequest "https://goldeouro-backend-v2.fly.dev/health" -UseBasicParsing -TimeoutSec 5
  Write-Host "  Status: $($response.StatusCode)" -ForegroundColor Green
  Write-Host "  Content: $($response.Content)" -ForegroundColor White
} catch {
  Write-Host "  ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

# Player
Write-Host "`nPlayer:" -ForegroundColor Yellow
try {
  $response = Invoke-WebRequest "https://goldeouro.lol" -UseBasicParsing -TimeoutSec 5
  Write-Host "  Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
  Write-Host "  ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

# Admin
Write-Host "`nAdmin:" -ForegroundColor Yellow
try {
  $response = Invoke-WebRequest "https://admin.goldeouro.lol" -UseBasicParsing -TimeoutSec 5
  Write-Host "  Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
  Write-Host "  ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n3. TESTANDO FUNCIONALIDADES:" -ForegroundColor Cyan

# Teste PIX
Write-Host "PIX (payments/create):" -ForegroundColor Yellow
try {
  $pixData = '{"amount":1,"description":"Teste"}'
  $response = Invoke-WebRequest "https://goldeouro-backend-v2.fly.dev/payments/create" -Method POST -Body $pixData -ContentType "application/json" -UseBasicParsing -TimeoutSec 5
  Write-Host "  Status: $($response.StatusCode)" -ForegroundColor Green
  Write-Host "  Response: $($response.Content.Substring(0, [Math]::Min(100, $response.Content.Length)))" -ForegroundColor White
} catch {
  Write-Host "  ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

# Teste Users
Write-Host "`nUsers:" -ForegroundColor Yellow
try {
  $response = Invoke-WebRequest "https://goldeouro-backend-v2.fly.dev/users" -UseBasicParsing -TimeoutSec 5
  Write-Host "  Status: $($response.StatusCode)" -ForegroundColor Green
  Write-Host "  Response: $($response.Content.Substring(0, [Math]::Min(100, $response.Content.Length)))" -ForegroundColor White
} catch {
  Write-Host "  ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n4. VERIFICAÇÃO DE DADOS:" -ForegroundColor Cyan
Write-Host "Verificando se está usando dados fictícios..." -ForegroundColor Yellow
