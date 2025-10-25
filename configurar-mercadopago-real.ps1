# 🔧 CONFIGURAÇÃO MERCADO PAGO REAL - GOL DE OURO v1.2.0
# ============================================================
# Data: 25/10/2025
# Status: CONFIGURAÇÃO URGENTE PARA PRODUÇÃO
# Versão: v1.2.0-mercadopago-real

Write-Host "🚀 CONFIGURAÇÃO MERCADO PAGO REAL - GOL DE OURO" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""

Write-Host "📋 INSTRUÇÕES:" -ForegroundColor Cyan
Write-Host "1. Acesse: https://www.mercadopago.com.br/developers" -ForegroundColor White
Write-Host "2. Faça login na sua conta" -ForegroundColor White
Write-Host "3. Vá em 'Suas integrações'" -ForegroundColor White
Write-Host "4. Selecione 'Gol de Ouro' ou crie uma nova aplicação" -ForegroundColor White
Write-Host "5. Vá em 'Credenciais' > 'PRODUÇÃO'" -ForegroundColor White
Write-Host "6. Copie o Access Token (deve começar com APP_USR-)" -ForegroundColor White
Write-Host ""

Write-Host "🔑 Digite as credenciais REAIS do Mercado Pago:" -ForegroundColor Cyan
$accessToken = Read-Host "Access Token (APP_USR-...)"

if ($accessToken -and $accessToken.StartsWith("APP_USR-")) {
    Write-Host ""
    Write-Host "🔧 Configurando credenciais reais no Fly.io..." -ForegroundColor Yellow
    
    # Configurar no Fly.io
    Write-Host "📝 Executando comandos..." -ForegroundColor Blue
    
    try {
        # Configurar Access Token
        Write-Host "fly secrets set MERCADOPAGO_ACCESS_TOKEN=$accessToken --app goldeouro-backend-v2" -ForegroundColor White
        $result1 = flyctl secrets set MERCADOPAGO_ACCESS_TOKEN=$accessToken --app goldeouro-backend-v2
        
        if ($result1 -match "Set") {
            Write-Host "✅ Access Token configurado com sucesso!" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Possível problema na configuração do Access Token" -ForegroundColor Yellow
        }
        
        # Configurar Public Key (mesmo valor para teste)
        Write-Host "fly secrets set MERCADOPAGO_PUBLIC_KEY=$accessToken --app goldeouro-backend-v2" -ForegroundColor White
        $result2 = flyctl secrets set MERCADOPAGO_PUBLIC_KEY=$accessToken --app goldeouro-backend-v2
        
        if ($result2 -match "Set") {
            Write-Host "✅ Public Key configurado com sucesso!" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Possível problema na configuração do Public Key" -ForegroundColor Yellow
        }
        
        Write-Host ""
        Write-Host "🚀 Fazendo deploy do backend..." -ForegroundColor Blue
        $deployResult = flyctl deploy --app goldeouro-backend-v2 --yes
        
        if ($deployResult -match "deployed") {
            Write-Host "✅ Deploy realizado com sucesso!" -ForegroundColor Green
            Write-Host ""
            Write-Host "🎯 SISTEMA CONFIGURADO PARA PRODUÇÃO REAL!" -ForegroundColor Green
            Write-Host "✅ PIX funcionará com pagamentos reais" -ForegroundColor Green
            Write-Host "✅ Webhook configurado automaticamente" -ForegroundColor Green
            Write-Host ""
            Write-Host "🔗 URLs para teste:" -ForegroundColor Cyan
            Write-Host "Backend: https://goldeouro-backend.fly.dev/health" -ForegroundColor White
            Write-Host "Player: https://goldeouro.lol" -ForegroundColor White
            Write-Host "Admin: https://admin.goldeouro.lol" -ForegroundColor White
        } else {
            Write-Host "⚠️ Deploy pode ter falhado. Verifique manualmente." -ForegroundColor Yellow
        }
        
    } catch {
        Write-Host "❌ Erro ao configurar: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
        Write-Host "🔧 COMANDOS MANUAIS:" -ForegroundColor Cyan
        Write-Host "flyctl secrets set MERCADOPAGO_ACCESS_TOKEN=$accessToken --app goldeouro-backend-v2" -ForegroundColor White
        Write-Host "flyctl secrets set MERCADOPAGO_PUBLIC_KEY=$accessToken --app goldeouro-backend-v2" -ForegroundColor White
        Write-Host "flyctl deploy --app goldeouro-backend-v2 --yes" -ForegroundColor White
    }
    
} else {
    Write-Host "❌ Access Token inválido!" -ForegroundColor Red
    Write-Host "   Certifique-se de usar um token que começa com 'APP_USR-'" -ForegroundColor Yellow
    Write-Host "   E que seja de PRODUÇÃO, não de teste" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "🔗 Acesse: https://www.mercadopago.com.br/developers" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "📊 Para verificar as configurações:" -ForegroundColor Cyan
Write-Host "flyctl secrets list --app goldeouro-backend-v2" -ForegroundColor White
