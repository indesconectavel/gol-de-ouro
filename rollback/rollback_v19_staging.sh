#!/bin/bash
# ROLLBACK V19 STAGING - Restaura estado anterior da migration V19

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="$PROJECT_ROOT/BACKUP-V19-STAGING"
ROLLBACK_SQL="$PROJECT_ROOT/prisma/migrations/20251205_v19_rollback.sql"

echo "============================================================"
echo " ROLLBACK V19 STAGING"
echo "============================================================"
echo ""

# Verificar se backup existe
if [ ! -d "$BACKUP_DIR" ]; then
    echo "❌ ERRO: Backup não encontrado em $BACKUP_DIR"
    exit 1
fi

echo "📦 Restaurando arquivos do projeto..."
if [ -d "$BACKUP_DIR/project" ]; then
    cp -R "$BACKUP_DIR/project/"* "$PROJECT_ROOT/"
    echo "✅ Arquivos restaurados"
else
    echo "⚠️  Diretório project não encontrado no backup"
fi

echo ""
echo "🔄 Aplicando rollback SQL..."
if [ -f "$ROLLBACK_SQL" ]; then
    if [ -z "$DATABASE_URL" ]; then
        echo "⚠️  DATABASE_URL não configurada"
        echo "   Execute manualmente no Supabase Dashboard SQL Editor:"
        echo "   $ROLLBACK_SQL"
    else
        psql "$DATABASE_URL" -f "$ROLLBACK_SQL"
        echo "✅ Rollback SQL aplicado"
    fi
else
    echo "⚠️  Arquivo de rollback SQL não encontrado"
fi

echo ""
echo "🔄 Revertendo flags no .env.local..."
if [ -f "$PROJECT_ROOT/.env.local" ]; then
    sed -i.bak 's/USE_DB_QUEUE=true/USE_DB_QUEUE=false/g' "$PROJECT_ROOT/.env.local"
    sed -i.bak 's/USE_ENGINE_V19=true/USE_ENGINE_V19=false/g' "$PROJECT_ROOT/.env.local"
    echo "✅ Flags revertidas"
fi

echo ""
echo "============================================================"
echo " ROLLBACK CONCLUÍDO"
echo "============================================================"

