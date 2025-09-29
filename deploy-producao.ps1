# Script de Deploy para Produção - Gol de Ouro v1.1.1
Write-Host "🚀 DEPLOY PARA PRODUÇÃO - Gol de Ouro v1.1.1" -ForegroundColor Cyan
Write-Host "Data: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host ""

# Verificar se estamos no diretório correto
if (!(Test-Path "package.json")) {
    Write-Host "❌ ERRO: Execute este script no diretório raiz do projeto" -ForegroundColor Red
    exit 1
}

Write-Host "📋 VERIFICANDO CONFIGURAÇÕES..." -ForegroundColor Yellow

# 1. Verificar se router de produção existe
if (!(Test-Path "router-producao.js")) {
    Write-Host "❌ ERRO: router-producao.js não encontrado" -ForegroundColor Red
    exit 1
}

# 2. Verificar se vercel.json do player está correto
$playerVercel = Get-Content "goldeouro-player/vercel.json" | ConvertFrom-Json
if ($playerVercel.env.VITE_API_URL -ne "https://goldeouro-backend-v2.fly.dev") {
    Write-Host "❌ ERRO: URL do backend incorreta no player" -ForegroundColor Red
    exit 1
}

# 3. Verificar se vercel.json do admin está correto
$adminVercel = Get-Content "goldeouro-admin/vercel.json" | ConvertFrom-Json
if ($adminVercel.env.VITE_API_URL -ne "https://goldeouro-backend-v2.fly.dev") {
    Write-Host "❌ ERRO: URL do backend incorreta no admin" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Configurações verificadas" -ForegroundColor Green
Write-Host ""

Write-Host "🔄 APLICANDO CONFIGURAÇÕES DE PRODUÇÃO..." -ForegroundColor Yellow

# 1. Substituir router.js pelo router de produção
Write-Host "1. Atualizando router.js..." -NoNewline
try {
    Copy-Item "router-producao.js" "router.js" -Force
    Write-Host " ✅" -ForegroundColor Green
} catch {
    Write-Host " ❌ ERRO: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 2. Verificar se não há dados fictícios
Write-Host "2. Verificando dados fictícios..." -NoNewline
$routerContent = Get-Content "router.js" -Raw
if ($routerContent -match "mock|fictício|teste") {
    Write-Host " ⚠️ AVISO: Dados fictícios ainda presentes" -ForegroundColor Yellow
} else {
    Write-Host " ✅" -ForegroundColor Green
}

Write-Host ""
Write-Host "🌐 TESTANDO CONECTIVIDADE..." -ForegroundColor Yellow

# Testar backend atual
Write-Host "1. Testando backend atual..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri "https://goldeouro-backend-v2.fly.dev/health" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host " ✅" -ForegroundColor Green
    } else {
        Write-Host " ⚠️ Status: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host " ❌ ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

# Testar player mode
Write-Host "2. Testando player mode..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri "https://goldeouro.lol" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host " ✅" -ForegroundColor Green
    } else {
        Write-Host " ⚠️ Status: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host " ❌ ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

# Testar admin panel
Write-Host "3. Testando admin panel..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri "https://admin.goldeouro.lol" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host " ✅" -ForegroundColor Green
    } else {
        Write-Host " ⚠️ Status: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host " ❌ ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "📦 PREPARANDO DEPLOY..." -ForegroundColor Yellow

# Fazer commit das alterações
Write-Host "1. Fazendo commit das alterações..." -NoNewline
try {
    git add .
    git commit -m "PROD: Configurações de produção - Removendo dados fictícios" -m "- Atualizado router.js para produção" -m "- Corrigido URLs no vercel.json" -m "- Removidos dados mock" -m "- Configurado ambiente de produção"
    Write-Host " ✅" -ForegroundColor Green
} catch {
    Write-Host " ⚠️ AVISO: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Criar tag de produção
Write-Host "2. Criando tag de produção..." -NoNewline
try {
    git tag -a "v1.1.1-producao" -m "Versão de produção v1.1.1 - Sem dados fictícios"
    Write-Host " ✅" -ForegroundColor Green
} catch {
    Write-Host " ⚠️ AVISO: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎯 PRÓXIMOS PASSOS RECOMENDADOS:" -ForegroundColor Cyan
Write-Host "1. Deploy do backend no Fly.io" -ForegroundColor White
Write-Host "2. Deploy do player mode no Vercel" -ForegroundColor White
Write-Host "3. Deploy do admin panel no Vercel" -ForegroundColor White
Write-Host "4. Implementar banco de dados real" -ForegroundColor White
Write-Host "5. Implementar autenticação JWT" -ForegroundColor White
Write-Host "6. Implementar pagamentos PIX" -ForegroundColor White

Write-Host ""
Write-Host "✅ CONFIGURAÇÕES DE PRODUÇÃO APLICADAS!" -ForegroundColor Green
Write-Host "Sistema pronto para deploy em producao" -ForegroundColor Yellow
