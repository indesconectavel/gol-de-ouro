# Script para testar jogo com token válido
Write-Host "TESTANDO JOGO COM TOKEN VALIDO:" -ForegroundColor Cyan

# Token do login anterior
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTc1ODkzNzIzMTM3NiwiZW1haWwiOiJqb2dhZG9yLm5vdm9AdGVzdGUuY29tIiwiaWF0IjoxNzU4OTM3MjMxLCJleHAiOjE3NTkwMjM2MzF9.QqLE0TbWk-WFiR97FaFzBdEhhk4z8P-9GaM5-q0kqVE"
Write-Host "Token: $($token.Substring(0,50))..." -ForegroundColor Yellow

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
