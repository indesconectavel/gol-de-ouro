# Script para Desativar SIMPLE_MVP - Gol de Ouro
# Data: 2025-10-01
# Versão: SIMPLE_MVP → v1.1.1 Complexo

Write-Host "🔄 DESATIVANDO SIMPLE_MVP - GOL DE OURO" -ForegroundColor Yellow
Write-Host "=======================================" -ForegroundColor Yellow

# Verificar se estamos no diretório correto
if (-not (Test-Path "goldeouro-player") -or -not (Test-Path "goldeouro-admin")) {
    Write-Host "❌ Erro: Execute este script no diretório raiz do projeto" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Diretório correto detectado" -ForegroundColor Green

# 1. Verificar se backup existe
Write-Host "🔍 Verificando backup do vercel.json complexo..." -ForegroundColor Cyan
if (-not (Test-Path "goldeouro-player\vercel-complex.json")) {
    Write-Host "❌ Backup não encontrado. Execute primeiro o rollback git:" -ForegroundColor Red
    Write-Host "   git checkout v1.1.1-complex" -ForegroundColor White
    exit 1
}

if (-not (Test-Path "goldeouro-admin\vercel-complex.json")) {
    Write-Host "❌ Backup não encontrado. Execute primeiro o rollback git:" -ForegroundColor Red
    Write-Host "   git checkout v1.1.1-complex" -ForegroundColor White
    exit 1
}

Write-Host "✅ Backup encontrado" -ForegroundColor Green

# 2. Restaurar vercel.json complexo
Write-Host "🔄 Restaurando vercel.json complexo..." -ForegroundColor Cyan
Copy-Item "goldeouro-player\vercel-complex.json" "goldeouro-player\vercel.json"
Copy-Item "goldeouro-admin\vercel-complex.json" "goldeouro-admin\vercel.json"
Write-Host "✅ Vercel.json complexo restaurado" -ForegroundColor Green

# 3. Deploy Player
Write-Host "🚀 Deploy Player..." -ForegroundColor Cyan
Set-Location "goldeouro-player"
try {
    vercel --prod --yes
    Write-Host "✅ Player deployado com sucesso" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro no deploy Player: $($_.Exception.Message)" -ForegroundColor Red
}
Set-Location ".."

# 4. Deploy Admin
Write-Host "🚀 Deploy Admin..." -ForegroundColor Cyan
Set-Location "goldeouro-admin"
try {
    vercel --prod --yes
    Write-Host "✅ Admin deployado com sucesso" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro no deploy Admin: $($_.Exception.Message)" -ForegroundColor Red
}
Set-Location ".."

# 5. Instruções pós-deploy
Write-Host ""
Write-Host "🎯 PRÓXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host "1. Teste se a imagem de fundo do admin carrega" -ForegroundColor White
Write-Host "2. Teste o fluxo completo: login → PIX → jogo → saque" -ForegroundColor White
Write-Host "3. Verifique se o Service Worker está funcionando" -ForegroundColor White
Write-Host ""
Write-Host "✅ SIMPLE_MVP DESATIVADO COM SUCESSO!" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Yellow
