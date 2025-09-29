# Script para testar jogo com token do login corrigido
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTc1ODkyNjU0MjI5NiwiZW1haWwiOiJqb2dhZG9yLm5vdm9AdGVzdGUuY29tIiwiaWF0IjoxNzU4OTI2NTQyLCJleHAiOjE3NTkwMTI5NDJ9.xvFUviaUGDZevdetbqhsiOUUB5tUIHWH3f-2-Uhh2bk"
Write-Host "17. TESTANDO JOGO COM CORRECAO FINAL:" -ForegroundColor Cyan
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
