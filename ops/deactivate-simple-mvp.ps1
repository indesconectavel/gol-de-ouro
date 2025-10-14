# Desativar SIMPLE_MVP - Gol de Ouro
# Este script desativa a configuração SIMPLE_MVP e volta para v1.1.1 Complexo

Write-Host "🔄 Desativando SIMPLE_MVP - Voltando para v1.1.1 Complexo" -ForegroundColor Yellow

# 1. Restaurar configurações originais
Write-Host "📦 Restaurando configurações originais..." -ForegroundColor Blue
Copy-Item "goldeouro-player/vercel-complex.json" "goldeouro-player/vercel.json" -Force
Copy-Item "goldeouro-admin/vercel-complex.json" "goldeouro-admin/vercel.json" -Force

# 2. Deploy Player
Write-Host "🎮 Deploy Player Frontend..." -ForegroundColor Green
Set-Location "goldeouro-player"
vercel --prod --yes
Set-Location ".."

# 3. Deploy Admin
Write-Host "👨‍💼 Deploy Admin Frontend..." -ForegroundColor Green
Set-Location "goldeouro-admin"
vercel --prod --yes
Set-Location ".."

# 4. Deploy Backend sem SIMPLE_MVP
Write-Host "🔧 Deploy Backend sem SIMPLE_MVP..." -ForegroundColor Green
fly secrets unset SIMPLE_MVP --app goldeouro-backend-v2
fly deploy --app goldeouro-backend-v2

Write-Host "✅ SIMPLE_MVP desativado com sucesso!" -ForegroundColor Green
Write-Host "🔄 Sistema voltou para v1.1.1 Complexo" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 Player: https://www.goldeouro.lol" -ForegroundColor Cyan
Write-Host "🌐 Admin: https://admin.goldeouro.lol" -ForegroundColor Cyan
Write-Host "🔧 Backend: https://goldeouro-backend-v2.fly.dev" -ForegroundColor Cyan