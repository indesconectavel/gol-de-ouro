# Script para iniciar o servidor Gol de Ouro em background
# =====================================================

Write-Host "=== INICIANDO SERVIDOR GOL DE OURO ===" -ForegroundColor Green
Write-Host "Parando servidor anterior..." -ForegroundColor Yellow

# Parar servidor anterior se estiver rodando
taskkill /F /IM node.exe 2>$null
Start-Sleep -Seconds 2

Write-Host "Iniciando servidor em background..." -ForegroundColor Yellow

# Iniciar servidor em background
Start-Process -FilePath "node" -ArgumentList "server-fly.js" -WindowStyle Hidden

Write-Host "✅ Servidor iniciado em background!" -ForegroundColor Green
Write-Host "📊 Para ver os logs, execute: Get-Process node | Select-Object Id,ProcessName" -ForegroundColor Cyan
Write-Host "🛑 Para parar o servidor, execute: taskkill /F /IM node.exe" -ForegroundColor Red
Write-Host "🌐 Servidor rodando em: http://localhost:8080" -ForegroundColor Blue

# Aguardar um pouco para ver se há erros iniciais
Start-Sleep -Seconds 3

Write-Host "=== SERVIDOR INICIADO COM SUCESSO ===" -ForegroundColor Green
