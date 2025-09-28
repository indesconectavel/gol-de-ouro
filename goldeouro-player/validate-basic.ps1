# Validacao Basica do Sistema do Jogador
Write-Host "Validando sistema do jogador..." -ForegroundColor Cyan
Write-Host ""

$totalTests = 0
$passedTests = 0

# Teste 1: Health Check Backend
Write-Host "Testando Health Check Backend..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host " OK" -ForegroundColor Green
        $passedTests++
    } else {
        Write-Host " ERRO: Status $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host " ERRO: $($_.Exception.Message)" -ForegroundColor Red
}
$totalTests++

# Teste 2: Frontend Jogador
Write-Host "Testando Frontend Jogador..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5174" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host " OK" -ForegroundColor Green
        $passedTests++
    } else {
        Write-Host " ERRO: Status $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host " ERRO: $($_.Exception.Message)" -ForegroundColor Red
}
$totalTests++

Write-Host ""
Write-Host "Resultado da Validacao:" -ForegroundColor Cyan
Write-Host "Passou: $passedTests/$totalTests" -ForegroundColor Green
Write-Host "Falhou: $($totalTests - $passedTests)/$totalTests" -ForegroundColor Red

if ($passedTests -eq $totalTests) {
    Write-Host ""
    Write-Host "Sistema funcionando perfeitamente!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Sistema com problemas" -ForegroundColor Yellow
}
