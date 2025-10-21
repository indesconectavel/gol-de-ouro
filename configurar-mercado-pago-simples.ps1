# CONFIGURAR MERCADO PAGO - GOL DE OURO v4.5
# ===========================================
# Data: 19/10/2025

Write-Host "=== CONFIGURANDO MERCADO PAGO ===" -ForegroundColor Green
Write-Host ""

Write-Host "PROBLEMA: Token atual invalido (sb_publishable_)" -ForegroundColor Red
Write-Host ""

Write-Host "SOLUCAO:" -ForegroundColor Cyan
Write-Host "1. Acesse: https://www.mercadopago.com.br/developers" -ForegroundColor White
Write-Host "2. Faca login na sua conta" -ForegroundColor White
Write-Host "3. Vá para 'Suas integracoes' > 'Aplicacoes'" -ForegroundColor White
Write-Host "4. Selecione 'Gol de Ouro'" -ForegroundColor White
Write-Host "5. Copie as credenciais REAIS:" -ForegroundColor White
Write-Host "   - Access Token (APP_USR-...)" -ForegroundColor Yellow
Write-Host "   - Public Key (APP_USR-...)" -ForegroundColor Yellow
Write-Host ""

Write-Host "IMPORTANTE:" -ForegroundColor Red
Write-Host "   - NAO use tokens que comecam com 'sb_' (teste)" -ForegroundColor Yellow
Write-Host "   - Use APENAS tokens que comecam com 'APP_USR-' (producao)" -ForegroundColor Yellow
Write-Host ""

$accessToken = Read-Host "Access Token (APP_USR-...)"
$publicKey = Read-Host "Public Key (APP_USR-...)"

if ($accessToken -and $publicKey -and $accessToken.StartsWith("APP_USR-") -and $publicKey.StartsWith("APP_USR-")) {
    Write-Host ""
    Write-Host "Configurando no Fly.io..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "COMANDOS PARA EXECUTAR:" -ForegroundColor Cyan
    Write-Host "fly secrets set MERCADOPAGO_ACCESS_TOKEN=$accessToken" -ForegroundColor White
    Write-Host "fly secrets set MERCADOPAGO_PUBLIC_KEY=$publicKey" -ForegroundColor White
    Write-Host "fly deploy" -ForegroundColor White
    Write-Host ""
    Write-Host "Apos executar, o PIX sera 100% real!" -ForegroundColor Green
} else {
    Write-Host "Credenciais invalidas!" -ForegroundColor Red
    Write-Host "Use tokens que comecam com 'APP_USR-'" -ForegroundColor Yellow
}

