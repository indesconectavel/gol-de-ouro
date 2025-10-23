Write-Host "=== CORRIGINDO PRODUÇÃO REAL - ELIMINANDO FALSOS POSITIVOS ===" -ForegroundColor Red
Write-Host ""

Write-Host "🚨 PROBLEMAS IDENTIFICADOS:" -ForegroundColor Red
Write-Host "1. DATABASE_URL - FALTANDO (cadastro/login não funcionam)" -ForegroundColor Yellow
Write-Host "2. MP_ACCESS_TOKEN - FALTANDO (PIX fake)" -ForegroundColor Yellow
Write-Host "3. MP_PUBLIC_KEY - FALTANDO (PIX fake)" -ForegroundColor Yellow
Write-Host "4. Jogadores reais não conseguem usar o sistema" -ForegroundColor Yellow
Write-Host ""

Write-Host "🔧 CONFIGURANDO VARIÁVEIS FALTANTES..." -ForegroundColor Cyan

# 1. DATABASE_URL
Write-Host "`n1. CONFIGURANDO DATABASE_URL (SUPABASE):" -ForegroundColor Yellow
Write-Host "Cole a URL de conexão do Supabase:" -ForegroundColor White
Write-Host "Formato: postgresql://user:password@host:port/database?sslmode=require" -ForegroundColor Gray
$dbUrl = Read-Host "DATABASE_URL"
if ($dbUrl -and $dbUrl -ne "") {
  flyctl secrets set DATABASE_URL=$dbUrl
  Write-Host "✅ DATABASE_URL configurada" -ForegroundColor Green
} else {
  Write-Host "❌ DATABASE_URL não fornecida" -ForegroundColor Red
  Write-Host "   Acesse: https://supabase.com/dashboard" -ForegroundColor Yellow
  Write-Host "   Settings → Database → Connection string" -ForegroundColor Yellow
}

# 2. MP_ACCESS_TOKEN
Write-Host "`n2. CONFIGURANDO MP_ACCESS_TOKEN (MERCADO PAGO):" -ForegroundColor Yellow
Write-Host "Cole o Access Token de PRODUÇÃO do Mercado Pago:" -ForegroundColor White
Write-Host "Formato: APP_USR-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" -ForegroundColor Gray
$mpToken = Read-Host "MP_ACCESS_TOKEN"
if ($mpToken -and $mpToken -ne "") {
  flyctl secrets set MP_ACCESS_TOKEN=$mpToken
  Write-Host "✅ MP_ACCESS_TOKEN configurado" -ForegroundColor Green
} else {
  Write-Host "❌ MP_ACCESS_TOKEN não fornecido" -ForegroundColor Red
  Write-Host "   Acesse: https://www.mercadopago.com.br/developers" -ForegroundColor Yellow
  Write-Host "   Sua aplicação → Credenciais → PRODUÇÃO" -ForegroundColor Yellow
}

# 3. MP_PUBLIC_KEY
Write-Host "`n3. CONFIGURANDO MP_PUBLIC_KEY (MERCADO PAGO):" -ForegroundColor Yellow
Write-Host "Cole a Public Key de PRODUÇÃO do Mercado Pago:" -ForegroundColor White
$mpPublicKey = Read-Host "MP_PUBLIC_KEY"
if ($mpPublicKey -and $mpPublicKey -ne "") {
  flyctl secrets set MP_PUBLIC_KEY=$mpPublicKey
  Write-Host "✅ MP_PUBLIC_KEY configurada" -ForegroundColor Green
} else {
  Write-Host "❌ MP_PUBLIC_KEY não fornecida" -ForegroundColor Red
}

# 4. Verificar configuração
Write-Host "`n4. VERIFICANDO CONFIGURAÇÃO:" -ForegroundColor Cyan
flyctl secrets list

# 5. Deploy
Write-Host "`n5. FAZENDO DEPLOY COM CONFIGURAÇÕES CORRETAS:" -ForegroundColor Cyan
Write-Host "Deploy em andamento..." -ForegroundColor Yellow
flyctl deploy

Write-Host "`n6. TESTANDO FUNCIONALIDADES REAIS APÓS CORREÇÃO:" -ForegroundColor Cyan

# Teste Cadastro
Write-Host "`nTestando Cadastro..." -ForegroundColor Yellow
try {
  $userData = @{
    name = "Jogador Real"
    email = "jogador.real@test.com"
    password = "senha123"
  } | ConvertTo-Json
  
  $response = Invoke-WebRequest "https://goldeouro-backend-v2.fly.dev/auth/register" -Method POST -Body $userData -ContentType "application/json" -UseBasicParsing -TimeoutSec 10
  Write-Host "  Cadastro Status: $($response.StatusCode)" -ForegroundColor Green
  if ($response.StatusCode -eq 201) {
    Write-Host "  ✅ CADASTRO REAL: FUNCIONANDO!" -ForegroundColor Green
  } else {
    Write-Host "  ❌ Cadastro ainda com erro: $($response.Content)" -ForegroundColor Red
  }
} catch {
  Write-Host "  ❌ Cadastro ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

# Teste Login
Write-Host "`nTestando Login..." -ForegroundColor Yellow
try {
  $loginData = @{
    email = "jogador.real@test.com"
    password = "senha123"
  } | ConvertTo-Json
  
  $response = Invoke-WebRequest "https://goldeouro-backend-v2.fly.dev/auth/login" -Method POST -Body $loginData -ContentType "application/json" -UseBasicParsing -TimeoutSec 10
  Write-Host "  Login Status: $($response.StatusCode)" -ForegroundColor Green
  if ($response.StatusCode -eq 200) {
    Write-Host "  ✅ LOGIN REAL: FUNCIONANDO!" -ForegroundColor Green
  } else {
    Write-Host "  ❌ Login ainda com erro: $($response.Content)" -ForegroundColor Red
  }
} catch {
  Write-Host "  ❌ Login ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

# Teste PIX
Write-Host "`nTestando PIX..." -ForegroundColor Yellow
try {
  $pixData = @{
    amount = 10
    user_id = 1
  } | ConvertTo-Json
  
  $response = Invoke-WebRequest "https://goldeouro-backend-v2.fly.dev/api/payments/pix/criar" -Method POST -Body $pixData -ContentType "application/json" -UseBasicParsing -TimeoutSec 10
  Write-Host "  PIX Status: $($response.StatusCode)" -ForegroundColor Green
  if ($response.StatusCode -eq 200) {
    $pixResponse = $response.Content | ConvertFrom-Json
    if ($pixResponse.init_point -or $pixResponse.qr_code) {
      Write-Host "  ✅ PIX REAL: FUNCIONANDO (link real gerado)!" -ForegroundColor Green
    } else {
      Write-Host "  ❌ PIX ainda fake: $($response.Content)" -ForegroundColor Red
    }
  } else {
    Write-Host "  ❌ PIX ainda com erro: $($response.Content)" -ForegroundColor Red
  }
} catch {
  Write-Host "  ❌ PIX ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 CORREÇÃO CONCLUÍDA!" -ForegroundColor Green
Write-Host "`n📋 PRÓXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host "1. Verificar se jogadores reais conseguem se cadastrar" -ForegroundColor White
Write-Host "2. Verificar se jogadores reais conseguem fazer login" -ForegroundColor White
Write-Host "3. Verificar se jogadores reais conseguem fazer PIX" -ForegroundColor White
Write-Host "4. Verificar se jogadores reais conseguem jogar" -ForegroundColor White
Write-Host "5. Monitorar reclamações dos jogadores" -ForegroundColor White
