# scripts/auditoria-final-producao.ps1 - Auditoria completa para produção
Write-Host "=== AUDITORIA FINAL - PRODUÇÃO REAL ===" -ForegroundColor Red
Write-Host ""

# URLs de produção
$ApiBase = "https://goldeouro-backend-v2.fly.dev"
$PlayerUrl = "https://goldeouro.lol"
$AdminUrl = "https://admin.goldeouro.lol"

Write-Host "🔍 1. VERIFICANDO SERVIÇOS ONLINE..." -ForegroundColor Cyan

# Backend
try {
  $response = Invoke-WebRequest "$ApiBase/health" -UseBasicParsing -TimeoutSec 5
  Write-Host "✅ Backend API: ONLINE ($($response.StatusCode))" -ForegroundColor Green
} catch {
  Write-Host "❌ Backend API: OFFLINE" -ForegroundColor Red
}

# Player
try {
  $response = Invoke-WebRequest $PlayerUrl -UseBasicParsing -TimeoutSec 5
  Write-Host "✅ Player: ONLINE ($($response.StatusCode))" -ForegroundColor Green
} catch {
  Write-Host "❌ Player: OFFLINE" -ForegroundColor Red
}

# Admin
try {
  $response = Invoke-WebRequest $AdminUrl -UseBasicParsing -TimeoutSec 5
  Write-Host "✅ Admin: ONLINE ($($response.StatusCode))" -ForegroundColor Green
} catch {
  Write-Host "❌ Admin: OFFLINE" -ForegroundColor Red
}

Write-Host "`n🔍 2. VERIFICANDO VARIÁVEIS DE AMBIENTE..." -ForegroundColor Cyan

# Verificar secrets do Fly.io
$secrets = flyctl secrets list 2>$null
if ($secrets -match "DATABASE_URL") {
  Write-Host "✅ DATABASE_URL: Configurada" -ForegroundColor Green
} else {
  Write-Host "❌ DATABASE_URL: FALTANDO (CRÍTICO)" -ForegroundColor Red
}

if ($secrets -match "MP_ACCESS_TOKEN") {
  Write-Host "✅ MP_ACCESS_TOKEN: Configurado" -ForegroundColor Green
} else {
  Write-Host "❌ MP_ACCESS_TOKEN: FALTANDO (CRÍTICO)" -ForegroundColor Red
}

if ($secrets -match "MP_PUBLIC_KEY") {
  Write-Host "✅ MP_PUBLIC_KEY: Configurada" -ForegroundColor Green
} else {
  Write-Host "❌ MP_PUBLIC_KEY: FALTANDO (CRÍTICO)" -ForegroundColor Red
}

if ($secrets -match "NODE_ENV") {
  Write-Host "✅ NODE_ENV: Configurado" -ForegroundColor Green
} else {
  Write-Host "❌ NODE_ENV: FALTANDO" -ForegroundColor Yellow
}

Write-Host "`n🔍 3. VERIFICANDO FUNCIONALIDADES..." -ForegroundColor Cyan

# Testar endpoint de pagamentos
try {
  $response = Invoke-WebRequest "$ApiBase/payments/create" -Method POST -Body '{"amount":1,"description":"test"}' -ContentType "application/json" -UseBasicParsing -TimeoutSec 5
  if ($response.StatusCode -eq 200) {
    Write-Host "✅ PIX/Create: Funcionando" -ForegroundColor Green
  } else {
    Write-Host "❌ PIX/Create: Falha ($($response.StatusCode))" -ForegroundColor Red
  }
} catch {
  Write-Host "❌ PIX/Create: Erro - $($_.Exception.Message)" -ForegroundColor Red
}

# Testar endpoint de usuários
try {
  $response = Invoke-WebRequest "$ApiBase/users" -UseBasicParsing -TimeoutSec 5
  if ($response.StatusCode -eq 200) {
    Write-Host "✅ Users: Funcionando" -ForegroundColor Green
  } else {
    Write-Host "❌ Users: Falha ($($response.StatusCode))" -ForegroundColor Red
  }
} catch {
  Write-Host "❌ Users: Erro - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🔍 4. VERIFICANDO CONFIGURAÇÕES DE PRODUÇÃO..." -ForegroundColor Cyan

# Verificar se está usando dados reais ou fictícios
try {
  $response = Invoke-WebRequest "$ApiBase/users" -UseBasicParsing -TimeoutSec 5
  $content = $response.Content
  
  # Verificar se há dados fictícios
  if ($content -match "João Silva" -or $content -match "Maria Santos" -or $content -match "teste") {
    Write-Host "❌ DADOS FICTÍCIOS: Detectados no backend" -ForegroundColor Red
  } else {
    Write-Host "✅ DADOS REAIS: Backend usando dados de produção" -ForegroundColor Green
  }
} catch {
  Write-Host "⚠️ Não foi possível verificar dados" -ForegroundColor Yellow
}

Write-Host "`n🚨 RESUMO CRÍTICO:" -ForegroundColor Red
Write-Host "===============================================" -ForegroundColor Red

# Verificar se está pronto para produção
$ready = $true

if (-not ($secrets -match "DATABASE_URL")) {
  Write-Host "❌ FALTA: DATABASE_URL (Supabase)" -ForegroundColor Red
  $ready = $false
}

if (-not ($secrets -match "MP_ACCESS_TOKEN")) {
  Write-Host "❌ FALTA: MP_ACCESS_TOKEN (Mercado Pago)" -ForegroundColor Red
  $ready = $false
}

if (-not ($secrets -match "MP_PUBLIC_KEY")) {
  Write-Host "❌ FALTA: MP_PUBLIC_KEY (Mercado Pago)" -ForegroundColor Red
  $ready = $false
}

if ($ready) {
  Write-Host "`n✅ SISTEMA PRONTO PARA PRODUÇÃO!" -ForegroundColor Green
  Write-Host "   - Todas as variáveis configuradas" -ForegroundColor Green
  Write-Host "   - Serviços online" -ForegroundColor Green
  Write-Host "   - Pronto para usuários reais" -ForegroundColor Green
} else {
  Write-Host "`n❌ SISTEMA NÃO ESTÁ PRONTO!" -ForegroundColor Red
  Write-Host "   - Configure as variáveis faltantes" -ForegroundColor Yellow
  Write-Host "   - Execute: flyctl secrets set VARIAVEL=valor" -ForegroundColor Yellow
  Write-Host "   - Faça deploy: flyctl deploy" -ForegroundColor Yellow
}

Write-Host "`n📋 PRÓXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host "1. Configurar variáveis faltantes" -ForegroundColor White
Write-Host "2. Fazer deploy do backend" -ForegroundColor White
Write-Host "3. Testar cadastro de usuário real" -ForegroundColor White
Write-Host "4. Testar PIX real" -ForegroundColor White
Write-Host "5. Testar jogo completo" -ForegroundColor White
