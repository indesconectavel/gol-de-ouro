# 💳 ATIVAÇÃO MERCADO PAGO - PRODUÇÃO REAL
# ============================================
# Data: 27/10/2025
# Status: ATIVAÇÃO PRODUÇÃO
# Versão: v1.0.0-production

Write-Host "🚀 ATIVAÇÃO MERCADO PAGO - PRODUÇÃO REAL" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""

Write-Host "⚠️  ATENÇÃO: Você está ativando PAGAMENTOS REAIS!" -ForegroundColor Red
Write-Host "Valores REAIS serão cobrados, não é mais simulação!" -ForegroundColor Red
Write-Host ""

$confirma = Read-Host "Digite 'CONFIRMO' para continuar"
if ($confirma -ne "CONFIRMO") {
    Write-Host "❌ Ativação cancelada pelo usuário" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "📋 INSTRUÇÕES:" -ForegroundColor Cyan
Write-Host "1. Acesse: https://www.mercadopago.com.br/developers" -ForegroundColor White
Write-Host "2. Faça login na sua conta" -ForegroundColor White
Write-Host "3. Vá em 'Suas integrações' > Sua aplicação > 'Credenciais'" -ForegroundColor White
Write-Host "4. Selecione 'PRODUÇÃO' (não TESTE!)" -ForegroundColor White
Write-Host "5. Copie o Access Token (deve começar com APP_USR-)" -ForegroundColor White
Write-Host "6. Copie a Public Key (deve começar com APP_USR-)" -ForegroundColor White
Write-Host ""

# Solicitar credenciais
$MercadoPagoAccessToken = Read-Host "➡️ Digite o Access Token de PRODUÇÃO do Mercado Pago (APP_USR-...)"
$MercadoPagoPublicKey = Read-Host "➡️ Digite a Public Key de PRODUÇÃO do Mercado Pago (APP_USR-...)"
$MercadoPagoWebhookSecret = Read-Host "➡️ Digite o Webhook Secret do Mercado Pago (opcional, pressione Enter para pular)"

# Validar credenciais
if (-not $MercadoPagoAccessToken.StartsWith("APP_USR-")) {
    Write-Host ""
    Write-Host "❌ ERRO: Access Token deve começar com 'APP_USR-'" -ForegroundColor Red
    Write-Host "Você provavelmente copiou credenciais de TESTE!" -ForegroundColor Red
    Write-Host "Acesse: https://www.mercadopago.com.br/developers e obtenha credenciais de PRODUÇÃO" -ForegroundColor Yellow
    exit 1
}

if (-not $MercadoPagoPublicKey.StartsWith("APP_USR-")) {
    Write-Host ""
    Write-Host "❌ ERRO: Public Key deve começar com 'APP_USR-'" -ForegroundColor Red
    Write-Host "Você provavelmente copiou credenciais de TESTE!" -ForegroundColor Red
    Write-Host "Acesse: https://www.mercadopago.com.br/developers e obtenha credenciais de PRODUÇÃO" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "✅ Configurando secrets no Fly.io para 'goldeouro-backend-v2'..." -ForegroundColor Green

# Configurar Access Token
Write-Host "Configurando MERCADOPAGO_ACCESS_TOKEN..." -ForegroundColor Cyan
flyctl secrets set MERCADOPAGO_ACCESS_TOKEN="$MercadoPagoAccessToken" --app goldeouro-backend-v2
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao configurar MERCADOPAGO_ACCESS_TOKEN." -ForegroundColor Red
    exit 1
}

# Configurar Public Key
Write-Host "Configurando MERCADOPAGO_PUBLIC_KEY..." -ForegroundColor Cyan
flyctl secrets set MERCADOPAGO_PUBLIC_KEY="$MercadoPagoPublicKey" --app goldeouro-backend-v2
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao configurar MERCADOPAGO_PUBLIC_KEY." -ForegroundColor Red
    exit 1
}

# Configurar Webhook Secret (se fornecido)
if (-not [string]::IsNullOrEmpty($MercadoPagoWebhookSecret)) {
    Write-Host "Configurando MERCADOPAGO_WEBHOOK_SECRET..." -ForegroundColor Cyan
    flyctl secrets set MERCADOPAGO_WEBHOOK_SECRET="$MercadoPagoWebhookSecret" --app goldeouro-backend-v2
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erro ao configurar MERCADOPAGO_WEBHOOK_SECRET." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "ℹ️ Webhook Secret não fornecido, pulando configuração." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 SECRETS DO MERCADO PAGO CONFIGURADOS COM SUCESSO!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 PRÓXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host "1. Fazer deploy do backend:" -ForegroundColor White
Write-Host "   cd goldeouro-backend" -ForegroundColor Gray
Write-Host "   flyctl deploy --app goldeouro-backend-v2" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Configurar webhooks no painel Mercado Pago:" -ForegroundColor White
Write-Host "   - URL: https://goldeouro-backend-v2.fly.dev/api/payments/webhook" -ForegroundColor Gray
Write-Host "   - Evento: payment" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Testar pagamento real (pequeno valor)" -ForegroundColor White
Write-Host "4. Monitorar logs do backend" -ForegroundColor White
Write-Host ""
Write-Host "⚠️ Lembre-se: Pagamentos agora são REAIS!" -ForegroundColor Yellow
Write-Host ""
