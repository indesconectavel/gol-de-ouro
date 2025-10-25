#!/bin/bash
# Script de Deploy Forçado - Gol de Ouro v1.2.0
# =============================================
# Data: 24/10/2025
# Status: CORREÇÃO CRÍTICA DE BUILD E CACHE

echo "🚀 INICIANDO DEPLOY FORÇADO - GOL DE OURO v1.2.0"
echo "================================================"

# 1. Limpar cache local
echo "🧹 Limpando cache local..."
rm -rf node_modules/.vite
rm -rf dist
rm -rf .vercel

# 2. Reinstalar dependências
echo "📦 Reinstalando dependências..."
npm ci

# 3. Build limpo
echo "🔨 Gerando build limpo..."
npm run build

# 4. Verificar se build foi gerado
if [ ! -d "dist" ]; then
    echo "❌ ERRO: Build não foi gerado!"
    exit 1
fi

echo "✅ Build gerado com sucesso!"

# 5. Deploy forçado para Vercel
echo "🚀 Fazendo deploy forçado para Vercel..."
npx vercel --prod --force --yes

echo "✅ Deploy forçado concluído!"
echo "🌐 Acesse: https://goldeouro.lol"
echo "🔄 Aguarde 2-3 minutos para propagação do CDN"


