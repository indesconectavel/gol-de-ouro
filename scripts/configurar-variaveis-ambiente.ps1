Write-Host "=== CONFIGURAÇÃO DE VARIÁVEIS DE AMBIENTE ===" -ForegroundColor Red
Write-Host ""

Write-Host "🎯 CONFIGURANDO VARIÁVEIS REAIS DE PRODUÇÃO" -ForegroundColor Green
Write-Host ""

# Verificar se está logado no Fly.io
Write-Host "1. VERIFICANDO LOGIN NO FLY.IO:" -ForegroundColor Cyan
try {
    $whoami = flyctl auth whoami 2>$null
    if ($whoami) {
        Write-Host "  ✅ Logado como: $whoami" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Não está logado no Fly.io" -ForegroundColor Red
        Write-Host "  Execute: flyctl auth login" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "  ❌ Erro ao verificar login: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n2. CONFIGURANDO MP_PUBLIC_KEY:" -ForegroundColor Cyan
Write-Host "⚠️ ATENÇÃO: Você precisa ter a Public Key do Mercado Pago" -ForegroundColor Yellow
Write-Host "1. Acesse: https://www.mercadopago.com.br/developers" -ForegroundColor White
Write-Host "2. Sua aplicação → Credenciais → PRODUÇÃO" -ForegroundColor White
Write-Host "3. Copie a Public Key (começa com APP_USR-)" -ForegroundColor White
Write-Host "4. Cole abaixo:" -ForegroundColor White

$mpPublicKey = Read-Host "Digite a MP_PUBLIC_KEY"
if ($mpPublicKey -and $mpPublicKey.StartsWith("APP_USR-")) {
    try {
        flyctl secrets set MP_PUBLIC_KEY="$mpPublicKey" --app goldeouro-backend-v2
        Write-Host "  ✅ MP_PUBLIC_KEY configurada com sucesso!" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ Erro ao configurar MP_PUBLIC_KEY: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "  ❌ Public Key inválida ou vazia" -ForegroundColor Red
}

Write-Host "`n3. VERIFICANDO DATABASE_URL:" -ForegroundColor Cyan
Write-Host "⚠️ ATENÇÃO: Você precisa ter a DATABASE_URL do Supabase" -ForegroundColor Yellow
Write-Host "1. Acesse: https://supabase.com/dashboard" -ForegroundColor White
Write-Host "2. Seu projeto → Settings → Database" -ForegroundColor White
Write-Host "3. Copie a Connection string (postgresql://...)" -ForegroundColor White
Write-Host "4. Cole abaixo:" -ForegroundColor White

$databaseUrl = Read-Host "Digite a DATABASE_URL"
if ($databaseUrl -and $databaseUrl.StartsWith("postgresql://")) {
    try {
        flyctl secrets set DATABASE_URL="$databaseUrl" --app goldeouro-backend-v2
        Write-Host "  ✅ DATABASE_URL configurada com sucesso!" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ Erro ao configurar DATABASE_URL: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "  ❌ DATABASE_URL inválida ou vazia" -ForegroundColor Red
}

Write-Host "`n4. VERIFICANDO MP_ACCESS_TOKEN:" -ForegroundColor Cyan
Write-Host "⚠️ ATENÇÃO: Você precisa ter o Access Token do Mercado Pago" -ForegroundColor Yellow
Write-Host "1. Acesse: https://www.mercadopago.com.br/developers" -ForegroundColor White
Write-Host "2. Sua aplicação → Credenciais → PRODUÇÃO" -ForegroundColor White
Write-Host "3. Copie o Access Token (começa com APP_USR-)" -ForegroundColor White
Write-Host "4. Cole abaixo:" -ForegroundColor White

$mpAccessToken = Read-Host "Digite o MP_ACCESS_TOKEN"
if ($mpAccessToken -and $mpAccessToken.StartsWith("APP_USR-")) {
    try {
        flyctl secrets set MP_ACCESS_TOKEN="$mpAccessToken" --app goldeouro-backend-v2
        Write-Host "  ✅ MP_ACCESS_TOKEN configurado com sucesso!" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ Erro ao configurar MP_ACCESS_TOKEN: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "  ❌ Access Token inválido ou vazio" -ForegroundColor Red
}

Write-Host "`n5. VERIFICANDO CONFIGURAÇÕES:" -ForegroundColor Cyan
$secrets = flyctl secrets list --app goldeouro-backend-v2
Write-Host "$secrets" -ForegroundColor White

Write-Host "`n6. FAZENDO DEPLOY:" -ForegroundColor Cyan
Write-Host "Iniciando deploy com as novas configurações..." -ForegroundColor White
try {
    flyctl deploy --app goldeouro-backend-v2
    Write-Host "  ✅ Deploy realizado com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Erro no deploy: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n7. REINICIANDO APLICAÇÃO:" -ForegroundColor Cyan
Write-Host "Reiniciando para aplicar as novas configurações..." -ForegroundColor White
try {
    flyctl machine restart --app goldeouro-backend-v2
    Write-Host "  ✅ Aplicação reiniciada com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Erro ao reiniciar: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n8. AGUARDANDO ESTABILIZAÇÃO:" -ForegroundColor Cyan
Write-Host "Aguardando 30 segundos para a aplicação estabilizar..." -ForegroundColor White
Start-Sleep 30

Write-Host "`n9. TESTANDO FUNCIONALIDADES:" -ForegroundColor Cyan
Write-Host "Testando se as funcionalidades estão funcionando..." -ForegroundColor White

# Teste de Health
Write-Host "`n9.1. TESTE DE HEALTH:" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest "https://goldeouro-backend-v2.fly.dev/health" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "  ✅ Health Check: OK" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Health Check: FALHOU" -ForegroundColor Red
    }
} catch {
    Write-Host "  ❌ Health Check: ERRO - $($_.Exception.Message)" -ForegroundColor Red
}

# Teste de Cadastro
Write-Host "`n9.2. TESTE DE CADASTRO:" -ForegroundColor Yellow
try {
    $userData = @{
        name = "Jogador Teste Config"
        email = "jogador.teste.config@example.com"
        password = "senha123456"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest "https://goldeouro-backend-v2.fly.dev/auth/register" -Method POST -Body $userData -ContentType "application/json" -UseBasicParsing -TimeoutSec 10
    
    if ($response.StatusCode -eq 201) {
        Write-Host "  ✅ Cadastro: FUNCIONANDO!" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Cadastro: FALHANDO - Status: $($response.StatusCode)" -ForegroundColor Red
        Write-Host "  Response: $($response.Content)" -ForegroundColor White
    }
} catch {
    Write-Host "  ❌ Cadastro: ERRO - $($_.Exception.Message)" -ForegroundColor Red
}

# Teste de PIX
Write-Host "`n9.3. TESTE DE PIX:" -ForegroundColor Yellow
try {
    $pixData = @{
        amount = 25
        user_id = 1
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest "https://goldeouro-backend-v2.fly.dev/api/payments/pix/criar" -Method POST -Body $pixData -ContentType "application/json" -UseBasicParsing -TimeoutSec 10
    
    if ($response.StatusCode -eq 200) {
        $pixResponse = $response.Content | ConvertFrom-Json
        if ($pixResponse.init_point -or $pixResponse.qr_code) {
            Write-Host "  ✅ PIX: FUNCIONANDO (REAL)!" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️ PIX: FUNCIONANDO (SIMULADO)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  ❌ PIX: FALHANDO - Status: $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "  ❌ PIX: ERRO - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 CONFIGURAÇÃO CONCLUÍDA!" -ForegroundColor Green
Write-Host "Verifique os resultados dos testes acima." -ForegroundColor White
Write-Host "Se tudo estiver funcionando, o sistema está pronto para jogadores reais!" -ForegroundColor Green
