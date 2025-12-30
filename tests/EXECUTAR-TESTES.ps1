# Script PowerShell para Executar Testes Automatizados
# FASE 2.5 - Testes Funcionais em Staging

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🧪 EXECUTANDO TESTES AUTOMATIZADOS - FASE 2.5" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Verificar se Node.js está instalado
try {
    $nodeVersion = node -v
    Write-Host "✅ Node.js $nodeVersion detectado" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js não encontrado. Por favor, instale Node.js >= 18.0.0" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Verificar se dependências estão instaladas
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Instalando dependências..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

# Executar testes
Write-Host "🚀 Iniciando execução dos testes..." -ForegroundColor Cyan
Write-Host ""

node runner.js

$EXIT_CODE = $LASTEXITCODE

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan

if ($EXIT_CODE -eq 0) {
    Write-Host "✅ Testes concluídos com sucesso!" -ForegroundColor Green
    Write-Host "📄 Relatório disponível em: tests/reports/latest-report.md" -ForegroundColor Green
} else {
    Write-Host "❌ Alguns testes falharam. Verifique o relatório para detalhes." -ForegroundColor Red
    Write-Host "📄 Relatório disponível em: tests/reports/latest-report.md" -ForegroundColor Yellow
}

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan

exit $EXIT_CODE

