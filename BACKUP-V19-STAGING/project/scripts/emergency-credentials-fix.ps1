# Script de emergência para corrigir credenciais expostas
Write-Host "=== CORREÇÃO DE EMERGÊNCIA - CREDENCIAIS EXPOSTAS ===" -ForegroundColor Red

Write-Host "`n🚨 ALERTA DE SEGURANÇA:" -ForegroundColor Red
Write-Host "PostgreSQL URI foi exposta no GitHub!" -ForegroundColor Red
Write-Host "Data: 1º de setembro de 2025, 22:46:08 UTC" -ForegroundColor Red

Write-Host "`n📋 AÇÕES NECESSÁRIAS:" -ForegroundColor Yellow
Write-Host "1. Gerar nova senha no Supabase" -ForegroundColor White
Write-Host "2. Atualizar DATABASE_URL no .env" -ForegroundColor White
Write-Host "3. Remover credenciais expostas do GitHub" -ForegroundColor White
Write-Host "4. Testar nova conexão" -ForegroundColor White

Write-Host "`n🔗 LINKS IMPORTANTES:" -ForegroundColor Cyan
Write-Host "- Supabase Dashboard: https://supabase.com/dashboard" -ForegroundColor White
Write-Host "- GitGuardian: https://app.gitguardian.com" -ForegroundColor White
Write-Host "- GitHub Repository: https://github.com/indesconectavel/goldeouro-backend" -ForegroundColor White

Write-Host "`n⚠️  INSTRUÇÕES:" -ForegroundColor Yellow
Write-Host "1. Acesse o Supabase Dashboard" -ForegroundColor White
Write-Host "2. Vá em Settings > Database" -ForegroundColor White
Write-Host "3. Clique em 'Reset database password'" -ForegroundColor White
Write-Host "4. Copie a nova DATABASE_URL" -ForegroundColor White
Write-Host "5. Execute: .\scripts\update-credentials.ps1" -ForegroundColor White

Write-Host "`n🚨 URGENTE: Faça isso AGORA para evitar comprometimento!" -ForegroundColor Red
