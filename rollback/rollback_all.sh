#!/bin/bash
# ROLLBACK ALL V19 - Restaura banco e projeto completos
# Uso: ./rollback_all.sh [--force]

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROLLBACK_DIR="$SCRIPT_DIR"

FORCE_MODE=false
if [[ "$1" == "--force" ]]; then
    FORCE_MODE=true
fi

echo "============================================================"
echo " ROLLBACK COMPLETO V19"
echo "============================================================"
echo ""

# Verificar se scripts existem
if [ ! -f "$ROLLBACK_DIR/rollback_database.sh" ] || [ ! -f "$ROLLBACK_DIR/rollback_project.sh" ]; then
    echo "❌ ERRO: Scripts de rollback não encontrados"
    exit 1
fi

echo "Este script irá executar:"
echo "  1. Rollback do banco de dados"
echo "  2. Rollback do projeto"
echo ""

if [ "$FORCE_MODE" = false ]; then
    read -p "Deseja continuar? (s/N): " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        echo "❌ Rollback cancelado"
        exit 1
    fi
fi

# Executar rollback do banco
echo ""
echo "============================================================"
echo " ETAPA 1: ROLLBACK DO BANCO"
echo "============================================================"
bash "$ROLLBACK_DIR/rollback_database.sh" $([ "$FORCE_MODE" = true ] && echo "--force" || echo "")

# Executar rollback do projeto
echo ""
echo "============================================================"
echo " ETAPA 2: ROLLBACK DO PROJETO"
echo "============================================================"
bash "$ROLLBACK_DIR/rollback_project.sh" $([ "$FORCE_MODE" = true ] && echo "--force" || echo "")

# Relatório final
echo ""
echo "============================================================"
echo " ROLLBACK COMPLETO FINALIZADO"
echo "============================================================"
echo ""
echo "✅ Banco de dados: Restaurado"
echo "✅ Projeto: Restaurado"
echo ""
echo "📋 VALIDAÇÃO PÓS-ROLLBACK:"
echo "   1. Verificar conexão com banco: npm test"
echo "   2. Verificar servidor: npm start"
echo "   3. Verificar rotas: curl http://localhost:8080/health"
echo ""

# Enviar webhook se configurado
if [ -n "$ROLLBACK_WEBHOOK_URL" ]; then
    curl -X POST "$ROLLBACK_WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -d "{\"text\": \"🔄 Rollback V19 executado em $(date)\"}" \
        2>/dev/null || true
fi

echo ""

