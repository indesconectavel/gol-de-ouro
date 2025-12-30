#!/bin/bash
# BACKUP BEFORE MIGRATION - Cria backup antes de aplicar migration
# Gera backup.dump e valida checksum

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
BACKUP_DIR="$PROJECT_ROOT/BACKUP-V19-SNAPSHOT/database"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
BACKUP_FILE="$BACKUP_DIR/backup.pre_migration_$TIMESTAMP.dump"

echo "============================================================"
echo " BACKUP ANTES DA MIGRATION V19"
echo "============================================================"
echo ""

# Verificar se DATABASE_URL está configurada
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERRO: DATABASE_URL não configurada"
    exit 1
fi

# Criar diretório de backup
mkdir -p "$BACKUP_DIR"

echo "📦 Criando backup do banco de dados..."
echo "   Arquivo: $BACKUP_FILE"
echo ""

# Criar backup via pg_dump
if pg_dump "$DATABASE_URL" -F c -f "$BACKUP_FILE"; then
    echo "✅ Backup criado com sucesso"
    
    # Validar tamanho do backup
    BACKUP_SIZE=$(stat -f%z "$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_FILE" 2>/dev/null)
    BACKUP_SIZE_MB=$(echo "scale=2; $BACKUP_SIZE / 1024 / 1024" | bc)
    
    echo "   Tamanho: ${BACKUP_SIZE_MB} MB"
    echo ""
    
    # Gerar checksum
    CHECKSUM=$(sha256sum "$BACKUP_FILE" | cut -d' ' -f1)
    echo "$CHECKSUM  $(basename $BACKUP_FILE)" > "${BACKUP_FILE}.sha256"
    echo "✅ Checksum gerado: ${CHECKSUM:0:16}..."
    echo ""
    
    echo "✅ Backup concluído com sucesso"
    echo "   Arquivo: $BACKUP_FILE"
    echo "   Checksum: $BACKUP_FILE.sha256"
    exit 0
else
    echo "❌ ERRO ao criar backup"
    exit 1
fi

