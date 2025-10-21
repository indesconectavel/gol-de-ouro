# CONFIGURAR CREDENCIAIS MERCADO PAGO REAIS - GOL DE OURO v4.5
# =============================================================
# Data: 19/10/2025
# Status: CONFIGURAÇÃO DE CREDENCIAIS REAIS DE PRODUÇÃO

Write-Host "💳 === CONFIGURANDO CREDENCIAIS MERCADO PAGO REAIS ===" -ForegroundColor Green
Write-Host "📅 Data: $(Get-Date)" -ForegroundColor Yellow
Write-Host ""

Write-Host "⚠️ PROBLEMA IDENTIFICADO:" -ForegroundColor Red
Write-Host "   Token atual: sb_publishable_ (TOKEN DE TESTE INVALIDO)" -ForegroundColor Yellow
Write-Host "   Status: 400 invalid_token" -ForegroundColor Yellow
Write-Host ""

Write-Host "🔧 SOLUÇÃO:" -ForegroundColor Cyan
Write-Host "1. Acesse: https://www.mercadopago.com.br/developers" -ForegroundColor White
Write-Host "2. Faça login na sua conta Mercado Pago" -ForegroundColor White
Write-Host "3. Vá para 'Suas integrações' > 'Aplicações'" -ForegroundColor White
Write-Host "4. Selecione sua aplicação 'Gol de Ouro'" -ForegroundColor White
Write-Host "5. Copie as credenciais REAIS:" -ForegroundColor White
Write-Host "   - Access Token (PRODUÇÃO)" -ForegroundColor Yellow
Write-Host "   - Public Key (PRODUÇÃO)" -ForegroundColor Yellow
Write-Host ""

Write-Host "📋 FORMATO DAS CREDENCIAIS REAIS:" -ForegroundColor Cyan
Write-Host "   Access Token: APP_USR-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" -ForegroundColor White
Write-Host "   Public Key: APP_USR-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" -ForegroundColor White
Write-Host ""

Write-Host "⚠️ IMPORTANTE:" -ForegroundColor Red
Write-Host "   - NÃO use tokens que começam com 'sb_' (sandbox/teste)" -ForegroundColor Yellow
Write-Host "   - Use APENAS tokens que começam com 'APP_USR-' (produção)" -ForegroundColor Yellow
Write-Host "   - Verifique se a aplicação está em modo PRODUÇÃO" -ForegroundColor Yellow
Write-Host ""

# Solicitar credenciais reais
Write-Host "🔑 Digite as credenciais REAIS do Mercado Pago:" -ForegroundColor Cyan
$accessToken = Read-Host "Access Token (APP_USR-...)"
$publicKey = Read-Host "Public Key (APP_USR-...)"

if ($accessToken -and $publicKey -and $accessToken.StartsWith("APP_USR-") -and $publicKey.StartsWith("APP_USR-")) {
    Write-Host ""
    Write-Host "🔧 Configurando credenciais reais..." -ForegroundColor Yellow
    
    # Configurar no Fly.io
    Write-Host "📝 Configurando no Fly.io..." -ForegroundColor Blue
    Write-Host "fly secrets set MERCADOPAGO_ACCESS_TOKEN=$accessToken" -ForegroundColor White
    Write-Host "fly secrets set MERCADOPAGO_PUBLIC_KEY=$publicKey" -ForegroundColor White
    
    Write-Host ""
    Write-Host "🎯 COMANDOS PARA EXECUTAR:" -ForegroundColor Cyan
    Write-Host "fly secrets set MERCADOPAGO_ACCESS_TOKEN=$accessToken" -ForegroundColor White
    Write-Host "fly secrets set MERCADOPAGO_PUBLIC_KEY=$publicKey" -ForegroundColor White
    Write-Host "fly deploy" -ForegroundColor White
    Write-Host ""
    Write-Host "✅ Após executar os comandos, o PIX será 100% real!" -ForegroundColor Green
    
} else {
    Write-Host "❌ Credenciais inválidas!" -ForegroundColor Red
    Write-Host "   Certifique-se de usar tokens que começam com 'APP_USR-'" -ForegroundColor Yellow
    Write-Host "   E que sejam de PRODUÇÃO, não de teste" -ForegroundColor Yellow
}
