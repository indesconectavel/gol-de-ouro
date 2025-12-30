# Script para Resolver SASL Manualmente - Gol de Ouro
# ===================================================
# 
# Este script guia você para resolver o problema SASL com Supabase

Write-Host "RESOLUCAO MANUAL SASL - Gol de Ouro" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""

Write-Host "PROBLEMA IDENTIFICADO:" -ForegroundColor Red
Write-Host "SASL: SCRAM-SERVER-FINAL-MESSAGE: server signature is missing" -ForegroundColor Red
Write-Host ""

Write-Host "CAUSA:" -ForegroundColor Yellow
Write-Host "URL do Supabase com pooler problemático" -ForegroundColor Yellow
Write-Host ""

Write-Host "SOLUCAO PASSO A PASO:" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. ACESSAR SUPABASE:" -ForegroundColor White
Write-Host "   - Vá para: https://supabase.com" -ForegroundColor Gray
Write-Host "   - Faça login na sua conta" -ForegroundColor Gray
Write-Host "   - Acesse o projeto goldeouro-backend" -ForegroundColor Gray
Write-Host ""

Write-Host "2. OBTER NOVA DATABASE_URL:" -ForegroundColor White
Write-Host "   - No menu lateral, clique em SETTINGS" -ForegroundColor Gray
Write-Host "   - Clique em DATABASE" -ForegroundColor Gray
Write-Host "   - Role para baixo até CONNECTION STRING" -ForegroundColor Gray
Write-Host "   - IMPORTANTE: Use a URL SEM ?pgbouncer=true" -ForegroundColor Yellow
Write-Host "   - Copie a URL que começa com postgresql://" -ForegroundColor Gray
Write-Host ""

Write-Host "3. ATUALIZAR ARQUIVO .env:" -ForegroundColor White
Write-Host "   - Abra o arquivo .env no seu editor" -ForegroundColor Gray
Write-Host "   - Substitua a linha DATABASE_URL pela nova URL" -ForegroundColor Gray
Write-Host "   - Salve o arquivo" -ForegroundColor Gray
Write-Host ""

Write-Host "4. TESTAR CONEXAO:" -ForegroundColor White
Write-Host "   - Execute: node test-db.js" -ForegroundColor Gray
Write-Host "   - Se funcionar, problema resolvido!" -ForegroundColor Green
Write-Host ""

Write-Host "5. EXECUTAR SCHEMA:" -ForegroundColor White
Write-Host "   - No Supabase Dashboard, vá em SQL EDITOR" -ForegroundColor Gray
Write-Host "   - Cole e execute o conteúdo de database-schema.sql" -ForegroundColor Gray
Write-Host "   - Verifique se as 6 tabelas foram criadas" -ForegroundColor Gray
Write-Host ""

Write-Host "EXEMPLO DE URL CORRETA:" -ForegroundColor Green
Write-Host "DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" -ForegroundColor Gray
Write-Host ""

Write-Host "EXEMPLO DE URL INCORRETA (COM POOLER):" -ForegroundColor Red
Write-Host "DATABASE_URL=postgresql://postgres:[PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true" -ForegroundColor Gray
Write-Host ""

Write-Host "DIFERENCAS IMPORTANTES:" -ForegroundColor Yellow
Write-Host "- Porta: 5432 (correta) vs 6543 (pooler)" -ForegroundColor Gray
Write-Host "- Host: db.[PROJECT-REF].supabase.co vs aws-0-sa-east-1.pooler.supabase.com" -ForegroundColor Gray
Write-Host "- Sem ?pgbouncer=true" -ForegroundColor Gray
Write-Host ""

Write-Host "APOS RESOLVER:" -ForegroundColor Green
Write-Host "1. Backend funcionando: npm start" -ForegroundColor Gray
Write-Host "2. Admin funcionando: cd goldeouro-admin && npm run dev" -ForegroundColor Gray
Write-Host "3. Sistema completo funcionando!" -ForegroundColor Green
Write-Host ""

Write-Host "PRECISA DE AJUDA?" -ForegroundColor Cyan
Write-Host "Execute este script novamente ou me pergunte!" -ForegroundColor Gray
