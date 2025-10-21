# CONFIGURAR CREDENCIAIS SUPABASE - GOL DE OURO v4.5
Write-Host "🔧 === CONFIGURAÇÃO DE CREDENCIAIS SUPABASE ===" -ForegroundColor Green
Write-Host "📅 Data: $(Get-Date)" -ForegroundColor Yellow
Write-Host ""

Write-Host "⚠️ IMPORTANTE: Você precisa ter as credenciais do Supabase!" -ForegroundColor Red
Write-Host ""
Write-Host "📋 Para obter as credenciais:" -ForegroundColor Cyan
Write-Host "1. Acesse: https://supabase.com/dashboard" -ForegroundColor White
Write-Host "2. Selecione seu projeto 'Gol de Ouro'" -ForegroundColor White
Write-Host "3. Vá para Settings > API" -ForegroundColor White
Write-Host "4. Copie as credenciais:" -ForegroundColor White
Write-Host "   - Project URL (SUPABASE_URL)" -ForegroundColor Yellow
Write-Host "   - Service Role Key (SUPABASE_SERVICE_ROLE_KEY)" -ForegroundColor Yellow
Write-Host ""

# Solicitar credenciais
$supabaseUrl = Read-Host "Digite a SUPABASE_URL"
$supabaseServiceRoleKey = Read-Host "Digite a SUPABASE_SERVICE_ROLE_KEY"

if ($supabaseUrl -and $supabaseServiceRoleKey) {
    Write-Host ""
    Write-Host "🔧 Configurando credenciais..." -ForegroundColor Yellow
    
    # Criar arquivo .env se não existir
    if (!(Test-Path ".env")) {
        New-Item -ItemType File -Name ".env"
    }
    
    # Adicionar credenciais ao .env
    $envContent = @"
# Credenciais Supabase
SUPABASE_URL=$supabaseUrl
SUPABASE_SERVICE_ROLE_KEY=$supabaseServiceRoleKey

# Outras variáveis de ambiente
NODE_ENV=production
PORT=8080
JWT_SECRET=goldeouro_jwt_secret_2025
JWT_EXPIRES_IN=24h
BCRYPT_ROUNDS=10

# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=seu_token_mercadopago_aqui
MERCADOPAGO_PUBLIC_KEY=seu_public_key_mercadopago_aqui
"@
    
    Set-Content -Path ".env" -Value $envContent
    
    Write-Host "✅ Credenciais configuradas no arquivo .env" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 Próximos passos:" -ForegroundColor Cyan
    Write-Host "1. Aplicar schema: node aplicar-schema-supabase-automated.js" -ForegroundColor White
    Write-Host "2. Verificar health check: curl https://goldeouro-backend.fly.dev/health" -ForegroundColor White
    Write-Host "3. Confirmar que database: REAL" -ForegroundColor White
    Write-Host ""
    Write-Host "🎯 Sistema será 100% real após aplicar schema!" -ForegroundColor Green
    
} else {
    Write-Host "❌ Credenciais não fornecidas. Configure manualmente:" -ForegroundColor Red
    Write-Host "1. Edite o arquivo .env" -ForegroundColor White
    Write-Host "2. Adicione SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor White
    Write-Host "3. Execute: node aplicar-schema-supabase-automated.js" -ForegroundColor White
}

