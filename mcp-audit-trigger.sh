#!/bin/bash
# MCP Audit Command - Gol de Ouro v1.1.1
# Executado automaticamente antes de push/deploy

echo "⚙️ MCP AUDIT HOOK — GOL DE OURO"
echo "================================="

# Obter informações do git
BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
VERSION="GO-LIVE v1.1.1"
TIMESTAMP=$(date '+%Y-%m-%d-%H-%M-%S')

echo "Branch: $BRANCH"
echo "Versão: $VERSION"
echo "Timestamp: $TIMESTAMP"
echo ""

# Navegar para diretório MCP
cd "E:\Chute de Ouro\goldeouro-backend\mcp-system"

# Executar auditoria com relatório
echo "🔍 Executando auditoria MCP..."
node audit-simple.js --report

# Verificar resultado da auditoria
AUDIT_EXIT_CODE=$?

# Gerar relatório
REPORT_DIR="E:\Chute de Ouro\goldeouro-backend\reports"
LATEST_REPORT="$REPORT_DIR/audit-latest.md"
TIMESTAMPED_REPORT="$REPORT_DIR/audit-$TIMESTAMP.md"

# Copiar relatório mais recente
if [ -f "$LATEST_REPORT" ]; then
    cp "$LATEST_REPORT" "$TIMESTAMPED_REPORT"
fi

# Determinar status
if [ $AUDIT_EXIT_CODE -eq 0 ]; then
    STATUS="✅ OK"
    echo "Status: $STATUS"
    echo "Relatório salvo em: $LATEST_REPORT"
    echo ""
    echo "✅ AUDITORIA APROVADA - Deploy autorizado"
    exit 0
elif [ $AUDIT_EXIT_CODE -eq 1 ]; then
    STATUS="⚠️ ALERTA"
    echo "Status: $STATUS"
    echo "Relatório salvo em: $LATEST_REPORT"
    echo ""
    echo "⚠️ AUDITORIA COM ALERTAS - Deploy continuará com avisos"
    exit 0
else
    STATUS="❌ ERRO"
    echo "Status: $STATUS"
    echo "Relatório salvo em: $LATEST_REPORT"
    echo ""
    echo "❌ AUDITORIA FALHOU - Deploy cancelado"
    echo "🔧 Corrija os problemas antes de continuar"
    exit 1
fi
