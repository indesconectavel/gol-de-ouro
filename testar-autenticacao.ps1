# Script para testar autenticação
Write-Host "TESTANDO AUTENTICACAO:" -ForegroundColor Cyan

# Token do login anterior
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTc1ODk0MTMzMzA2NSwiZW1haWwiOiJqb2dhZG9yLm5vdm9AdGVzdGUuY29tIiwiaWF0IjoxNzU4OTQxMzMzLCJleHAiOjE3NTkwMjc3MzN9.EvPpHu78L96OcX_m5LPPdK0h73BtvkMhVihJeYpA_9A"

# Testar rota que requer autenticação
Write-Host "Testando rota que requer autenticação..." -ForegroundColor Yellow
try {
    $authResponse = Invoke-WebRequest 'https://goldeouro-backend-v2.fly.dev/api/public/dashboard' `
        -Headers @{'Authorization'="Bearer $token"} `
        -UseBasicParsing
    Write-Host "Auth Status: $($authResponse.StatusCode)" -ForegroundColor Green
    Write-Host "Auth Response: $($authResponse.Content)" -ForegroundColor White
} catch {
    Write-Host "ERRO NA AUTENTICACAO: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody" -ForegroundColor Yellow
    }
}

# Testar rota sem autenticação
Write-Host "`nTestando rota sem autenticação..." -ForegroundColor Yellow
try {
    $noAuthResponse = Invoke-WebRequest 'https://goldeouro-backend-v2.fly.dev/api/games/shoot-test' `
        -Method POST `
        -Body (Get-Content test-game.json -Raw) `
        -ContentType 'application/json' `
        -UseBasicParsing
    Write-Host "No Auth Status: $($noAuthResponse.StatusCode)" -ForegroundColor Green
    Write-Host "No Auth Response: $($noAuthResponse.Content)" -ForegroundColor White
} catch {
    Write-Host "ERRO SEM AUTENTICACAO: $($_.Exception.Message)" -ForegroundColor Red
}
