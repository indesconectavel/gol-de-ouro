# Script para iniciar serviços do Gol de Ouro
Write-Host "🚀 Iniciando serviços do Gol de Ouro..." -ForegroundColor Green

# Parar processos existentes
Write-Host "🛑 Parando processos existentes..." -ForegroundColor Yellow
Stop-Process -Name node -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Iniciar backend
Write-Host "🔧 Iniciando backend..." -ForegroundColor Cyan
Start-Process -FilePath "node" -ArgumentList "server.js" -WorkingDirectory "E:\Chute de Ouro\goldeouro-backend" -WindowStyle Hidden
Start-Sleep -Seconds 3

# Verificar se backend está rodando
$backendStatus = Test-NetConnection -ComputerName localhost -Port 3000 -InformationLevel Quiet
if ($backendStatus) {
    Write-Host "✅ Backend rodando na porta 3000" -ForegroundColor Green
} else {
    Write-Host "❌ Backend não está rodando" -ForegroundColor Red
}

# Iniciar admin
Write-Host "🖥️ Iniciando admin panel..." -ForegroundColor Cyan
Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WorkingDirectory "E:\Chute de Ouro\goldeouro-backend\goldeouro-admin" -WindowStyle Hidden
Start-Sleep -Seconds 5

# Verificar se admin está rodando
$adminStatus = Test-NetConnection -ComputerName localhost -Port 5173 -InformationLevel Quiet
if ($adminStatus) {
    Write-Host "✅ Admin panel rodando na porta 5173" -ForegroundColor Green
} else {
    Write-Host "❌ Admin panel não está rodando" -ForegroundColor Red
}

Write-Host ""
Write-Host "🌐 URLs disponíveis:" -ForegroundColor Yellow
Write-Host "   Backend: http://localhost:3000" -ForegroundColor White
Write-Host "   Admin: http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "🔑 Token Admin: adm_8d1e3c7a5b9f2a4c6e0d1f3b7a9c5e2d" -ForegroundColor Magenta
Write-Host ""
Write-Host "✅ Serviços iniciados!" -ForegroundColor Green
