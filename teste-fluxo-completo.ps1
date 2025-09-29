# Script para testar fluxo completo do usuário
Write-Host "=== TESTE DE FLUXO COMPLETO DO USUARIO ===" -ForegroundColor Red
Write-Host ""

# 1. Cadastrar usuário
Write-Host "1. CADASTRANDO USUARIO:" -ForegroundColor Cyan
try {
    $register = Invoke-WebRequest 'https://goldeouro-backend-v2.fly.dev/auth/register' -Method POST -Body (Get-Content test-data-novo.json -Raw) -ContentType 'application/json' -UseBasicParsing
    Write-Host "Status: $($register.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($register.Content)" -ForegroundColor White
} catch {
    Write-Host "ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# 2. Fazer login
Write-Host "2. FAZENDO LOGIN:" -ForegroundColor Cyan
try {
    $login = Invoke-WebRequest 'https://goldeouro-backend-v2.fly.dev/auth/login' -Method POST -Body (Get-Content test-login-novo.json -Raw) -ContentType 'application/json' -UseBasicParsing
    Write-Host "Status: $($login.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($login.Content)" -ForegroundColor White
    
    # Extrair token
    $json = $login.Content | ConvertFrom-Json
    $token = $json.token
    Write-Host "Token extraido: $($token.Substring(0,50))..." -ForegroundColor Yellow
} catch {
    Write-Host "ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# 3. Testar PIX
Write-Host "3. TESTANDO PIX:" -ForegroundColor Cyan
try {
    $pix = Invoke-WebRequest 'https://goldeouro-backend-v2.fly.dev/api/payments/pix/criar' -Method POST -Body (Get-Content test-pix.json -Raw) -ContentType 'application/json' -UseBasicParsing
    Write-Host "Status: $($pix.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($pix.Content)" -ForegroundColor White
} catch {
    Write-Host "ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# 4. Testar jogo (se token foi extraído)
if ($token) {
    Write-Host "4. TESTANDO JOGO:" -ForegroundColor Cyan
    try {
        $game = Invoke-WebRequest 'https://goldeouro-backend-v2.fly.dev/api/games/shoot' -Method POST -Body (Get-Content test-game.json -Raw) -ContentType 'application/json' -Headers @{'Authorization'="Bearer $token"} -UseBasicParsing
        Write-Host "Status: $($game.StatusCode)" -ForegroundColor Green
        Write-Host "Response: $($game.Content)" -ForegroundColor White
    } catch {
        Write-Host "ERRO: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $responseBody = $reader.ReadToEnd()
            Write-Host "Response Body: $responseBody" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "4. PULANDO TESTE DE JOGO (token nao disponivel)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== FLUXO COMPLETO FINALIZADO ===" -ForegroundColor Red
