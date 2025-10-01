# Script para Ativar SIMPLE_MVP - Gol de Ouro
# Data: 2025-10-01
# Versão: v1.1.1 Complexo → SIMPLE_MVP

Write-Host "🚀 ATIVANDO SIMPLE_MVP - GOL DE OURO" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Yellow

# Verificar se estamos no diretório correto
if (-not (Test-Path "goldeouro-player") -or -not (Test-Path "goldeouro-admin")) {
    Write-Host "❌ Erro: Execute este script no diretório raiz do projeto" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Diretório correto detectado" -ForegroundColor Green

# 1. Backup dos vercel.json atuais
Write-Host "📋 Fazendo backup dos vercel.json atuais..." -ForegroundColor Cyan
Copy-Item "goldeouro-player\vercel.json" "goldeouro-player\vercel-complex.json"
Copy-Item "goldeouro-admin\vercel.json" "goldeouro-admin\vercel-complex.json"
Write-Host "✅ Backup criado" -ForegroundColor Green

# 2. Ativar vercel.json simplificado
Write-Host "🔧 Ativando vercel.json simplificado..." -ForegroundColor Cyan
Copy-Item "goldeouro-player\vercel-simple.json" "goldeouro-player\vercel.json"
Copy-Item "goldeouro-admin\vercel-simple.json" "goldeouro-admin\vercel.json"
Write-Host "✅ Vercel.json simplificado ativado" -ForegroundColor Green

# 3. Verificar se kill-sw.html existe
Write-Host "🔍 Verificando kill-sw.html..." -ForegroundColor Cyan
if (Test-Path "goldeouro-player\public\kill-sw.html") {
    Write-Host "✅ kill-sw.html Player encontrado" -ForegroundColor Green
} else {
    Write-Host "❌ kill-sw.html Player não encontrado" -ForegroundColor Red
}

if (Test-Path "goldeouro-admin\public\kill-sw.html") {
    Write-Host "✅ kill-sw.html Admin encontrado" -ForegroundColor Green
} else {
    Write-Host "❌ kill-sw.html Admin não encontrado" -ForegroundColor Red
}

# 4. Deploy Player
Write-Host "🚀 Deploy Player..." -ForegroundColor Cyan
Set-Location "goldeouro-player"
try {
    vercel --prod --yes
    Write-Host "✅ Player deployado com sucesso" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro no deploy Player: $($_.Exception.Message)" -ForegroundColor Red
}
Set-Location ".."

# 5. Deploy Admin
Write-Host "🚀 Deploy Admin..." -ForegroundColor Cyan
Set-Location "goldeouro-admin"
try {
    vercel --prod --yes
    Write-Host "✅ Admin deployado com sucesso" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro no deploy Admin: $($_.Exception.Message)" -ForegroundColor Red
}
Set-Location ".."

# 6. Instruções pós-deploy
Write-Host ""
Write-Host "🎯 PRÓXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host "1. Acesse https://www.goldeouro.lol/kill-sw.html" -ForegroundColor White
Write-Host "2. Acesse https://admin.goldeouro.lol/kill-sw.html" -ForegroundColor White
Write-Host "3. Teste o fluxo completo: login → PIX → jogo → saque" -ForegroundColor White
Write-Host "4. Verifique se a imagem de fundo do admin carrega" -ForegroundColor White
Write-Host ""
Write-Host "✅ SIMPLE_MVP ATIVADO COM SUCESSO!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Yellow
