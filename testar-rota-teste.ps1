# Script para testar rota de teste do jogo
Write-Host "TESTANDO ROTA DE TESTE DO JOGO:" -ForegroundColor Cyan

try {
    $test = Invoke-WebRequest 'https://goldeouro-backend-v2.fly.dev/api/games/test' -Method POST -UseBasicParsing
    Write-Host "Status: $($test.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($test.Content)" -ForegroundColor White
} catch {
    Write-Host "ERRO: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody" -ForegroundColor Yellow
    }
}
