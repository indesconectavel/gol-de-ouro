# Script de Deploy Forçado - Gol de Ouro v1.2.0 (Windows PowerShell)
# =================================================================
# Data: 24/10/2025
# Status: CORREÇÃO CRÍTICA DE BUILD E CACHE

Write-Host "🚀 INICIANDO DEPLOY FORÇADO - GOL DE OURO v1.2.0" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

# 1. Navegar para o diretório do frontend
Set-Location "goldeouro-player"

# 2. Limpar cache local
Write-Host "🧹 Limpando cache local..." -ForegroundColor Yellow
if (Test-Path "dist") { Remove-Item -Recurse -Force "dist" }
if (Test-Path "node_modules\.vite") { Remove-Item -Recurse -Force "node_modules\.vite" }

# 3. Reinstalar dependências
Write-Host "📦 Reinstalando dependências..." -ForegroundColor Yellow
npm ci

# 4. Build limpo
Write-Host "🔨 Gerando build limpo..." -ForegroundColor Yellow
npm run build

# 5. Verificar se build foi gerado
if (-not (Test-Path "dist")) {
    Write-Host "❌ ERRO: Build não foi gerado!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build gerado com sucesso!" -ForegroundColor Green

# 6. Deploy forçado para Vercel
Write-Host "🚀 Fazendo deploy forçado para Vercel..." -ForegroundColor Yellow
npx vercel --prod --force --yes

Write-Host "✅ Deploy forçado concluído!" -ForegroundColor Green
Write-Host "🌐 Acesse: https://goldeouro.lol" -ForegroundColor Cyan
Write-Host "🔄 Aguarde 2-3 minutos para propagação do CDN" -ForegroundColor Yellow


