# scripts/auditoria-rigorosa.ps1 - Auditoria rigorosa para reduzir falsos positivos
Write-Host "=== AUDITORIA RIGOROSA - REDUZINDO FALSOS POSITIVOS ===" -ForegroundColor Red
Write-Host ""

$ApiBase = "https://goldeouro-backend-v2.fly.dev"
$PlayerUrl = "https://goldeouro.lol"
$AdminUrl = "https://admin.goldeouro.lol"

$falsosPositivos = @()
$verificacoesReais = @()

Write-Host "🔍 1. VERIFICAÇÃO REAL DE CONECTIVIDADE..." -ForegroundColor Cyan

# Teste real de conectividade
try {
  $response = Invoke-WebRequest "$ApiBase/health" -UseBasicParsing -TimeoutSec 10
  if ($response.StatusCode -eq 200) {
    $healthData = $response.Content | ConvertFrom-Json
    if ($healthData.ok -eq $true) {
      $verificacoesReais += "✅ Backend API: REALMENTE ONLINE"
    } else {
      $falsosPositivos += "❌ Backend API: Health check retorna false"
    }
  } else {
    $falsosPositivos += "❌ Backend API: Status $($response.StatusCode)"
  }
} catch {
  $falsosPositivos += "❌ Backend API: OFFLINE - $($_.Exception.Message)"
}

# Teste real do Player
try {
  $response = Invoke-WebRequest $PlayerUrl -UseBasicParsing -TimeoutSec 10
  if ($response.StatusCode -eq 200) {
    $verificacoesReais += "✅ Player: REALMENTE ONLINE"
  } else {
    $falsosPositivos += "❌ Player: Status $($response.StatusCode)"
  }
} catch {
  $falsosPositivos += "❌ Player: OFFLINE - $($_.Exception.Message)"
}

# Teste real do Admin
try {
  $response = Invoke-WebRequest $AdminUrl -UseBasicParsing -TimeoutSec 10
  if ($response.StatusCode -eq 200) {
    $verificacoesReais += "✅ Admin: REALMENTE ONLINE"
  } else {
    $falsosPositivos += "❌ Admin: Status $($response.StatusCode)"
  }
} catch {
  $falsosPositivos += "❌ Admin: OFFLINE - $($_.Exception.Message)"
}

Write-Host "`n🔍 2. VERIFICAÇÃO REAL DE VARIÁVEIS DE AMBIENTE..." -ForegroundColor Cyan

# Verificar secrets reais
$secrets = flyctl secrets list 2>$null
$secretsString = $secrets -join "`n"

if ($secretsString -match "DATABASE_URL") {
  $verificacoesReais += "✅ DATABASE_URL: Configurada"
} else {
  $falsosPositivos += "❌ DATABASE_URL: NÃO CONFIGURADA (CRÍTICO)"
}

if ($secretsString -match "MP_ACCESS_TOKEN") {
  $verificacoesReais += "✅ MP_ACCESS_TOKEN: Configurado"
} else {
  $falsosPositivos += "❌ MP_ACCESS_TOKEN: NÃO CONFIGURADO (CRÍTICO)"
}

if ($secretsString -match "MP_PUBLIC_KEY") {
  $verificacoesReais += "✅ MP_PUBLIC_KEY: Configurada"
} else {
  $falsosPositivos += "❌ MP_PUBLIC_KEY: NÃO CONFIGURADA (CRÍTICO)"
}

if ($secretsString -match "NODE_ENV.*production") {
  $verificacoesReais += "✅ NODE_ENV: Configurado como production"
} else {
  $falsosPositivos += "❌ NODE_ENV: NÃO configurado como production"
}

Write-Host "`n🔍 3. VERIFICAÇÃO REAL DE FUNCIONALIDADES..." -ForegroundColor Cyan

# Teste real de criação de usuário
try {
  $userData = @{
    name = "Teste Auditoria"
    email = "teste.auditoria@example.com"
    password = "senha123"
  } | ConvertTo-Json
  
  $response = Invoke-WebRequest "$ApiBase/users" -Method POST -Body $userData -ContentType "application/json" -UseBasicParsing -TimeoutSec 10
  if ($response.StatusCode -eq 201 -or $response.StatusCode -eq 200) {
    $verificacoesReais += "✅ Criação de usuário: FUNCIONANDO"
  } else {
    $falsosPositivos += "❌ Criação de usuário: Falha ($($response.StatusCode))"
  }
} catch {
  $falsosPositivos += "❌ Criação de usuário: Erro - $($_.Exception.Message)"
}

# Teste real de PIX
try {
  $pixData = @{
    amount = 1
    description = "Teste Auditoria PIX"
  } | ConvertTo-Json
  
  $response = Invoke-WebRequest "$ApiBase/payments/create" -Method POST -Body $pixData -ContentType "application/json" -UseBasicParsing -TimeoutSec 10
  if ($response.StatusCode -eq 200) {
    $pixResponse = $response.Content | ConvertFrom-Json
    if ($pixResponse.init_point -or $pixResponse.qr_code) {
      $verificacoesReais += "✅ PIX: FUNCIONANDO (retorna init_point/qr_code)"
    } else {
      $falsosPositivos += "❌ PIX: Resposta inválida (sem init_point/qr_code)"
    }
  } else {
    $falsosPositivos += "❌ PIX: Falha ($($response.StatusCode))"
  }
} catch {
  $falsosPositivos += "❌ PIX: Erro - $($_.Exception.Message)"
}

