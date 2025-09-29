# Script para testar rota com autenticação
Write-Host "TESTANDO ROTA COM AUTENTICACAO:" -ForegroundColor Cyan

# Token do login anterior
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTc1ODk0MTMzMzA2NSwiZW1haWwiOiJqb2dhZG9yLm5vdm9AdGVzdGUuY29tIiwiaWF0IjoxNzU4OTQxMzMzLCJleHAiOjE3NTkwMjc3MzN9.EvPpHu78L96OcX_m5LPPdK0h73BtvkMhVihJeYpA_9A"

# Testar rota de teste com autenticação
Write-Host "Testando rota de teste com autenticação..." -ForegroundColor Yellow
try {
    $testAuthResponse = Invoke-WebRequest 'https://goldeouro-backend-v2.fly.dev/api/games/test-auth' `
        -Method POST `
        -Headers @{'Authorization'="Bearer $token"} `
        -UseBasicParsing
    Write-Host "Test Auth Status: $($testAuthResponse.StatusCode)" -ForegroundColor Green
    Write-Host "Test Auth Response: $($testAuthResponse.Content)" -ForegroundColor White
} catch {
    Write-Host "ERRO NA ROTA DE TESTE: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody" -ForegroundColor Yellow
    }
}

# Testar rota principal do jogo novamente
Write-Host "`nTestando rota principal do jogo..." -ForegroundColor Yellow
try {
    $gameBody = Get-Content test-game.json -Raw
    $gameResponse = Invoke-WebRequest 'https://goldeouro-backend-v2.fly.dev/api/games/shoot' `
        -Method POST `
        -Body $gameBody `
        -ContentType 'application/json' `
        -Headers @{'Authorization'="Bearer $token"} `
        -UseBasicParsing
    Write-Host "Jogo Status: $($gameResponse.StatusCode)" -ForegroundColor Green
    Write-Host "Jogo Response: $($gameResponse.Content)" -ForegroundColor White
} catch {
    Write-Host "ERRO NO JOGO: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody" -ForegroundColor Yellow
    }
}
