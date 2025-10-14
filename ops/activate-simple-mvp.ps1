# Ativar SIMPLE_MVP - Gol de Ouro
# Este script ativa a configuração SIMPLE_MVP em produção

Write-Host "🚀 Ativando SIMPLE_MVP - Gol de Ouro" -ForegroundColor Yellow

# 1. Backup das configurações atuais
Write-Host "📦 Fazendo backup das configurações atuais..." -ForegroundColor Blue
Copy-Item "goldeouro-player/vercel.json" "goldeouro-player/vercel-complex.json" -Force
Copy-Item "goldeouro-admin/vercel.json" "goldeouro-admin/vercel-complex.json" -Force

# 2. Aplicar configurações SIMPLE_MVP
Write-Host "⚙️ Aplicando configurações SIMPLE_MVP..." -ForegroundColor Blue
Copy-Item "goldeouro-player/vercel-simple.json" "goldeouro-player/vercel.json" -Force
Copy-Item "goldeouro-admin/vercel-simple.json" "goldeouro-admin/vercel.json" -Force

# 3. Deploy Player
Write-Host "🎮 Deploy Player Frontend..." -ForegroundColor Green
Set-Location "goldeouro-player"
vercel --prod --yes
Set-Location ".."

# 4. Deploy Admin
Write-Host "👨‍💼 Deploy Admin Frontend..." -ForegroundColor Green
Set-Location "goldeouro-admin"
vercel --prod --yes
Set-Location ".."

# 5. Deploy Backend com SIMPLE_MVP=true
Write-Host "🔧 Deploy Backend com SIMPLE_MVP=true..." -ForegroundColor Green
fly secrets set SIMPLE_MVP=true --app goldeouro-backend-v2
fly deploy --app goldeouro-backend-v2

Write-Host "✅ SIMPLE_MVP ativado com sucesso!" -ForegroundColor Green
Write-Host "🌐 Player: https://www.goldeouro.lol" -ForegroundColor Cyan
Write-Host "🌐 Admin: https://admin.goldeouro.lol" -ForegroundColor Cyan
Write-Host "🔧 Backend: https://goldeouro-backend-v2.fly.dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Acesse https://www.goldeouro.lol/kill-sw.html" -ForegroundColor White
Write-Host "2. Acesse https://admin.goldeouro.lol/kill-sw.html" -ForegroundColor White
Write-Host "3. Teste o fluxo completo" -ForegroundColor White