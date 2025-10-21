#!/bin/bash
# MCP Audit Command - Gol de Ouro v1.1.1
# Executado automaticamente antes de push/deploy

echo "🔍 INICIANDO AUDITORIA MCP AUTOMÁTICA..."
echo "⏰ $(date)"
echo "=========================================="

# Navegar para diretório MCP
cd "E:\Chute de Ouro\goldeouro-backend\mcp-system"

# Executar auditoria completa
node audit-simple.js

# Verificar se auditoria passou
if [ $? -eq 0 ]; then
    echo "✅ AUDITORIA MCP CONCLUÍDA COM SUCESSO"
    echo "🚀 Deploy autorizado"
    exit 0
else
    echo "❌ AUDITORIA MCP FALHOU"
    echo "🛑 Deploy bloqueado - Corrija os problemas antes de continuar"
    exit 1
fi
