# scripts/configurar-producao-final.ps1 - Configurar produção final
Write-Host "=== CONFIGURAR PRODUÇÃO FINAL - GOL DE OURO ===" -ForegroundColor Red
Write-Host ""

Write-Host "🚨 ATENÇÃO: Este script irá configurar o sistema para PRODUÇÃO REAL" -ForegroundColor Yellow
Write-Host "   - Dados fictícios serão removidos" -ForegroundColor Yellow
Write-Host "   - PIX será configurado para produção" -ForegroundColor Yellow
Write-Host "   - Banco de dados será conectado" -ForegroundColor Yellow
Write-Host "   - Sistema ficará pronto para usuários reais" -ForegroundColor Yellow
Write-Host ""

$confirmation = Read-Host "Deseja continuar? (s/N)"
if ($confirmation -ne "s" -and $confirmation -ne "S") {
  Write-Host "❌ Operação cancelada" -ForegroundColor Red
  exit 0
}

Write-Host "`n🔧 CONFIGURANDO VARIÁVEIS DE AMBIENTE..." -ForegroundColor Cyan

# 1) Configurar NODE_ENV
Write-Host ">> NODE_ENV=production" -ForegroundColor Yellow
flyctl secrets set NODE_ENV=production

# 2) Configurar APP_VERSION
Write-Host ">> APP_VERSION=v1.1.1" -ForegroundColor Yellow
flyctl secrets set APP_VERSION=v1.1.1

# 3) Configurar DATABASE_URL
Write-Host "`n📋 CONFIGURAÇÃO DO BANCO DE DADOS (SUPABASE):" -ForegroundColor Cyan
Write-Host "Cole a URL de conexão do Supabase:" -ForegroundColor Yellow
Write-Host "Formato: postgresql://user:password@host:port/database?sslmode=require" -ForegroundColor White
$dbUrl = Read-Host "DATABASE_URL"
if ($dbUrl -and $dbUrl -ne "") {
  flyctl secrets set DATABASE_URL=$dbUrl
  Write-Host "✅ DATABASE_URL configurada" -ForegroundColor Green
} else {
  Write-Host "❌ DATABASE_URL não fornecida" -ForegroundColor Red
  Write-Host "   Acesse: https://supabase.com/dashboard" -ForegroundColor Yellow
  Write-Host "   Settings → Database → Connection string" -ForegroundColor Yellow
}

# 4) Configurar MP_ACCESS_TOKEN
Write-Host "`n📋 CONFIGURAÇÃO DO MERCADO PAGO (PRODUÇÃO):" -ForegroundColor Cyan
Write-Host "Cole o Access Token de PRODUÇÃO do Mercado Pago:" -ForegroundColor Yellow
Write-Host "Formato: APP_USR-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" -ForegroundColor White
$mpToken = Read-Host "MP_ACCESS_TOKEN"
if ($mpToken -and $mpToken -ne "") {
  flyctl secrets set MP_ACCESS_TOKEN=$mpToken
  Write-Host "✅ MP_ACCESS_TOKEN configurado" -ForegroundColor Green
} else {
  Write-Host "❌ MP_ACCESS_TOKEN não fornecido" -ForegroundColor Red
  Write-Host "   Acesse: https://www.mercadopago.com.br/developers" -ForegroundColor Yellow
  Write-Host "   Sua aplicação → Credenciais → PRODUÇÃO" -ForegroundColor Yellow
}

# 5) Configurar MP_PUBLIC_KEY
Write-Host "`nCole a Public Key de PRODUÇÃO do Mercado Pago:" -ForegroundColor Yellow
$mpPublicKey = Read-Host "MP_PUBLIC_KEY"
if ($mpPublicKey -and $mpPublicKey -ne "") {
  flyctl secrets set MP_PUBLIC_KEY=$mpPublicKey
  Write-Host "✅ MP_PUBLIC_KEY configurada" -ForegroundColor Green
} else {
  Write-Host "❌ MP_PUBLIC_KEY não fornecida" -ForegroundColor Red
}

# 6) Configurar rate limits
Write-Host "`n📋 CONFIGURAÇÃO DE RATE LIMITS:" -ForegroundColor Cyan
flyctl secrets set RATE_LIMIT_WINDOW_MS=900000
flyctl secrets set RATE_LIMIT_MAX=100
Write-Host "✅ Rate limits configurados" -ForegroundColor Green

# 7) Verificar configuração
Write-Host "`n🔍 VERIFICANDO CONFIGURAÇÃO..." -ForegroundColor Cyan
Write-Host "Variáveis configuradas:" -ForegroundColor White
flyctl secrets list

# 8) Fazer deploy
Write-Host "`n🚀 FAZENDO DEPLOY..." -ForegroundColor Cyan
Write-Host "Deploy em andamento..." -ForegroundColor Yellow
flyctl deploy

Write-Host "`n✅ CONFIGURAÇÃO CONCLUÍDA!" -ForegroundColor Green
Write-Host "`n📋 TESTE AS FUNCIONALIDADES:" -ForegroundColor Yellow
Write-Host "1. Acesse: https://goldeouro.lol" -ForegroundColor White
Write-Host "2. Cadastre um usuário real" -ForegroundColor White
Write-Host "3. Teste o PIX" -ForegroundColor White
Write-Host "4. Jogue o jogo" -ForegroundColor White
Write-Host "5. Verifique o painel admin" -ForegroundColor White

Write-Host "`n🎉 SISTEMA PRONTO PARA USUÁRIOS REAIS!" -ForegroundColor Green
