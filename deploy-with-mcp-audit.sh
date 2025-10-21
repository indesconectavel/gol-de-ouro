#!/bin/bash
# Deploy Script com Auditoria MCP - Gol de Ouro v1.1.1

echo "🚀 INICIANDO DEPLOY COM AUDITORIA MCP..."
echo "⏰ $(date)"
echo "=========================================="

# Executar auditoria MCP
"E:\Chute de Ouro\goldeouro-backend/mcp-audit-trigger.sh"

if [ $? -ne 0 ]; then
    echo "❌ AUDITORIA FALHOU - Deploy cancelado"
    exit 1
fi

echo "✅ AUDITORIA APROVADA - Iniciando deploy..."

# Deploy do Admin
echo "📱 Deployando Admin..."
cd "E:\Chute de Ouro\goldeouro-backend/goldeouro-admin"
npm run build
npx vercel --prod

# Deploy do Player
echo "🎮 Deployando Player..."
cd "E:\Chute de Ouro\goldeouro-backend/goldeouro-player"
npm run build
npx vercel --prod

echo "✅ DEPLOY CONCLUÍDO COM SUCESSO!"
echo "📊 Relatórios disponíveis em: E:\Chute de Ouro\goldeouro-backend\reports"
