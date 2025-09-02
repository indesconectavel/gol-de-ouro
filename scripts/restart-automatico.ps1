# Script de restart automático completo
Write-Host "=== RESTART AUTOMATICO COMPLETO ===" -ForegroundColor Cyan

# Parar todos os processos Node.js
Write-Host "Parando processos Node.js..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Liberar portas
Write-Host "Liberando portas..." -ForegroundColor Yellow
$ports = @(3000, 5173, 5174)
foreach ($port in $ports) {
    $process = (Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue).OwningProcess | Select-Object -Unique
    if ($process) {
        Stop-Process -Id $process -Force -ErrorAction SilentlyContinue
    }
}

Start-Sleep -Seconds 3

# Iniciar backend
Write-Host "Iniciando backend..." -ForegroundColor Cyan
Start-Process -FilePath "node" -ArgumentList "server.js" -WorkingDirectory "E:\Chute de Ouro\goldeouro-backend" -WindowStyle Hidden

Start-Sleep -Seconds 5

# Iniciar admin panel
Write-Host "Iniciando admin panel..." -ForegroundColor Cyan
Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WorkingDirectory "E:\Chute de Ouro\goldeouro-backend\goldeouro-admin" -WindowStyle Hidden

Start-Sleep -Seconds 10

# Verificar status
Write-Host "Verificando status..." -ForegroundColor Yellow

# Backend local
try {
    $backend = Invoke-RestMethod -Uri "http://localhost:3000/api/public/dashboard" -Method GET -TimeoutSec 5
    Write-Host "Backend Local: ONLINE - $($backend.users) usuarios, $($backend.games.total) jogos" -ForegroundColor Green
} catch {
    Write-Host "Backend Local: OFFLINE" -ForegroundColor Red
}

# Admin local
$admin5173 = Test-NetConnection -ComputerName localhost -Port 5173 -InformationLevel Quiet
$admin5174 = Test-NetConnection -ComputerName localhost -Port 5174 -InformationLevel Quiet

if ($admin5173) {
    Write-Host "Admin Local: ONLINE (porta 5173)" -ForegroundColor Green
    Write-Host "URL: http://localhost:5173" -ForegroundColor Cyan
} elseif ($admin5174) {
    Write-Host "Admin Local: ONLINE (porta 5174)" -ForegroundColor Green
    Write-Host "URL: http://localhost:5174" -ForegroundColor Cyan
} else {
    Write-Host "Admin Local: OFFLINE" -ForegroundColor Red
}

# Backend produção
try {
    $prodBackend = Invoke-RestMethod -Uri "https://goldeouro-backend.onrender.com/api/public/dashboard" -Method GET -TimeoutSec 10
    Write-Host "Backend Producao: ONLINE - $($prodBackend.users) usuarios, $($prodBackend.games.total) jogos" -ForegroundColor Green
} catch {
    Write-Host "Backend Producao: OFFLINE" -ForegroundColor Red
}

# Admin produção
try {
    $prodAdmin = Invoke-WebRequest -Uri "https://goldeouro-admin.vercel.app" -Method GET -TimeoutSec 10
    if ($prodAdmin.StatusCode -eq 200) {
        Write-Host "Admin Producao: ONLINE" -ForegroundColor Green
        Write-Host "URL: https://goldeouro-admin.vercel.app" -ForegroundColor Cyan
    } else {
        Write-Host "Admin Producao: ERRO ($($prodAdmin.StatusCode))" -ForegroundColor Red
    }
} catch {
    Write-Host "Admin Producao: OFFLINE" -ForegroundColor Red
}

Write-Host "`n=== RESTART CONCLUIDO ===" -ForegroundColor Cyan
