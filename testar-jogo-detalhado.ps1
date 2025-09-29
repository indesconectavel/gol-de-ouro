# Script para testar jogo com token real - versão detalhada
$token = Get-Content 'token-real.txt' -Raw
Write-Host "3. TESTANDO JOGO COM TOKEN REAL (DETALHADO):" -ForegroundColor Cyan
Write-Host "Token: $($token.Substring(0,50))..." -ForegroundColor Yellow

try {
    $g = Invoke-WebRequest 'https://goldeouro-backend-v2.fly.dev/api/games/shoot' -Method POST -Body (Get-Content test-game.json -Raw) -ContentType 'application/json' -Headers @{'Authorization'="Bearer $token"} -UseBasicParsing
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
