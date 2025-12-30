# Script de Verificação do Banco de Dados - Gol de Ouro
# =====================================================
# 
# Este script verifica a conexão com o banco e executa o schema se necessário

Write-Host "VERIFICACAO DO BANCO DE DADOS - Gol de Ouro" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""

# 1. VERIFICAR CONEXAO COM BANCO
Write-Host "Verificando conexao com banco de dados..." -ForegroundColor Yellow
try {
    node test-db.js
    Write-Host "✅ Conexao com banco OK" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro na conexao com banco" -ForegroundColor Red
    Write-Host "Verifique DATABASE_URL no .env" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# 2. VERIFICAR SE TABELAS EXISTEM
Write-Host "Verificando estrutura das tabelas..." -ForegroundColor Yellow
Write-Host "Execute o seguinte comando SQL no seu banco:" -ForegroundColor Cyan
Write-Host ""
Write-Host "psql -h seu-host -U seu-usuario -d seu-banco -f database-schema.sql" -ForegroundColor White
Write-Host ""

# 3. INSTRUCOES PARA CONFIGURAR BANCO
Write-Host "INSTRUCOES PARA CONFIGURAR BANCO:" -ForegroundColor Cyan
Write-Host "1. Acesse seu banco PostgreSQL (Supabase/Render)" -ForegroundColor White
Write-Host "2. Execute o arquivo database-schema.sql" -ForegroundColor White
Write-Host "3. Verifique se as tabelas foram criadas:" -ForegroundColor White
Write-Host "   - users" -ForegroundColor Gray
Write-Host "   - games" -ForegroundColor Gray
Write-Host "   - bets" -ForegroundColor Gray
Write-Host "   - queue_board" -ForegroundColor Gray
Write-Host "   - shot_attempts" -ForegroundColor Gray
Write-Host "   - transactions" -ForegroundColor Gray
Write-Host ""

# 4. VERIFICAR VARIAVEIS DE AMBIENTE
Write-Host "Verificando variaveis de ambiente..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "✅ Arquivo .env encontrado" -ForegroundColor Green
    Get-Content ".env" | ForEach-Object {
        if ($_ -match "^DATABASE_URL=") {
            Write-Host "   DATABASE_URL: [CONFIGURADO]" -ForegroundColor Green
        }
        if ($_ -match "^JWT_SECRET=") {
            Write-Host "   JWT_SECRET: [CONFIGURADO]" -ForegroundColor Green
        }
        if ($_ -match "^ADMIN_TOKEN=") {
            Write-Host "   ADMIN_TOKEN: [CONFIGURADO]" -ForegroundColor Green
        }
    }
} else {
    Write-Host "❌ Arquivo .env nao encontrado" -ForegroundColor Red
    Write-Host "Copie .env.example para .env e configure" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Script concluido!" -ForegroundColor Green
Write-Host "Configure o banco e execute novamente para verificar" -ForegroundColor Yellow
