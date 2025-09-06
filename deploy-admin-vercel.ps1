# Script de Deploy do Admin para Vercel
# Data: 06/09/2025

Write-Host "🚀 INICIANDO DEPLOY DO ADMIN PARA VERCEL" -ForegroundColor Yellow
Write-Host "===============================================" -ForegroundColor Yellow

# Verificar se está no diretório correto
if (!(Test-Path "goldeouro-admin")) {
    Write-Host "❌ Diretório goldeouro-admin não encontrado!" -ForegroundColor Red
    Write-Host "Execute este script a partir do diretório raiz do projeto." -ForegroundColor Red
    exit 1
}

# Navegar para o diretório do admin
Set-Location "goldeouro-admin"

Write-Host "📁 Navegando para: $(Get-Location)" -ForegroundColor Green

# Verificar se o Vercel CLI está instalado
Write-Host "🔍 Verificando Vercel CLI..." -ForegroundColor Cyan
try {
    $vercelVersion = vercel --version
    Write-Host "✅ Vercel CLI encontrado: $vercelVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Vercel CLI não encontrado!" -ForegroundColor Red
    Write-Host "Instalando Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel
}

# Verificar se está logado no Vercel
Write-Host "🔐 Verificando login do Vercel..." -ForegroundColor Cyan
try {
    $user = vercel whoami
    Write-Host "✅ Logado como: $user" -ForegroundColor Green
} catch {
    Write-Host "❌ Não está logado no Vercel!" -ForegroundColor Red
    Write-Host "Fazendo login..." -ForegroundColor Yellow
    vercel login
}

# Instalar dependências
Write-Host "📦 Instalando dependências..." -ForegroundColor Cyan
npm install

# Fazer build do projeto
Write-Host "🔨 Fazendo build do projeto..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro no build!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build concluído com sucesso!" -ForegroundColor Green

# Deploy para Vercel
Write-Host "🚀 Fazendo deploy para Vercel..." -ForegroundColor Cyan
Write-Host "Projeto: goldeouro-admin" -ForegroundColor Yellow
Write-Host "Domínio: admin.goldeouro.lol" -ForegroundColor Yellow

vercel --prod

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ DEPLOY CONCLUÍDO COM SUCESSO!" -ForegroundColor Green
    Write-Host "🌐 Admin disponível em: https://admin.goldeouro.lol" -ForegroundColor Green
    Write-Host "📊 Dashboard: https://admin.goldeouro.lol" -ForegroundColor Green
    Write-Host "👥 Usuários: https://admin.goldeouro.lol/usuarios" -ForegroundColor Green
    Write-Host "💳 Pagamentos: https://admin.goldeouro.lol/pagamentos" -ForegroundColor Green
    Write-Host "📈 Métricas: https://admin.goldeouro.lol/metricas" -ForegroundColor Green
} else {
    Write-Host "❌ Erro no deploy!" -ForegroundColor Red
    Write-Host "Verifique os logs acima para mais detalhes." -ForegroundColor Red
}

Write-Host "===============================================" -ForegroundColor Yellow
Write-Host "🏆 DEPLOY DO ADMIN FINALIZADO" -ForegroundColor Yellow
