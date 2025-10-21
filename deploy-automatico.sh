#!/bin/bash
# DEPLOY AUTOMÁTICO COM VALIDAÇÃO - GOL DE OURO
# =============================================
# Data: 20/10/2025
# Status: DEPLOY SEGURO COM VALIDAÇÃO AUTOMÁTICA

echo "🚀 === DEPLOY AUTOMÁTICO GOL DE OURO ==="
echo "📅 Data: $(date)"
echo ""

# Executar validação pré-deploy
echo "🔍 Executando validação pré-deploy..."
node validacao-pre-deploy.js

if [ $? -ne 0 ]; then
    echo "❌ VALIDAÇÃO FALHOU - DEPLOY CANCELADO"
    exit 1
fi

echo ""
echo "✅ Validação concluída com sucesso!"
echo ""

# Deploy do backend
echo "🔄 Fazendo deploy do backend..."
fly deploy

if [ $? -ne 0 ]; then
    echo "❌ DEPLOY DO BACKEND FALHOU"
    exit 1
fi

echo ""
echo "✅ Backend deployado com sucesso!"
echo ""

# Deploy do frontend
echo "🔄 Fazendo deploy do frontend..."
cd goldeouro-player
vercel --prod

if [ $? -ne 0 ]; then
    echo "❌ DEPLOY DO FRONTEND FALHOU"
    exit 1
fi

cd ..

echo ""
echo "✅ Frontend deployado com sucesso!"
echo ""

# Teste final
echo "🧪 Executando teste final..."
node auditoria-configuracao.js

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 === DEPLOY CONCLUÍDO COM SUCESSO ==="
    echo "✅ Backend: https://goldeouro-backend.fly.dev"
    echo "✅ Frontend: https://goldeouro.lol"
    echo "✅ Admin: https://admin.goldeouro.lol"
    echo ""
    echo "🚀 SISTEMA PRONTO PARA PRODUÇÃO!"
else
    echo ""
    echo "⚠️ DEPLOY CONCLUÍDO COM AVISOS"
    echo "🔍 Verifique os logs acima para detalhes"
fi
