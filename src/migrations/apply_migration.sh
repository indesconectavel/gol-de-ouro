#!/bin/bash
# APPLY MIGRATION V19
# Script para aplicar migration SQL de forma segura

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
MIGRATION_FILE="$PROJECT_ROOT/prisma/migrations/20251205_v19_rls_indexes_migration.sql"
LOG_DIR="$PROJECT_ROOT/logs"

# Criar diretório de logs
mkdir -p "$LOG_DIR"

TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
LOG_FILE="$LOG_DIR/migration-$TIMESTAMP.log"

echo "============================================================" | tee -a "$LOG_FILE"
echo " APLICANDO MIGRATION V19" | tee -a "$LOG_FILE"
echo "============================================================" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# Verificar se DATABASE_URL está configurada
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERRO: DATABASE_URL não configurada" | tee -a "$LOG_FILE"
    echo "Configure: export DATABASE_URL='postgresql://...'" | tee -a "$LOG_FILE"
    exit 1
fi

# Verificar se arquivo de migration existe
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ ERRO: Arquivo de migration não encontrado: $MIGRATION_FILE" | tee -a "$LOG_FILE"
    exit 1
fi

echo "✅ Arquivo de migration encontrado: $MIGRATION_FILE" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# Executar migration
echo "📋 Executando migration via psql..." | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

if psql "$DATABASE_URL" -f "$MIGRATION_FILE" >> "$LOG_FILE" 2>&1; then
    echo "" | tee -a "$LOG_FILE"
    echo "✅ Migration aplicada com sucesso" | tee -a "$LOG_FILE"
    echo "" | tee -a "$LOG_FILE"
    echo "Log completo: $LOG_FILE" | tee -a "$LOG_FILE"
    exit 0
else
    echo "" | tee -a "$LOG_FILE"
    echo "❌ ERRO ao aplicar migration" | tee -a "$LOG_FILE"
    echo "" | tee -a "$LOG_FILE"
    echo "Log completo: $LOG_FILE" | tee -a "$LOG_FILE"
    exit 1
fi

