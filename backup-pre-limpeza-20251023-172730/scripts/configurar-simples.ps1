Write-Host "=== CONFIGURACAO RAPIDA DE PRODUCAO ===" -ForegroundColor Red
Write-Host ""

Write-Host "CONFIGURANDO VARIAVEIS REAIS" -ForegroundColor Green
Write-Host ""

# Verificar secrets atuais
Write-Host "1. SECRETS ATUAIS:" -ForegroundColor Cyan
flyctl secrets list --app goldeouro-backend-v2

Write-Host "`n2. CONFIGURAR MP_PUBLIC_KEY:" -ForegroundColor Cyan
Write-Host "Execute: flyctl secrets set MP_PUBLIC_KEY='SUA_PUBLIC_KEY_AQUI' --app goldeouro-backend-v2" -ForegroundColor White

Write-Host "`n3. CONFIGURAR DATABASE_URL:" -ForegroundColor Cyan
Write-Host "Execute: flyctl secrets set DATABASE_URL='SUA_DATABASE_URL_AQUI' --app goldeouro-backend-v2" -ForegroundColor White

Write-Host "`n4. CONFIGURAR MP_ACCESS_TOKEN:" -ForegroundColor Cyan
Write-Host "Execute: flyctl secrets set MP_ACCESS_TOKEN='SEU_ACCESS_TOKEN_AQUI' --app goldeouro-backend-v2" -ForegroundColor White

Write-Host "`n5. FAZER DEPLOY:" -ForegroundColor Cyan
Write-Host "Execute: flyctl deploy --app goldeouro-backend-v2" -ForegroundColor White

Write-Host "`n6. REINICIAR:" -ForegroundColor Cyan
Write-Host "Execute: flyctl machine restart --app goldeouro-backend-v2" -ForegroundColor White

Write-Host "`n7. TESTAR:" -ForegroundColor Cyan
Write-Host "Execute: powershell -ExecutionPolicy Bypass -File scripts/teste-final-validacao.ps1" -ForegroundColor White

Write-Host "`nCHECKLIST:" -ForegroundColor Yellow
Write-Host "1. Configurar MP_PUBLIC_KEY" -ForegroundColor White
Write-Host "2. Configurar DATABASE_URL" -ForegroundColor White
Write-Host "3. Configurar MP_ACCESS_TOKEN" -ForegroundColor White
Write-Host "4. Fazer deploy" -ForegroundColor White
Write-Host "5. Reiniciar aplicacao" -ForegroundColor White
Write-Host "6. Testar funcionalidades" -ForegroundColor White

Write-Host "`nCONFIGURACAO CONCLUIDA!" -ForegroundColor Green
