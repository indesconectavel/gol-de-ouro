# Script para teste de performance
Write-Host "7. TESTE DE PERFORMANCE - BACKEND:" -ForegroundColor Yellow
$start = Get-Date
try {
    $h = Invoke-WebRequest 'https://goldeouro-backend-v2.fly.dev/health' -UseBasicParsing
    $end = Get-Date
    $duration = ($end - $start).TotalMilliseconds
    Write-Host "Tempo de resposta: $duration ms" -ForegroundColor Green
    Write-Host "Status: $($h.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n8. TESTE DE PERFORMANCE - FRONTEND PLAYER:" -ForegroundColor Yellow
$start = Get-Date
try {
    $p = Invoke-WebRequest 'https://goldeouro.lol' -UseBasicParsing
    $end = Get-Date
    $duration = ($end - $start).TotalMilliseconds
    Write-Host "Tempo de resposta: $duration ms" -ForegroundColor Green
    Write-Host "Status: $($p.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n9. TESTE DE PERFORMANCE - FRONTEND ADMIN:" -ForegroundColor Yellow
$start = Get-Date
try {
    $a = Invoke-WebRequest 'https://admin.goldeouro.lol' -UseBasicParsing
    $end = Get-Date
    $duration = ($end - $start).TotalMilliseconds
    Write-Host "Tempo de resposta: $duration ms" -ForegroundColor Green
    Write-Host "Status: $($a.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "ERRO: $($_.Exception.Message)" -ForegroundColor Red
}
