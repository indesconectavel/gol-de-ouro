# Script para gerar novas credenciais seguras
Write-Host "=== GERANDO NOVAS CREDENCIAIS SEGURAS ===" -ForegroundColor Cyan

# Gerar nova senha segura
$newPassword = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 16 | ForEach-Object {[char]$_})
Write-Host "🔐 Nova senha gerada: $newPassword" -ForegroundColor Green

# URL base do Supabase (sem senha)
$baseUrl = "postgresql://postgres.uatszaqzdqcwnfbipoxg@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Nova URL completa
$newDatabaseUrl = "postgresql://postgres.uatszaqzdqcwnfbipoxg:$newPassword@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

Write-Host "`n📝 Nova DATABASE_URL:" -ForegroundColor Yellow
Write-Host $newDatabaseUrl -ForegroundColor White

# Salvar em arquivo temporário
$newDatabaseUrl | Out-File -FilePath "scripts/new-database-url.txt" -Encoding UTF8

Write-Host "`n✅ Nova URL salva em: scripts/new-database-url.txt" -ForegroundColor Green
Write-Host "`n⚠️  IMPORTANTE: Você precisa atualizar a senha no Supabase Dashboard!" -ForegroundColor Red
Write-Host "1. Acesse: https://supabase.com/dashboard" -ForegroundColor White
Write-Host "2. Vá em: Settings > Database" -ForegroundColor White
Write-Host "3. Clique em: 'Reset database password'" -ForegroundColor White
Write-Host "4. Use a senha: $newPassword" -ForegroundColor White
Write-Host "5. Execute: .\scripts\update-credentials.ps1 -NewDatabaseUrl `"$newDatabaseUrl`"" -ForegroundColor White
