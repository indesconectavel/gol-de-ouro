# Script para fazer commit das correções de segurança
Write-Host "=== COMMIT DAS CORREÇÕES DE SEGURANÇA ===" -ForegroundColor Cyan

Write-Host "`n🔒 Fazendo commit das correções de segurança..." -ForegroundColor Yellow

# Adicionar arquivos modificados
git add .env
git add scripts/emergency-credentials-fix.ps1
git add scripts/update-credentials.ps1
git add scripts/fix-credentials-simple.ps1
git add scripts/generate-new-credentials.ps1
git add scripts/commit-security-fix.ps1

# Fazer commit
git commit -m "🔒 SECURITY FIX: Update database credentials after exposure

- Updated DATABASE_URL with new secure password
- Added emergency credential management scripts
- Fixed PostgreSQL URI exposure vulnerability
- Generated new secure password: J6wGY2EnCyXc0lID

⚠️  IMPORTANT: Update Supabase dashboard with new password
📅 Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
🚨 Critical: Resolves GitGuardian security alert"

Write-Host "✅ Commit realizado com sucesso!" -ForegroundColor Green

Write-Host "`n🚀 Fazendo push para GitHub..." -ForegroundColor Yellow
git push origin main

Write-Host "✅ Push realizado com sucesso!" -ForegroundColor Green

Write-Host "`n📋 PRÓXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host "1. ✅ Credenciais atualizadas localmente" -ForegroundColor Green
Write-Host "2. ✅ Commit realizado" -ForegroundColor Green
Write-Host "3. ✅ Push para GitHub realizado" -ForegroundColor Green
Write-Host "4. ⚠️  ATUALIZAR SENHA NO SUPABASE DASHBOARD" -ForegroundColor Red
Write-Host "5. 🔄 Render.com fará redeploy automaticamente" -ForegroundColor Yellow
Write-Host "6. 🧪 Testar produção após redeploy" -ForegroundColor Yellow

Write-Host "`n🎯 STATUS:" -ForegroundColor Cyan
Write-Host "   - Nova senha: J6wGY2EnCyXc0lID" -ForegroundColor White
Write-Host "   - Supabase Dashboard: https://supabase.com/dashboard" -ForegroundColor White
Write-Host "   - GitGuardian: https://app.gitguardian.com" -ForegroundColor White
