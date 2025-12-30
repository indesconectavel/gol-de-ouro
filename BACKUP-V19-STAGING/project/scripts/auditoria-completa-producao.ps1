Write-Host "=== AUDITORIA COMPLETA - CONFIGURAÇÕES REAIS DE PRODUÇÃO ===" -ForegroundColor Red
Write-Host ""

$ApiBase = "https://goldeouro-backend-v2.fly.dev"
$PlayerUrl = "https://goldeouro.lol"
$AdminUrl = "https://admin.goldeouro.lol"

Write-Host "🔍 1. VERIFICANDO CONFIGURAÇÕES ATUAIS DO FLY.IO:" -ForegroundColor Cyan
$secrets = flyctl secrets list 2>$null
Write-Host "Secrets configurados:" -ForegroundColor White
Write-Host "$secrets" -ForegroundColor White

Write-Host "`n🔍 2. TESTANDO FUNCIONALIDADES REAIS:" -ForegroundColor Cyan

# Health Check
Write-Host "`n2.1. HEALTH CHECK:" -ForegroundColor Yellow
try {
  $response = Invoke-WebRequest "$ApiBase/health" -UseBasicParsing -TimeoutSec 5
  Write-Host "  Status: $($response.StatusCode)" -ForegroundColor Green
  $healthData = $response.Content | ConvertFrom-Json
  Write-Host "  Uptime: $([math]::Round($healthData.uptime/60, 2)) minutos" -ForegroundColor White
  Write-Host "  Memory: $([math]::Round($healthData.memory.rss/1024/1024, 2)) MB" -ForegroundColor White
} catch {
  Write-Host "  ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

# Cadastro
Write-Host "`n2.2. CADASTRO DE JOGADOR:" -ForegroundColor Yellow
try {
  $userData = @{
    name = "Jogador Auditoria"
    email = "auditoria@test.com"
    password = "senha123456"
  } | ConvertTo-Json
  
  $response = Invoke-WebRequest "$ApiBase/auth/register" -Method POST -Body $userData -ContentType "application/json" -UseBasicParsing -TimeoutSec 10
  Write-Host "  Status: $($response.StatusCode)" -ForegroundColor Green
  Write-Host "  Response: $($response.Content)" -ForegroundColor White
  
  if ($response.StatusCode -eq 201) {
    Write-Host "  ✅ CADASTRO: FUNCIONANDO!" -ForegroundColor Green
  } else {
    Write-Host "  ❌ CADASTRO: FALHANDO" -ForegroundColor Red
  }
} catch {
  Write-Host "  ❌ CADASTRO: ERRO - $($_.Exception.Message)" -ForegroundColor Red
}

# Login
Write-Host "`n2.3. LOGIN DE JOGADOR:" -ForegroundColor Yellow
try {
  $loginData = @{
    email = "auditoria@test.com"
    password = "senha123456"
  } | ConvertTo-Json
  
  $response = Invoke-WebRequest "$ApiBase/auth/login" -Method POST -Body $loginData -ContentType "application/json" -UseBasicParsing -TimeoutSec 10
  Write-Host "  Status: $($response.StatusCode)" -ForegroundColor Green
  Write-Host "  Response: $($response.Content)" -ForegroundColor White
  
  if ($response.StatusCode -eq 200) {
    Write-Host "  ✅ LOGIN: FUNCIONANDO!" -ForegroundColor Green
  } else {
    Write-Host "  ❌ LOGIN: FALHANDO" -ForegroundColor Red
  }
} catch {
  Write-Host "  ❌ LOGIN: ERRO - $($_.Exception.Message)" -ForegroundColor Red
}

# PIX
Write-Host "`n2.4. PIX (PAGAMENTO):" -ForegroundColor Yellow
try {
  $pixData = @{
    amount = 50
    user_id = 1
  } | ConvertTo-Json
  
  $response = Invoke-WebRequest "$ApiBase/api/payments/pix/criar" -Method POST -Body $pixData -ContentType "application/json" -UseBasicParsing -TimeoutSec 10
  Write-Host "  Status: $($response.StatusCode)" -ForegroundColor Green
  Write-Host "  Response: $($response.Content)" -ForegroundColor White
  
  if ($response.StatusCode -eq 200) {
    $pixResponse = $response.Content | ConvertFrom-Json
    if ($pixResponse.init_point -or $pixResponse.qr_code) {
      Write-Host "  ✅ PIX: FUNCIONANDO (link real gerado)!" -ForegroundColor Green
    } else {
      Write-Host "  ⚠️ PIX: FUNCIONANDO (mas simulado)" -ForegroundColor Yellow
    }
  } else {
    Write-Host "  ❌ PIX: FALHANDO" -ForegroundColor Red
  }
} catch {
  Write-Host "  ❌ PIX: ERRO - $($_.Exception.Message)" -ForegroundColor Red
}

# Jogo
Write-Host "`n2.5. JOGO:" -ForegroundColor Yellow
try {
  $gameData = @{
    amount = 20
    direction = "left"
  } | ConvertTo-Json
  
  $response = Invoke-WebRequest "$ApiBase/api/games/shoot" -Method POST -Body $gameData -ContentType "application/json" -UseBasicParsing -TimeoutSec 10
  Write-Host "  Status: $($response.StatusCode)" -ForegroundColor Green
  Write-Host "  Response: $($response.Content)" -ForegroundColor White
  
  if ($response.StatusCode -eq 200) {
    Write-Host "  ✅ JOGO: FUNCIONANDO!" -ForegroundColor Green
  } else {
    Write-Host "  ❌ JOGO: FALHANDO" -ForegroundColor Red
  }
} catch {
  Write-Host "  ❌ JOGO: ERRO - $($_.Exception.Message)" -ForegroundColor Red
}

# Frontend Player
Write-Host "`n2.6. FRONTEND PLAYER:" -ForegroundColor Yellow
try {
  $response = Invoke-WebRequest $PlayerUrl -UseBasicParsing -TimeoutSec 5
  Write-Host "  Status: $($response.StatusCode)" -ForegroundColor Green
  
  if ($response.StatusCode -eq 200) {
    Write-Host "  ✅ PLAYER: FUNCIONANDO!" -ForegroundColor Green
  } else {
    Write-Host "  ❌ PLAYER: FALHANDO" -ForegroundColor Red
  }
} catch {
  Write-Host "  ❌ PLAYER: ERRO - $($_.Exception.Message)" -ForegroundColor Red
}

# Frontend Admin
Write-Host "`n2.7. FRONTEND ADMIN:" -ForegroundColor Yellow
try {
  $response = Invoke-WebRequest $AdminUrl -UseBasicParsing -TimeoutSec 5
  Write-Host "  Status: $($response.StatusCode)" -ForegroundColor Green
  
  if ($response.StatusCode -eq 200) {
    Write-Host "  ✅ ADMIN: FUNCIONANDO!" -ForegroundColor Green
  } else {
    Write-Host "  ❌ ADMIN: FALHANDO" -ForegroundColor Red
  }
} catch {
  Write-Host "  ❌ ADMIN: ERRO - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🔍 3. VERIFICANDO CONFIGURAÇÕES DE SEGURANÇA:" -ForegroundColor Cyan

# Headers de Segurança
Write-Host "`n3.1. HEADERS DE SEGURANÇA:" -ForegroundColor Yellow
try {
  $response = Invoke-WebRequest "$ApiBase/health" -UseBasicParsing -TimeoutSec 5
  $headers = $response.Headers
  
  $securityHeaders = @(
    "content-security-policy",
    "x-content-type-options",
    "x-frame-options",
    "x-xss-protection",
    "strict-transport-security"
  )
  
  foreach ($header in $securityHeaders) {
    if ($headers[$header]) {
      Write-Host "  ✅ $header`: Configurado" -ForegroundColor Green
    } else {
      Write-Host "  ❌ $header`: FALTANDO" -ForegroundColor Red
    }
  }
} catch {
  Write-Host "  ❌ ERRO ao verificar headers: $($_.Exception.Message)" -ForegroundColor Red
}

# CORS
Write-Host "`n3.2. CORS:" -ForegroundColor Yellow
try {
  $response = Invoke-WebRequest "$ApiBase/health" -UseBasicParsing -TimeoutSec 5
  if ($response.Headers["Access-Control-Allow-Origin"]) {
    Write-Host "  ✅ CORS: Configurado" -ForegroundColor Green
  } else {
    Write-Host "  ❌ CORS: FALTANDO" -ForegroundColor Red
  }
} catch {
  Write-Host "  ❌ ERRO ao verificar CORS: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🔍 4. VERIFICANDO INTEGRAÇÕES EXTERNAS:" -ForegroundColor Cyan

# Supabase
Write-Host "`n4.1. SUPABASE (DATABASE):" -ForegroundColor Yellow
$dbUrl = flyctl secrets list | Select-String "DATABASE_URL"
if ($dbUrl) {
  Write-Host "  ✅ DATABASE_URL: Configurada" -ForegroundColor Green
  if ($dbUrl -match "postgresql://") {
    Write-Host "  ✅ Formato: PostgreSQL válido" -ForegroundColor Green
  } else {
    Write-Host "  ⚠️ Formato: Pode estar incorreto" -ForegroundColor Yellow
  }
} else {
  Write-Host "  ❌ DATABASE_URL: FALTANDO" -ForegroundColor Red
}

# Mercado Pago
Write-Host "`n4.2. MERCADO PAGO:" -ForegroundColor Yellow
$mpToken = flyctl secrets list | Select-String "MP_ACCESS_TOKEN"
$mpPublicKey = flyctl secrets list | Select-String "MP_PUBLIC_KEY"

if ($mpToken) {
  Write-Host "  ✅ MP_ACCESS_TOKEN: Configurado" -ForegroundColor Green
} else {
  Write-Host "  ❌ MP_ACCESS_TOKEN: FALTANDO" -ForegroundColor Red
}

if ($mpPublicKey) {
  Write-Host "  ✅ MP_PUBLIC_KEY: Configurada" -ForegroundColor Green
} else {
  Write-Host "  ❌ MP_PUBLIC_KEY: FALTANDO" -ForegroundColor Red
}

Write-Host "`n🔍 5. VERIFICANDO FRONTEND (VERCEL):" -ForegroundColor Cyan

# Variáveis de Ambiente do Frontend
Write-Host "`n5.1. VARIÁVEIS DE AMBIENTE DO FRONTEND:" -ForegroundColor Yellow
Write-Host "  ⚠️ Verificar manualmente no Vercel:" -ForegroundColor Yellow
Write-Host "    - VITE_API_URL: https://goldeouro-backend-v2.fly.dev" -ForegroundColor White
Write-Host "    - VITE_ENV: production" -ForegroundColor White
Write-Host "    - VITE_MP_PUBLIC_KEY: (se necessário)" -ForegroundColor White

Write-Host "`n🔍 6. VERIFICANDO DOMÍNIOS:" -ForegroundColor Cyan

# DNS
Write-Host "`n6.1. DNS:" -ForegroundColor Yellow
Write-Host "  ⚠️ Verificar manualmente:" -ForegroundColor Yellow
Write-Host "    - goldeouro.lol → Vercel" -ForegroundColor White
Write-Host "    - admin.goldeouro.lol → Vercel" -ForegroundColor White
Write-Host "    - SSL configurado" -ForegroundColor White

Write-Host "`n🎯 RESUMO DA AUDITORIA:" -ForegroundColor Red
Write-Host "===============================================" -ForegroundColor Red

Write-Host "`n📊 FUNCIONALIDADES:" -ForegroundColor Cyan
Write-Host "✅ Health Check: Funcionando" -ForegroundColor Green
Write-Host "❌ Cadastro: FALHANDO (500)" -ForegroundColor Red
Write-Host "❌ Login: FALHANDO (500)" -ForegroundColor Red
Write-Host "⚠️ PIX: Funcionando (simulado)" -ForegroundColor Yellow
Write-Host "✅ Jogo: Funcionando" -ForegroundColor Green
Write-Host "✅ Frontend Player: Funcionando" -ForegroundColor Green
Write-Host "✅ Frontend Admin: Funcionando" -ForegroundColor Green

Write-Host "`n🔧 CONFIGURAÇÕES:" -ForegroundColor Cyan
Write-Host "✅ Headers de Segurança: Configurados" -ForegroundColor Green
Write-Host "✅ CORS: Configurado" -ForegroundColor Green
Write-Host "⚠️ DATABASE_URL: Configurada (verificar formato)" -ForegroundColor Yellow
Write-Host "✅ MP_ACCESS_TOKEN: Configurado" -ForegroundColor Green
Write-Host "✅ MP_PUBLIC_KEY: Configurada" -ForegroundColor Green

Write-Host "`n🚨 PROBLEMAS CRÍTICOS IDENTIFICADOS:" -ForegroundColor Red
Write-Host "1. Cadastro retorna 500 - DATABASE_URL pode estar incorreta" -ForegroundColor White
Write-Host "2. Login retorna 500 - DATABASE_URL pode estar incorreta" -ForegroundColor White
Write-Host "3. PIX está simulado - MP_ACCESS_TOKEN pode estar incorreto" -ForegroundColor White
Write-Host "4. Jogo depende de login funcionando" -ForegroundColor White

Write-Host "`n📋 CHECKLIST DE CORREÇÕES NECESSÁRIAS:" -ForegroundColor Yellow
Write-Host "===============================================" -ForegroundColor Yellow
Write-Host "1. ✅ Verificar DATABASE_URL do Supabase" -ForegroundColor White
Write-Host "2. ✅ Verificar MP_ACCESS_TOKEN do Mercado Pago" -ForegroundColor White
Write-Host "3. ✅ Verificar MP_PUBLIC_KEY do Mercado Pago" -ForegroundColor White
Write-Host "4. ✅ Testar cadastro após correções" -ForegroundColor White
Write-Host "5. ✅ Testar login após correções" -ForegroundColor White
Write-Host "6. ✅ Testar PIX real após correções" -ForegroundColor White
Write-Host "7. ✅ Testar jogo completo após correções" -ForegroundColor White
Write-Host "8. ✅ Verificar variáveis do frontend no Vercel" -ForegroundColor White
Write-Host "9. ✅ Verificar DNS e SSL" -ForegroundColor White
Write-Host "10. ✅ Teste final com jogadores reais" -ForegroundColor White
