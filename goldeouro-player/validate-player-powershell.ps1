# Validação do Sistema do Jogador - PowerShell
Write-Host "🎮 Validando sistema do jogador..." -ForegroundColor Cyan
Write-Host ""

$totalTests = 0
$passedTests = 0

# Teste 1: Health Check Backend
Write-Host "🔍 Testando Health Check Backend..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host " ✅ OK" -ForegroundColor Green
        $passedTests++
    } else {
        Write-Host " ❌ ERRO: Status $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host " ❌ ERRO: $($_.Exception.Message)" -ForegroundColor Red
}
$totalTests++

# Teste 2: Frontend Jogador
Write-Host "🔍 Testando Frontend Jogador..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5174" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host " ✅ OK" -ForegroundColor Green
        $passedTests++
    } else {
        Write-Host " ❌ ERRO: Status $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host " ❌ ERRO: $($_.Exception.Message)" -ForegroundColor Red
}
$totalTests++

# Teste 3: Registro de Usuário
Write-Host "🔍 Testando Registro de Usuário..." -NoNewline
try {
    $body = @{} | ConvertTo-Json
    $response = Invoke-WebRequest -Uri "http://localhost:3000/auth/register" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 400) {
        Write-Host " ✅ OK" -ForegroundColor Green
        $passedTests++
    } else {
        Write-Host " ❌ ERRO: Status $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host " ❌ ERRO: $($_.Exception.Message)" -ForegroundColor Red
}
$totalTests++

# Teste 4: Status do Jogo
Write-Host "🔍 Testando Status do Jogo..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/games/status" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host " ✅ OK" -ForegroundColor Green
        $passedTests++
    } else {
        Write-Host " ❌ ERRO: Status $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host " ❌ ERRO: $($_.Exception.Message)" -ForegroundColor Red
}
$totalTests++

# Teste 5: Fila de Jogos
Write-Host "🔍 Testando Fila de Jogos..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/fila" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host " ✅ OK" -ForegroundColor Green
        $passedTests++
    } else {
        Write-Host " ❌ ERRO: Status $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host " ❌ ERRO: $($_.Exception.Message)" -ForegroundColor Red
}
$totalTests++

# Teste 6: Criação PIX
Write-Host "🔍 Testando Criação PIX..." -NoNewline
try {
    $body = @{} | ConvertTo-Json
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/payments/pix/criar" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 400) {
        Write-Host " ✅ OK" -ForegroundColor Green
        $passedTests++
    } else {
        Write-Host " ❌ ERRO: Status $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host " ❌ ERRO: $($_.Exception.Message)" -ForegroundColor Red
}
$totalTests++

Write-Host ""
Write-Host "📊 Resultado da Validação do Jogador:" -ForegroundColor Cyan
Write-Host "✅ Passou: $passedTests/$totalTests" -ForegroundColor Green
Write-Host "❌ Falhou: $($totalTests - $passedTests)/$totalTests" -ForegroundColor Red

if ($passedTests -eq $totalTests) {
    Write-Host ""
    Write-Host "🎉 Sistema do Jogador funcionando perfeitamente!" -ForegroundColor Green
    Write-Host "🚀 Pronto para GO-LIVE v1.1.1!" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "⚠️ Sistema do Jogador com problemas - Verificar logs" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "🔧 Soluções possíveis:" -ForegroundColor Cyan
    Write-Host "1. Verificar se o backend está rodando" -ForegroundColor White
    Write-Host "2. Verificar se a porta 3000 está livre" -ForegroundColor White
    Write-Host "3. Verificar se o frontend jogador está rodando" -ForegroundColor White
    Write-Host "4. Verificar se a porta 5174 está livre" -ForegroundColor White
    Write-Host "5. Verificar se o CORS está configurado" -ForegroundColor White
}
