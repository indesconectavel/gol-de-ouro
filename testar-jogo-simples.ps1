# Script para testar jogo sem autenticação (para debug)
Write-Host "5. TESTANDO JOGO SEM AUTENTICACAO (DEBUG):" -ForegroundColor Cyan

try {
    $g = Invoke-WebRequest 'https://goldeouro-backend-v2.fly.dev/api/games/shoot' -Method POST -Body (Get-Content test-game.json -Raw) -ContentType 'application/json' -UseBasicParsing
    Write-Host "Status: $($g.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($g.Content)" -ForegroundColor White
} catch {
    Write-Host "ERRO: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody" -ForegroundColor Yellow
    }
}