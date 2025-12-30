#!/bin/bash
# ROLLBACK ALL - Restaura banco e projeto completos do backup V19
# Uso: ./rollback_all.sh

set -e

BACKUP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ROLLBACK_DIR="$BACKUP_DIR/rollback"

echo "============================================================"
echo " ROLLBACK COMPLETO V19"
echo "============================================================"
echo ""

# Verificar se scripts existem
if [ ! -f "$ROLLBACK_DIR/rollback_database.sh" ] || [ ! -f "$ROLLBACK_DIR/rollback_project.sh" ]; then
    echo "ERRO: Scripts de rollback nao encontrados"
    exit 1
fi

echo "Este script ira executar:"
echo "  1. Rollback do banco de dados"
echo "  2. Rollback do projeto"
echo ""
read -p "Deseja continuar? (s/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "Rollback cancelado"
    exit 1
fi

# Executar rollback do banco
echo ""
echo "============================================================"
echo " ETAPA 1: ROLLBACK DO BANCO"
echo "============================================================"
bash "$ROLLBACK_DIR/rollback_database.sh"

# Executar rollback do projeto
echo ""
echo "============================================================"
echo " ETAPA 2: ROLLBACK DO PROJETO"
echo "============================================================"
bash "$ROLLBACK_DIR/rollback_project.sh"

# Relatório final
echo ""
echo "============================================================"
echo " ROLLBACK COMPLETO FINALIZADO"
echo "============================================================"
echo ""
echo "OK: Banco de dados: Restaurado (verificar manualmente)"
echo "OK: Projeto: Restaurado"
echo ""
echo "VALIDACAO POS-ROLLBACK:"
echo "   1. Verificar conexao com banco: npm test"
echo "   2. Verificar servidor: npm start"
echo "   3. Verificar rotas: curl http://localhost:8080/health"
echo ""
