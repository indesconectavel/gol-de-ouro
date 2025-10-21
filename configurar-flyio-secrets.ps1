# CONFIGURAR VARIÁVEIS DE AMBIENTE NO FLY.IO - GOL DE OURO v4.5
# ================================================================
# Data: 19/10/2025
# Status: CONFIGURAÇÃO DE VARIÁVEIS DE AMBIENTE EM PRODUÇÃO

Write-Host "🚀 === CONFIGURANDO VARIÁVEIS DE AMBIENTE NO FLY.IO ===" -ForegroundColor Green
Write-Host "📅 Data: $(Get-Date)" -ForegroundColor Yellow
Write-Host ""

Write-Host "🔧 Configurando variáveis de ambiente para o servidor em produção..." -ForegroundColor Cyan
Write-Host ""

# Configurar variáveis de ambiente no Fly.io
Write-Host "📝 Executando comandos fly secrets..." -ForegroundColor Yellow

# Supabase
Write-Host "🔗 Configurando Supabase..." -ForegroundColor Blue
Write-Host "fly secrets set SUPABASE_URL=https://gayopagjdrkcmkirmfvy.supabase.co" -ForegroundColor White
Write-Host "fly secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdheW9wYWdqZHJrY21raXJtZnZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDAyMDY2OSwiZXhwIjoyMDc1NTk2NjY5fQ.BjmwUSoKDksHybO9pta71F4E5RyILNeuK_FRzxkPnqU" -ForegroundColor White

# JWT
Write-Host "🔐 Configurando JWT..." -ForegroundColor Blue
Write-Host "fly secrets set JWT_SECRET=goldeouro-secret-key-2025-ultra-secure-production-real" -ForegroundColor White
Write-Host "fly secrets set JWT_EXPIRES_IN=24h" -ForegroundColor White

# Mercado Pago
Write-Host "💳 Configurando Mercado Pago..." -ForegroundColor Blue
Write-Host "fly secrets set MERCADOPAGO_ACCESS_TOKEN=sb_publishable_-mT3EC_2o7W0ZqmkQCeHTQ_jJ6kYpzU" -ForegroundColor White
Write-Host "fly secrets set MERCADOPAGO_PUBLIC_KEY=sb_secret_m5_QZd0-czgRjHHKC9o3hQ_3xmyx3eS" -ForegroundColor White

# Outras configurações
Write-Host "⚙️ Configurando outras variáveis..." -ForegroundColor Blue
Write-Host "fly secrets set NODE_ENV=production" -ForegroundColor White
Write-Host "fly secrets set PORT=8080" -ForegroundColor White
Write-Host "fly secrets set BCRYPT_ROUNDS=12" -ForegroundColor White

Write-Host ""
Write-Host "📋 COMANDOS PARA EXECUTAR MANUALMENTE:" -ForegroundColor Cyan
Write-Host ""
Write-Host "# 1. Configurar Supabase" -ForegroundColor Yellow
Write-Host "fly secrets set SUPABASE_URL=https://gayopagjdrkcmkirmfvy.supabase.co" -ForegroundColor White
Write-Host "fly secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdheW9wYWdqZHJrY21raXJtZnZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDAyMDY2OSwiZXhwIjoyMDc1NTk2NjY5fQ.BjmwUSoKDksHybO9pta71F4E5RyILNeuK_FRzxkPnqU" -ForegroundColor White
Write-Host ""
Write-Host "# 2. Configurar JWT" -ForegroundColor Yellow
Write-Host "fly secrets set JWT_SECRET=goldeouro-secret-key-2025-ultra-secure-production-real" -ForegroundColor White
Write-Host "fly secrets set JWT_EXPIRES_IN=24h" -ForegroundColor White
Write-Host ""
Write-Host "# 3. Configurar Mercado Pago" -ForegroundColor Yellow
Write-Host "fly secrets set MERCADOPAGO_ACCESS_TOKEN=sb_publishable_-mT3EC_2o7W0ZqmkQCeHTQ_jJ6kYpzU" -ForegroundColor White
Write-Host "fly secrets set MERCADOPAGO_PUBLIC_KEY=sb_secret_m5_QZd0-czgRjHHKC9o3hQ_3xmyx3eS" -ForegroundColor White
Write-Host ""
Write-Host "# 4. Configurar outras variáveis" -ForegroundColor Yellow
Write-Host "fly secrets set NODE_ENV=production" -ForegroundColor White
Write-Host "fly secrets set PORT=8080" -ForegroundColor White
Write-Host "fly secrets set BCRYPT_ROUNDS=12" -ForegroundColor White
Write-Host ""
Write-Host "# 5. Reiniciar aplicação" -ForegroundColor Yellow
Write-Host "fly deploy" -ForegroundColor White
Write-Host ""
Write-Host "🎯 Após executar os comandos, o sistema será 100% real!" -ForegroundColor Green

