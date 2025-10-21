# DEPLOY MONITORAMENTO PRODUÇÃO - GOL DE OURO v4.5
# ================================================
# Data: 19/10/2025
# Status: DEPLOY MONITORAMENTO EM PRODUÇÃO (Windows PowerShell)

Write-Host "🚀 === DEPLOY MONITORAMENTO PRODUÇÃO - GOL DE OURO v4.5 ===" -ForegroundColor Green
Write-Host "📅 Data: $(Get-Date)" -ForegroundColor Yellow
Write-Host ""

# 1. Verificar se PM2 está instalado
try {
    pm2 --version | Out-Null
    Write-Host "✅ PM2 já está instalado" -ForegroundColor Green
} catch {
    Write-Host "📦 Instalando PM2..." -ForegroundColor Yellow
    npm install -g pm2
}

# 2. Parar monitoramento anterior (se existir)
Write-Host "🛑 Parando monitoramento anterior..." -ForegroundColor Yellow
try {
    pm2 stop goldeouro-monitor 2>$null
    pm2 delete goldeouro-monitor 2>$null
} catch {
    Write-Host "ℹ️ Nenhum monitoramento anterior encontrado" -ForegroundColor Blue
}

# 3. Criar diretório de logs
Write-Host "📁 Criando diretório de logs..." -ForegroundColor Yellow
if (!(Test-Path "logs")) { New-Item -ItemType Directory -Name "logs" }
if (!(Test-Path "monitoring")) { New-Item -ItemType Directory -Name "monitoring" }

# 4. Iniciar monitoramento com PM2
Write-Host "🚀 Iniciando monitoramento em produção..." -ForegroundColor Green
pm2 start sistema-monitoramento.js --name "goldeouro-monitor" --log "logs/monitoring.log" --error "logs/monitoring-error.log" --out "logs/monitoring-out.log" --time --restart-delay 5000 --max-restarts 10

# 5. Configurar PM2 para iniciar automaticamente
Write-Host "⚙️ Configurando PM2 para iniciar automaticamente..." -ForegroundColor Yellow
pm2 startup
pm2 save

# 6. Verificar status
Write-Host "📊 Verificando status do monitoramento..." -ForegroundColor Green
pm2 status goldeouro-monitor

# 7. Mostrar logs em tempo real (primeiros 10 segundos)
Write-Host "📋 Logs do monitoramento (primeiros 10 segundos):" -ForegroundColor Blue
Start-Job -ScriptBlock { pm2 logs goldeouro-monitor --lines 20 } | Wait-Job -Timeout 10 | Receive-Job

Write-Host ""
Write-Host "✅ === MONITORAMENTO CONFIGURADO COM SUCESSO ===" -ForegroundColor Green
Write-Host ""
Write-Host "📋 COMANDOS ÚTEIS:" -ForegroundColor Cyan
Write-Host "   Ver status: pm2 status goldeouro-monitor" -ForegroundColor White
Write-Host "   Ver logs: pm2 logs goldeouro-monitor" -ForegroundColor White
Write-Host "   Reiniciar: pm2 restart goldeouro-monitor" -ForegroundColor White
Write-Host "   Parar: pm2 stop goldeouro-monitor" -ForegroundColor White
Write-Host ""
Write-Host "📁 ARQUIVOS DE LOG:" -ForegroundColor Cyan
Write-Host "   Logs: logs/monitoring.log" -ForegroundColor White
Write-Host "   Alertas: alerts.log" -ForegroundColor White
Write-Host "   Estatísticas: monitoring-stats.json" -ForegroundColor White
Write-Host ""
Write-Host "🎯 Monitoramento ativo e funcionando em produção!" -ForegroundColor Green

