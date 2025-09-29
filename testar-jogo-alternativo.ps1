# Script para testar jogo alternativo (sem autenticação)
Write-Host "TESTANDO JOGO ALTERNATIVO (SEM AUTENTICACAO):" -ForegroundColor Cyan

try {
    $game = Invoke-WebRequest 'https://goldeouro-backend-v2.fly.dev/api/games/shoot-test' -Method POST -Body (Get-Content test-game.json -Raw) -ContentType 'application/json' -UseBasicParsing
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