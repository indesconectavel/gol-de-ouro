#!/bin/bash
# ROLLBACK DO CÓDIGO - Linux/Mac
# Data: 2025-12-09_17-44-53
#
# Este script restaura o código do backup ZIP

BACKUP_ZIP="backups/codigo/backup_codigo_2025-12-09_17-44-53.zip"
TEMP_DIR="rollback_temp_2025-12-09_17-44-53"

echo "🔄 Iniciando rollback do código..."

if [ ! -f "$BACKUP_ZIP" ]; then
    echo "❌ Arquivo de backup não encontrado: $BACKUP_ZIP"
    exit 1
fi

# Verificar se unzip está instalado
if ! command -v unzip &> /dev/null; then
    echo "❌ unzip não está instalado. Instale com: sudo apt-get install unzip"
    exit 1
fi

# Extrair backup
echo "📦 Extraindo backup..."
unzip -q "$BACKUP_ZIP" -d "$TEMP_DIR"

if [ $? -eq 0 ]; then
    echo "✅ Backup extraído com sucesso!"
    echo "⚠️ Restaure manualmente os arquivos de $TEMP_DIR para o projeto"
else
    echo "❌ Erro ao extrair backup"
    exit 1
fi

echo "✅ Rollback do código concluído!"
