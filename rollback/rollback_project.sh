#!/bin/bash
# ROLLBACK PROJECT V19 - Restaura código do projeto do backup
# Uso: ./rollback_project.sh [--force]

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKUP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PROJECT_BACKUP_DIR="$BACKUP_DIR/project"
PROJECT_ROOT="$(cd "$BACKUP_DIR/.." && pwd)"

FORCE_MODE=false
if [[ "$1" == "--force" ]]; then
    FORCE_MODE=true
fi

echo "============================================================"
echo " ROLLBACK PROJECT V19"
echo "============================================================"
echo ""

# Verificar se backup existe
if [ ! -d "$PROJECT_BACKUP_DIR" ]; then
    echo "❌ ERRO: Diretório de backup não encontrado: $PROJECT_BACKUP_DIR"
    exit 1
fi

# Verificar checksums
if [ -f "$BACKUP_DIR/checksums.json" ]; then
    echo "✅ Checksums encontrados"
    CHECKSUMS_FILE="$BACKUP_DIR/checksums.json"
else
    echo "⚠️  AVISO: Arquivo checksums.json não encontrado"
    CHECKSUMS_FILE=""
fi

echo ""
echo "⚠️  ATENÇÃO: Este script irá:"
echo "   1. Fazer backup do estado atual (em BACKUP-PRE-ROLLBACK/)"
echo "   2. Restaurar arquivos do backup V19"
echo ""

if [ "$FORCE_MODE" = false ]; then
    read -p "Deseja continuar? (s/N): " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        echo "❌ Rollback cancelado"
        exit 1
    fi
fi

# Criar backup pré-rollback
PRE_ROLLBACK_DIR="$PROJECT_ROOT/BACKUP-PRE-ROLLBACK"
echo ""
echo "📦 Criando backup pré-rollback em $PRE_ROLLBACK_DIR..."
mkdir -p "$PRE_ROLLBACK_DIR"

# Copiar arquivos críticos antes de restaurar
CRITICAL_FILES=("server-fly.js" "package.json" "package-lock.json" ".env")

for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$PROJECT_ROOT/$file" ]; then
        cp "$PROJECT_ROOT/$file" "$PRE_ROLLBACK_DIR/" 2>/dev/null || true
    fi
done

# Restaurar diretórios
DIRECTORIES=("controllers" "services" "routes" "middlewares" "utils" "database" "scripts" "config" "prisma" "src")

echo ""
echo "📁 Restaurando diretórios..."
for dir in "${DIRECTORIES[@]}"; do
    if [ -d "$PROJECT_BACKUP_DIR/$dir" ]; then
        echo "  Restaurando $dir/..."
        rm -rf "$PROJECT_ROOT/$dir"
        cp -r "$PROJECT_BACKUP_DIR/$dir" "$PROJECT_ROOT/$dir"
    fi
done

# Restaurar arquivos
echo ""
echo "📄 Restaurando arquivos..."
FILES=("server-fly.js" "package.json" "package-lock.json" "fly.toml" "fly.production.toml" "Dockerfile" "docker-compose.yml" "Procfile" "jest.config.js" "cursor.json" ".env.example")

for file in "${FILES[@]}"; do
    if [ -f "$PROJECT_BACKUP_DIR/$file" ]; then
        echo "  Restaurando $file..."
        cp "$PROJECT_BACKUP_DIR/$file" "$PROJECT_ROOT/$file"
    fi
done

echo ""
echo "✅ Rollback do projeto concluído"
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo "   1. Instalar dependências: npm install"
echo "   2. Verificar variáveis de ambiente: .env"
echo "   3. Reiniciar servidor: npm start"
echo ""

