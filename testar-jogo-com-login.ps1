# Script para testar jogo com login completo
Write-Host "TESTANDO JOGO COM LOGIN COMPLETO:" -ForegroundColor Cyan

# 1. Fazer login para obter token
Write-Host "1. Fazendo login..." -ForegroundColor Yellow
try {
    $loginBody = Get-Content test-login-novo.json -Raw
    $loginResponse = Invoke-WebRequest 'https://goldeouro-backend-v2.fly.dev/auth/login' `
        -Method POST `
        -Body $loginBody `
        -ContentType 'application/json' `
        -UseBasicParsing
    Write-Host "Login Status: $($loginResponse.StatusCode)" -ForegroundColor Green
    Write-Host "Login Response: $($loginResponse.Content)" -ForegroundColor White
    $token = ($loginResponse.Content | ConvertFrom-Json).token
    Write-Host "Token extraido: $($token.Substring(0,50))..." -ForegroundColor White
} catch {
    Write-Host "ERRO NO LOGIN: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 2. Testar rota principal do jogo
Write-Host "`n2. Testando rota principal do jogo..." -ForegroundColor Yellow
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

# 3. Testar rota alternativa do jogo
Write-Host "`n3. Testando rota alternativa do jogo..." -ForegroundColor Yellow
try {
    $gameAltResponse = Invoke-WebRequest 'https://goldeouro-backend-v2.fly.dev/api/games/shoot-test' `
        -Method POST `
        -Body $gameBody `
        -ContentType 'application/json' `
        -UseBasicParsing
    Write-Host "Jogo Alt Status: $($gameAltResponse.StatusCode)" -ForegroundColor Green
    Write-Host "Jogo Alt Response: $($gameAltResponse.Content)" -ForegroundColor White
} catch {
    Write-Host "ERRO NO JOGO ALT: $($_.Exception.Message)" -ForegroundColor Red
}