# Teste real de autenticação
try {
  $loginData = @{
    email = "teste.auditoria@example.com"
    password = "senha123"
  } | ConvertTo-Json
  
  $response = Invoke-WebRequest "$ApiBase/auth/login" -Method POST -Body $loginData -ContentType "application/json" -UseBasicParsing -TimeoutSec 10
  if ($response.StatusCode -eq 200) {
    $authResponse = $response.Content | ConvertFrom-Json
    if ($authResponse.token -or $authResponse.access_token) {
      $verificacoesReais += "✅ Autenticação: FUNCIONANDO (retorna token)"
    } else {
      $falsosPositivos += "❌ Autenticação: Resposta inválida (sem token)"
    }
  } else {
    $falsosPositivos += "❌ Autenticação: Falha ($($response.StatusCode))"
  }
} catch {
  $falsosPositivos += "❌ Autenticação: Erro - $($_.Exception.Message)"
}

Write-Host "`n🔍 4. VERIFICAÇÃO REAL DE DADOS..." -ForegroundColor Cyan

# Verificar se está usando dados reais ou fictícios
try {
  $response = Invoke-WebRequest "$ApiBase/users" -UseBasicParsing -TimeoutSec 10
  $content = $response.Content
  
  # Verificar padrões de dados fictícios
  $padroesFicticios = @("João Silva", "Maria Santos", "teste", "mock", "fake", "dummy")
  $dadosFicticios = $false
  
  foreach ($padrao in $padroesFicticios) {
    if ($content -match $padrao) {
      $dadosFicticios = $true
      break
    }
  }
  
  if ($dadosFicticios) {
    $falsosPositivos += "❌ DADOS: Usando dados fictícios/mock"
  } else {
    $verificacoesReais += "✅ DADOS: Usando dados reais de produção"
  }
} catch {
  $falsosPositivos += "❌ DADOS: Não foi possível verificar"
}

Write-Host "`n🔍 5. VERIFICAÇÃO REAL DE PWA..." -ForegroundColor Cyan

# Verificar se PWA está realmente funcionando
try {
  $response = Invoke-WebRequest $PlayerUrl -UseBasicParsing -TimeoutSec 10
  $content = $response.Content
  
  if ($content -match "manifest" -and $content -match "sw\.js") {
    $verificacoesReais += "✅ PWA: Manifest e Service Worker detectados"
  } else {
    $falsosPositivos += "❌ PWA: Manifest ou Service Worker não detectados"
  }
} catch {
  $falsosPositivos += "❌ PWA: Não foi possível verificar"
}

Write-Host "`n🔍 6. VERIFICAÇÃO REAL DE CORS..." -ForegroundColor Cyan

# Teste real de CORS
try {
  $request = [System.Net.WebRequest]::Create("$ApiBase/payments/create")
  $request.Method = "OPTIONS"
  $request.Headers.Add("Origin", $PlayerUrl)
  $request.Headers.Add("Access-Control-Request-Method", "POST")
  $request.Headers.Add("Access-Control-Request-Headers", "content-type")
  
  $response = $request.GetResponse()
  $corsHeaders = $response.Headers["Access-Control-Allow-Origin"]
  $response.Close()
  
  if ($corsHeaders) {
    $verificacoesReais += "✅ CORS: Configurado corretamente"
  } else {
    $falsosPositivos += "❌ CORS: Headers não configurados"
  }
} catch {
  $falsosPositivos += "❌ CORS: Erro na verificação"
}

Write-Host "`n🚨 RELATÓRIO FINAL - FALSOS POSITIVOS IDENTIFICADOS:" -ForegroundColor Red
Write-Host "===============================================" -ForegroundColor Red

if ($falsosPositivos.Count -gt 0) {
  Write-Host "`n❌ FALSOS POSITIVOS ENCONTRADOS ($($falsosPositivos.Count)):" -ForegroundColor Red
  foreach ($falso in $falsosPositivos) {
    Write-Host "   $falso" -ForegroundColor Yellow
  }
} else {
  Write-Host "`n✅ NENHUM FALSO POSITIVO ENCONTRADO!" -ForegroundColor Green
}

if ($verificacoesReais.Count -gt 0) {
  Write-Host "`n✅ VERIFICAÇÕES REAIS CONFIRMADAS ($($verificacoesReais.Count)):" -ForegroundColor Green
  foreach ($verificacao in $verificacoesReais) {
    Write-Host "   $verificacao" -ForegroundColor White
  }
}

Write-Host "`n📊 RESUMO ESTATÍSTICO:" -ForegroundColor Cyan
Write-Host "   Total de verificações: $($falsosPositivos.Count + $verificacoesReais.Count)" -ForegroundColor White
Write-Host "   Falsos positivos: $($falsosPositivos.Count)" -ForegroundColor Red
Write-Host "   Verificações reais: $($verificacoesReais.Count)" -ForegroundColor Green
Write-Host "   Taxa de confiabilidade: $([math]::Round(($verificacoesReais.Count / ($falsosPositivos.Count + $verificacoesReais.Count)) * 100, 2))%" -ForegroundColor Cyan

if ($falsosPositivos.Count -gt 0) {
  Write-Host "`n🔧 AÇÕES CORRETIVAS NECESSÁRIAS:" -ForegroundColor Yellow
  Write-Host "1. Configurar variáveis de ambiente faltantes" -ForegroundColor White
  Write-Host "2. Corrigir funcionalidades quebradas" -ForegroundColor White
  Write-Host "3. Fazer deploy com configurações corretas" -ForegroundColor White
  Write-Host "4. Testar novamente após correções" -ForegroundColor White
} else {
  Write-Host "`n🎉 SISTEMA REALMENTE PRONTO PARA PRODUÇÃO!" -ForegroundColor Green
}
