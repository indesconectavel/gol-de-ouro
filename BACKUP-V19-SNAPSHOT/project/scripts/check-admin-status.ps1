# Script para verificar status do admin local
Write-Host "=== VERIFICANDO STATUS DO ADMIN LOCAL ===" -ForegroundColor Green

Write-Host "`n🔍 Verificando portas..." -ForegroundColor Yellow

# Verificar porta 5173
$port5173 = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
if ($port5173) {
    Write-Host "✅ Porta 5173: EM USO" -ForegroundColor Green
    Write-Host "   Processo: $($port5173.OwningProcess)" -ForegroundColor White
} else {
    Write-Host "❌ Porta 5173: LIVRE" -ForegroundColor Red
}

# Verificar porta 5174
$port5174 = Get-NetTCPConnection -LocalPort 5174 -ErrorAction SilentlyContinue
if ($port5174) {
    Write-Host "✅ Porta 5174: EM USO" -ForegroundColor Green
    Write-Host "   Processo: $($port5174.OwningProcess)" -ForegroundColor White
} else {
    Write-Host "❌ Porta 5174: LIVRE" -ForegroundColor Red
}

Write-Host "`n🧪 Testando URLs..." -ForegroundColor Yellow

# Testar http://localhost:5173
try {
    $response5173 = Invoke-WebRequest -Uri "http://localhost:5173" -Method GET -TimeoutSec 5
    Write-Host "✅ http://localhost:5173: FUNCIONANDO (Status: $($response5173.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "❌ http://localhost:5173: OFFLINE ($($_.Exception.Message))" -ForegroundColor Red
}

# Testar http://localhost:5174
try {
    $response5174 = Invoke-WebRequest -Uri "http://localhost:5174" -Method GET -TimeoutSec 5
    Write-Host "✅ http://localhost:5174: FUNCIONANDO (Status: $($response5174.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "❌ http://localhost:5174: OFFLINE ($($_.Exception.Message))" -ForegroundColor Red
}

Write-Host "`n🔍 Verificando processos Node..." -ForegroundColor Yellow
$nodeProcesses = Get-Process | Where-Object {$_.ProcessName -like "*node*"}
if ($nodeProcesses) {
    Write-Host "✅ Processos Node encontrados:" -ForegroundColor Green
    foreach ($process in $nodeProcesses) {
        Write-Host "   - PID: $($process.Id), Nome: $($process.ProcessName)" -ForegroundColor White
    }
} else {
    Write-Host "❌ Nenhum processo Node encontrado" -ForegroundColor Red
}

Write-Host "`n📊 RESUMO:" -ForegroundColor Cyan
$adminWorking = $false
if ($port5173 -or $port5174) {
    $adminWorking = $true
    Write-Host "✅ Admin local: FUNCIONANDO" -ForegroundColor Green
} else {
    Write-Host "❌ Admin local: OFFLINE" -ForegroundColor Red
}

if (-not $adminWorking) {
    Write-Host "`n🎯 SOLUÇÕES:" -ForegroundColor Yellow
    Write-Host "1. Execute: .\scripts\start-admin-local.ps1" -ForegroundColor White
    Write-Host "2. Verifique se o diretório goldeouro-admin existe" -ForegroundColor White
    Write-Host "3. Execute: cd ..\goldeouro-admin && npm run dev" -ForegroundColor White
}
