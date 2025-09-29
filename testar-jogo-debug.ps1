# Script para debug do jogo
Write-Host "15. DEBUG DO JOGO - VERIFICANDO USUARIO:" -ForegroundColor Cyan

# Primeiro, vamos verificar se o usuário existe fazendo login
Write-Host "Fazendo login para verificar usuário..." -ForegroundColor Yellow
try {
    $login = Invoke-WebRequest 'https://goldeouro-backend-v2.fly.dev/auth/login' -Method POST -Body (Get-Content test-login-novo.json -Raw) -ContentType 'application/json' -UseBasicParsing
    Write-Host "Login Status: $($login.StatusCode)" -ForegroundColor Green
    Write-Host "Login Response: $($login.Content)" -ForegroundColor White
    
    if ($login.StatusCode -eq 200) {
        $json = $login.Content | ConvertFrom-Json
        $token = $json.token
        Write-Host "Token extraido: $($token.Substring(0,50))..." -ForegroundColor Yellow
        
        # Agora testar o jogo
        Write-Host "Testando jogo com token do login..." -ForegroundColor Yellow
        try {
            $game = Invoke-WebRequest 'https://goldeouro-backend-v2.fly.dev/api/games/shoot' -Method POST -Body (Get-Content test-game.json -Raw) -ContentType 'application/json' -Headers @{'Authorization'="Bearer $token"} -UseBasicParsing
            Write-Host "Jogo Status: $($game.StatusCode)" -ForegroundColor Green
            Write-Host "Jogo Response: $($game.Content)" -ForegroundColor White
        } catch {
            Write-Host "ERRO NO JOGO: $($_.Exception.Message)" -ForegroundColor Red
            if ($_.Exception.Response) {
                $stream = $_.Exception.Response.GetResponseStream()
                $reader = New-Object System.IO.StreamReader($stream)
                $responseBody = $reader.ReadToEnd()
                Write-Host "Response Body: $responseBody" -ForegroundColor Yellow
            }
        }
    }
} catch {
    Write-Host "ERRO NO LOGIN: $($_.Exception.Message)" -ForegroundColor Red
}
