#!/bin/bash
# Script para Ativar SIMPLE_MVP - Gol de Ouro
# Data: 2025-10-01
# Versão: v1.1.1 Complexo → SIMPLE_MVP

echo "🚀 ATIVANDO SIMPLE_MVP - GOL DE OURO"
echo "====================================="

# Verificar se estamos no diretório correto
if [ ! -d "goldeouro-player" ] || [ ! -d "goldeouro-admin" ]; then
    echo "❌ Erro: Execute este script no diretório raiz do projeto"
    exit 1
fi

echo "✅ Diretório correto detectado"

# 1. Backup dos vercel.json atuais
echo "📋 Fazendo backup dos vercel.json atuais..."
cp goldeouro-player/vercel.json goldeouro-player/vercel-complex.json
cp goldeouro-admin/vercel.json goldeouro-admin/vercel-complex.json
echo "✅ Backup criado"

# 2. Ativar vercel.json simplificado
echo "🔧 Ativando vercel.json simplificado..."
cp goldeouro-player/vercel-simple.json goldeouro-player/vercel.json
cp goldeouro-admin/vercel-simple.json goldeouro-admin/vercel.json
echo "✅ Vercel.json simplificado ativado"

# 3. Verificar se kill-sw.html existe
echo "🔍 Verificando kill-sw.html..."
if [ -f "goldeouro-player/public/kill-sw.html" ]; then
    echo "✅ kill-sw.html Player encontrado"
else
    echo "❌ kill-sw.html Player não encontrado"
fi

if [ -f "goldeouro-admin/public/kill-sw.html" ]; then
    echo "✅ kill-sw.html Admin encontrado"
else
    echo "❌ kill-sw.html Admin não encontrado"
fi

# 4. Deploy Player
echo "🚀 Deploy Player..."
cd goldeouro-player
if vercel --prod --yes; then
    echo "✅ Player deployado com sucesso"
else
    echo "❌ Erro no deploy Player"
fi
cd ..

# 5. Deploy Admin
echo "🚀 Deploy Admin..."
cd goldeouro-admin
if vercel --prod --yes; then
    echo "✅ Admin deployado com sucesso"
else
    echo "❌ Erro no deploy Admin"
fi
cd ..

# 6. Instruções pós-deploy
echo ""
echo "🎯 PRÓXIMOS PASSOS:"
echo "1. Acesse https://www.goldeouro.lol/kill-sw.html"
echo "2. Acesse https://admin.goldeouro.lol/kill-sw.html"
echo "3. Teste o fluxo completo: login → PIX → jogo → saque"
echo "4. Verifique se a imagem de fundo do admin carrega"
echo ""
echo "✅ SIMPLE_MVP ATIVADO COM SUCESSO!"
echo "====================================="
