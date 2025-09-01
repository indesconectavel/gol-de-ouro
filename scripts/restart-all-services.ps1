# Script para reiniciar todos os serviços do Gol de Ouro
Write-Host "Reiniciando todos os serviços do Gol de Ouro..." -ForegroundColor Cyan

# Parar todos os processos Node.js
Write-Host "Parando processos Node.js existentes..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Liberar portas
$ports = @(3000, 5173, 5174)
foreach ($port in $ports) {
    $process = (Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue).OwningProcess | Select-Object -Unique
    if ($process) {
        Write-Host "Liberando porta $port (PID: $process)..." -ForegroundColor Yellow
        Stop-Process -Id $process -Force -ErrorAction SilentlyContinue
    } else {
        Write-Host "Porta $port já livre." -ForegroundColor Green
    }
}

Start-Sleep -Seconds 2

# Iniciar backend
Write-Host "Iniciando backend..." -ForegroundColor Cyan
Start-Process -FilePath node -ArgumentList server.js -WorkingDirectory "E:\Chute de Ouro\goldeouro-backend" -WindowStyle Hidden

Start-Sleep -Seconds 5

# Verificar se backend está rodando
$backendRunning = Test-NetConnection -ComputerName localhost -Port 3000 -InformationLevel Quiet
if ($backendRunning) {
    Write-Host "Backend rodando na porta 3000" -ForegroundColor Green
} else {
    Write-Host "Falha ao iniciar backend na porta 3000" -ForegroundColor Red
    exit 1
}

# Iniciar admin panel
Write-Host "Iniciando admin panel..." -ForegroundColor Cyan
Start-Process -FilePath npm -ArgumentList run, dev -WorkingDirectory "E:\Chute de Ouro\goldeouro-backend\goldeouro-admin" -WindowStyle Hidden

Start-Sleep -Seconds 8

# Verificar se admin está rodando
$adminRunning = Test-NetConnection -ComputerName localhost -Port 5173 -InformationLevel Quiet
if ($adminRunning) {
    Write-Host "Admin panel rodando na porta 5173" -ForegroundColor Green
    Write-Host "Acesse: http://localhost:5173" -ForegroundColor Yellow
} else {
    Write-Host "Admin panel não está na porta 5173, verificando porta 5174..." -ForegroundColor Yellow
    $adminRunning5174 = Test-NetConnection -ComputerName localhost -Port 5174 -InformationLevel Quiet
    if ($adminRunning5174) {
        Write-Host "Admin panel rodando na porta 5174" -ForegroundColor Green
        Write-Host "Acesse: http://localhost:5174" -ForegroundColor Yellow
    } else {
        Write-Host "Falha ao iniciar admin panel" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Status dos serviços:" -ForegroundColor Yellow
Write-Host "  - Backend: http://localhost:3000" -ForegroundColor White
Write-Host "  - Admin: http://localhost:5173 (ou 5174)" -ForegroundColor White
Write-Host ""
Write-Host "Dados fictícios disponíveis:" -ForegroundColor Yellow
Write-Host "  - 33 usuários" -ForegroundColor White
Write-Host "  - 5 jogos" -ForegroundColor White
Write-Host "  - 10 apostas" -ForegroundColor White
Write-Host "  - 18 jogadores na fila" -ForegroundColor White
