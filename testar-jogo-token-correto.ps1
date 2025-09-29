# Script para testar jogo com token correto
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTc1ODkxMDEwMDQyNCwiZW1haWwiOiJqb2dhZG9yLm5vdm9AdGVzdGUuY29tIiwiaWF0IjoxNzU4OTEyNjAwLCJleHAiOjE3NTg5OTkwMDB9.4paf1ctKZUbWcKMldJM67Ghi2u210Bd5ttr0sfrmKzQ"
Write-Host "4. TESTANDO JOGO COM TOKEN CORRETO:" -ForegroundColor Cyan
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
