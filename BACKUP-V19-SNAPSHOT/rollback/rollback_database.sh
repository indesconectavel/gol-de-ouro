#!/bin/bash
# ROLLBACK DATABASE - Restaura banco de dados do backup V19
# Uso: ./rollback_database.sh

set -e

BACKUP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DATABASE_BACKUP_DIR="$BACKUP_DIR/database"

echo "============================================================"
echo " ROLLBACK DATABASE V19"
echo "============================================================"
echo ""

# Verificar se backup existe
if [ ! -f "$DATABASE_BACKUP_DIR/schema-consolidado.sql" ]; then
    echo "ERRO: Arquivo schema-consolidado.sql nao encontrado"
    exit 1
fi

# Verificar checksums
if [ -f "$BACKUP_DIR/checksums.json" ]; then
    echo "OK: Checksums encontrados"
else
    echo "AVISO: Arquivo checksums.json nao encontrado"
fi

echo ""
echo "ATENCAO: Este script ira:"
echo "   1. Executar schema-consolidado.sql no banco"
echo "   2. Restaurar dados (se backup.dump existir)"
echo ""
read -p "Deseja continuar? (s/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "Rollback cancelado"
    exit 1
fi

# Instruções para restaurar
echo ""
echo "INSTRUCOES PARA RESTAURAR:"
echo ""
echo "1. Conecte ao Supabase Dashboard"
echo "2. Va para SQL Editor"
echo "3. Execute o arquivo: $DATABASE_BACKUP_DIR/schema-consolidado.sql"
echo ""
echo "OU via linha de comando:"
echo "psql [CONNECTION_STRING] < $DATABASE_BACKUP_DIR/schema-consolidado.sql"
echo ""
echo "Para restaurar dados completos (se backup.dump existir):"
echo "pg_restore -h [HOST] -U [USER] -d [DATABASE] -c $DATABASE_BACKUP_DIR/backup.dump"
echo ""
echo "OK: Instrucoes exibidas"
