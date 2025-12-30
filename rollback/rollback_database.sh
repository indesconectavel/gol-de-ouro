#!/bin/bash
# ROLLBACK DATABASE V19 - Restaura banco de dados do backup
# Uso: ./rollback_database.sh [--force]

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKUP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DATABASE_BACKUP_DIR="$BACKUP_DIR/database"
ROLLBACK_SQL="$SCRIPT_DIR/../prisma/migrations/20251205_v19_rollback.sql"

FORCE_MODE=false
if [[ "$1" == "--force" ]]; then
    FORCE_MODE=true
fi

echo "============================================================"
echo " ROLLBACK DATABASE V19"
echo "============================================================"
echo ""

# Verificar se DATABASE_URL está configurada
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERRO: DATABASE_URL não configurada"
    exit 1
fi

# Verificar se backup existe
if [ ! -f "$DATABASE_BACKUP_DIR/schema-consolidado.sql" ]; then
    echo "⚠️  AVISO: Arquivo schema-consolidado.sql não encontrado"
fi

# Verificar checksums
if [ -f "$BACKUP_DIR/checksums.json" ]; then
    echo "✅ Checksums encontrados"
else
    echo "⚠️  AVISO: Arquivo checksums.json não encontrado"
fi

echo ""
echo "⚠️  ATENÇÃO: Este script irá:"
echo "   1. Executar rollback SQL (remover policies, desabilitar RLS)"
echo "   2. Restaurar schema do backup (se backup.dump existir)"
echo ""

if [ "$FORCE_MODE" = false ]; then
    read -p "Deseja continuar? (s/N): " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        echo "❌ Rollback cancelado"
        exit 1
    fi
fi

# Executar rollback SQL
if [ -f "$ROLLBACK_SQL" ]; then
    echo ""
    echo "📋 Executando rollback SQL..."
    if psql "$DATABASE_URL" -f "$ROLLBACK_SQL"; then
        echo "✅ Rollback SQL executado"
    else
        echo "❌ ERRO ao executar rollback SQL"
        exit 1
    fi
else
    echo "⚠️  Arquivo de rollback SQL não encontrado: $ROLLBACK_SQL"
fi

# Restaurar backup se existir
BACKUP_DUMP=$(ls -t "$DATABASE_BACKUP_DIR"/backup.pre_migration_*.dump 2>/dev/null | head -1)
if [ -n "$BACKUP_DUMP" ]; then
    echo ""
    echo "📦 Restaurando backup: $BACKUP_DUMP"
    echo "⚠️  ATENÇÃO: Isso irá restaurar o estado anterior do banco"
    
    if [ "$FORCE_MODE" = false ]; then
        read -p "Deseja restaurar o backup? (s/N): " -n 1 -r
        echo ""
        
        if [[ ! $REPLY =~ ^[Ss]$ ]]; then
            echo "⚠️  Restauração de backup cancelada"
        else
            if pg_restore -c "$DATABASE_URL" "$BACKUP_DUMP"; then
                echo "✅ Backup restaurado"
            else
                echo "❌ ERRO ao restaurar backup"
                exit 1
            fi
        fi
    else
        if pg_restore -c "$DATABASE_URL" "$BACKUP_DUMP"; then
            echo "✅ Backup restaurado"
        else
            echo "❌ ERRO ao restaurar backup"
            exit 1
        fi
    fi
else
    echo "⚠️  Backup dump não encontrado"
fi

echo ""
echo "✅ Rollback do banco concluído"
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo "   1. Verificar estado do banco: psql \"$DATABASE_URL\" -c \"SELECT COUNT(*) FROM lotes;\""
echo "   2. Verificar RLS: psql \"$DATABASE_URL\" -c \"SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';\""
echo ""

