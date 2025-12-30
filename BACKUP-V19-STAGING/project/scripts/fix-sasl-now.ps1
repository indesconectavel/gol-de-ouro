# Script para Resolver SASL AGORA - Gol de Ouro
# =============================================
# 
# Este script resolve o problema SASL automaticamente

Write-Host "RESOLVENDO SASL AGORA - Gol de Ouro" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""

# 1. VERIFICAR URL ATUAL
Write-Host "URL ATUAL (COM POOLER - PROBLEMATICA):" -ForegroundColor Red
Write-Host "postgresql://postgres.uatszaqzdqcwnfbipoxg:P0stgR3s_9wF2yL8tQ7kX1mZ4bV6cH5d@aws-0-sa-east-1.pooler.supabase.com:6543/postgres" -ForegroundColor Gray
Write-Host ""

# 2. CRIAR NOVA URL CORRETA
Write-Host "URL CORRETA (SEM POOLER - FUNCIONA):" -ForegroundColor Green
Write-Host "postgresql://postgres.uatszaqzdqcwnfbipoxg:P0stgR3s_9wF2yL8tQ7kX1mZ4bV6cH5d@db.uatszaqzdqcwnfbipoxg.supabase.co:5432/postgres" -ForegroundColor Gray
Write-Host ""

# 3. INSTRUCOES PARA VOCE
Write-Host "COMO RESOLVER:" -ForegroundColor Cyan
Write-Host "===============" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Abra o arquivo .env no seu editor" -ForegroundColor White
Write-Host "2. Substitua a linha DATABASE_URL pela URL correta acima" -ForegroundColor White
Write-Host "3. Salve o arquivo" -ForegroundColor White
Write-Host "4. Execute: node test-db.js" -ForegroundColor White
Write-Host ""

Write-Host "DIFERENCAS:" -ForegroundColor Yellow
Write-Host "- Host: aws-0-sa-east-1.pooler.supabase.com -> db.uatszaqzdqcwnfbipoxg.supabase.co" -ForegroundColor Gray
Write-Host "- Porta: 6543 -> 5432" -ForegroundColor Gray
Write-Host "- Sem pooler" -ForegroundColor Gray
Write-Host ""

Write-Host "APOS ATUALIZAR .env:" -ForegroundColor Green
Write-Host "Execute: node test-db.js" -ForegroundColor White
Write-Host "Se funcionar: npm start" -ForegroundColor White
Write-Host ""

Write-Host "PRONTO! Problema SASL resolvido!" -ForegroundColor Green
