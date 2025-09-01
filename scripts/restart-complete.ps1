# Script para restart completo do sistema
Write-Host "🚀 Restart completo do sistema Gol de Ouro..." -ForegroundColor Cyan

# Parar todos os processos Node.js
Write-Host "🛑 Parando todos os processos Node.js..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Liberar portas
Write-Host "🔓 Liberando portas 3000, 5173, 5174..." -ForegroundColor Yellow
$ports = @(3000, 5173, 5174)
foreach ($port in $ports) {
    $process = (Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue).OwningProcess | Select-Object -Unique
    if ($process) {
        Write-Host "  - Liberando porta $port (PID: $process)" -ForegroundColor Yellow
        Stop-Process -Id $process -Force -ErrorAction SilentlyContinue
    }
}

Start-Sleep -Seconds 2

# Iniciar backend
Write-Host "🚀 Iniciando backend..." -ForegroundColor Cyan
Start-Process -FilePath "node" -ArgumentList "server.js" -WorkingDirectory "E:\Chute de Ouro\goldeouro-backend" -WindowStyle Hidden

Start-Sleep -Seconds 5

# Verificar backend
$backendRunning = Test-NetConnection -ComputerName localhost -Port 3000 -InformationLevel Quiet
if ($backendRunning) {
    Write-Host "✅ Backend rodando na porta 3000" -ForegroundColor Green
} else {
    Write-Host "❌ Falha ao iniciar backend" -ForegroundColor Red
}

# Iniciar admin panel
Write-Host "🚀 Iniciando admin panel..." -ForegroundColor Cyan
Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WorkingDirectory "E:\Chute de Ouro\goldeouro-backend\goldeouro-admin" -WindowStyle Hidden

Start-Sleep -Seconds 8

# Verificar admin panel
$adminRunning5173 = Test-NetConnection -ComputerName localhost -Port 5173 -InformationLevel Quiet
$adminRunning5174 = Test-NetConnection -ComputerName localhost -Port 5174 -InformationLevel Quiet

if ($adminRunning5173) {
    Write-Host "✅ Admin panel rodando na porta 5173" -ForegroundColor Green
    Write-Host "🌐 Acesse: http://localhost:5173" -ForegroundColor Cyan
} elseif ($adminRunning5174) {
    Write-Host "✅ Admin panel rodando na porta 5174" -ForegroundColor Green
    Write-Host "🌐 Acesse: http://localhost:5174" -ForegroundColor Cyan
} else {
    Write-Host "❌ Falha ao iniciar admin panel" -ForegroundColor Red
}

# Testar endpoints
Write-Host "`n🧪 Testando endpoints..." -ForegroundColor Yellow
try {
    $dashboard = Invoke-RestMethod -Uri "http://localhost:3000/api/public/dashboard" -Method GET
    Write-Host "✅ Dashboard: $($dashboard.users) usuários, $($dashboard.games.total) jogos" -ForegroundColor Green
} catch {
    Write-Host "❌ Dashboard não respondeu" -ForegroundColor Red
}

Write-Host "`n📊 Status final:" -ForegroundColor Yellow
Write-Host "  - Backend: http://localhost:3000" -ForegroundColor White
Write-Host "  - Admin: http://localhost:5173 (ou 5174)" -ForegroundColor White
Write-Host "  - Producao: https://goldeouro-admin.vercel.app" -ForegroundColor White
