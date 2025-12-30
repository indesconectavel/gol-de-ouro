#!/bin/bash
# ARCHIVE OBSOLETE CODE - Move código obsoleto para archive/
# Não deleta, apenas move e gera relatório

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ARCHIVE_DIR="$PROJECT_ROOT/archive/legacy"
REPORT_FILE="$ARCHIVE_DIR/archive_report_$(date +%Y%m%d-%H%M%S).json"

echo "============================================================"
echo " ARQUIVAMENTO DE CÓDIGO OBSOLETO"
echo "============================================================"
echo ""

mkdir -p "$ARCHIVE_DIR"

# Lista de arquivos/diretórios obsoletos
OBSOLETE_FILES=(
    "routes/filaRoutes.js"
    "services/queueService.js"
    "routes/analyticsRoutes_fixed.js"
    "routes/analyticsRoutes_optimized.js"
    "routes/analyticsRoutes_v1.js"
    "routes/analyticsRoutes.js.backup"
)

OBSOLETE_TABLES=(
    "partidas"
    "partida_jogadores"
    "fila_jogadores"
)

archived_files=()

# Função para calcular checksum
calculate_checksum() {
    local file="$1"
    if [ -f "$file" ]; then
        sha256sum "$file" | cut -d' ' -f1
    else
        echo ""
    fi
}

# Arquivar arquivos
echo "📦 Arquivando arquivos obsoletos..."
echo ""

for file in "${OBSOLETE_FILES[@]}"; do
    source_file="$PROJECT_ROOT/$file"
    if [ -f "$source_file" ]; then
        # Criar estrutura de diretórios no archive
        archive_path="$ARCHIVE_DIR/$file"
        archive_dir=$(dirname "$archive_path")
        mkdir -p "$archive_dir"
        
        # Copiar arquivo
        cp "$source_file" "$archive_path"
        
        # Calcular checksums
        source_checksum=$(calculate_checksum "$source_file")
        archive_checksum=$(calculate_checksum "$archive_path")
        
        archived_files+=("{
            \"arquivo\": \"$file\",
            \"caminho_antigo\": \"$source_file\",
            \"caminho_novo\": \"$archive_path\",
            \"checksum_antigo\": \"$source_checksum\",
            \"checksum_novo\": \"$archive_checksum\",
            \"tamanho\": $(stat -f%z "$source_file" 2>/dev/null || stat -c%s "$source_file" 2>/dev/null),
            \"data_arquivamento\": \"$(date -Iseconds)\"
        }")
        
        echo "✅ Arquivado: $file"
    else
        echo "⚠️  Arquivo não encontrado: $file"
    fi
done

# Gerar relatório JSON
echo ""
echo "📄 Gerando relatório..."

report_content="{
    \"data\": \"$(date -Iseconds)\",
    \"total_arquivos\": ${#archived_files[@]},
    \"arquivos\": [
        $(IFS=','; echo "${archived_files[*]}")
    ],
    \"tabelas_obsoletas\": [
        $(printf '"%s",' "${OBSOLETE_TABLES[@]}" | sed 's/,$//')
    ]
}"

echo "$report_content" | jq '.' > "$REPORT_FILE" 2>/dev/null || echo "$report_content" > "$REPORT_FILE"

echo ""
echo "✅ Arquivamento concluído"
echo "   Arquivos arquivados: ${#archived_files[@]}"
echo "   Relatório: $REPORT_FILE"
echo ""
echo "⚠️  NOTA: Arquivos originais NÃO foram deletados"
echo "   Eles foram copiados para: $ARCHIVE_DIR"
echo ""

