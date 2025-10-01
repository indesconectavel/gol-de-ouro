#!/bin/bash
# Script para Desativar SIMPLE_MVP - Gol de Ouro
# Data: 2025-10-01
# Versão: SIMPLE_MVP → v1.1.1 Complexo

echo "🔄 DESATIVANDO SIMPLE_MVP - GOL DE OURO"
echo "======================================="

# Verificar se estamos no diretório correto
if [ ! -d "goldeouro-player" ] || [ ! -d "goldeouro-admin" ]; then
    echo "❌ Erro: Execute este script no diretório raiz do projeto"
    exit 1
fi

echo "✅ Diretório correto detectado"

# 1. Verificar se backup existe
echo "🔍 Verificando backup do vercel.json complexo..."
if [ ! -f "goldeouro-player/vercel-complex.json" ]; then
    echo "❌ Backup não encontrado. Execute primeiro o rollback git:"
    echo "   git checkout v1.1.1-complex"
    exit 1
fi

if [ ! -f "goldeouro-admin/vercel-complex.json" ]; then
    echo "❌ Backup não encontrado. Execute primeiro o rollback git:"
    echo "   git checkout v1.1.1-complex"
    exit 1
fi

echo "✅ Backup encontrado"

# 2. Restaurar vercel.json complexo
echo "🔄 Restaurando vercel.json complexo..."
cp goldeouro-player/vercel-complex.json goldeouro-player/vercel.json
cp goldeouro-admin/vercel-complex.json goldeouro-admin/vercel.json
echo "✅ Vercel.json complexo restaurado"

# 3. Deploy Player
echo "🚀 Deploy Player..."
cd goldeouro-player
if vercel --prod --yes; then
    echo "✅ Player deployado com sucesso"
else
    echo "❌ Erro no deploy Player"
fi
cd ..

# 4. Deploy Admin
echo "🚀 Deploy Admin..."
cd goldeouro-admin
if vercel --prod --yes; then
    echo "✅ Admin deployado com sucesso"
else
    echo "❌ Erro no deploy Admin"
fi
cd ..

# 5. Instruções pós-deploy
echo ""
echo "🎯 PRÓXIMOS PASSOS:"
echo "1. Teste se a imagem de fundo do admin carrega"
echo "2. Teste o fluxo completo: login → PIX → jogo → saque"
echo "3. Verifique se o Service Worker está funcionando"
echo ""
echo "✅ SIMPLE_MVP DESATIVADO COM SUCESSO!"
echo "======================================="
