#!/bin/bash

# Script de Backup para Gol de Ouro
# Uso: ./scripts/backup.sh

set -e

BACKUP_DIR="/opt/backups/goldeouro"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="goldeouro_backup_$DATE.tar.gz"

echo "💾 Iniciando backup do Gol de Ouro..."

# Criar diretório de backup se não existir
mkdir -p $BACKUP_DIR

# Backup do banco de dados PostgreSQL
echo "🗄️ Fazendo backup do banco de dados..."
docker exec goldeouro-postgres pg_dump -U goldeouro goldeouro > $BACKUP_DIR/postgres_$DATE.sql

# Backup do Redis
echo "🔴 Fazendo backup do Redis..."
docker exec goldeouro-redis redis-cli BGSAVE
docker cp goldeouro-redis:/data/dump.rdb $BACKUP_DIR/redis_$DATE.rdb

# Backup dos volumes Docker
echo "📦 Fazendo backup dos volumes Docker..."
docker run --rm -v goldeouro_postgres-data:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/postgres-data_$DATE.tar.gz -C /data .
docker run --rm -v goldeouro_redis-data:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/redis-data_$DATE.tar.gz -C /data .

# Backup dos arquivos de configuração
echo "⚙️ Fazendo backup dos arquivos de configuração..."
tar czf $BACKUP_DIR/config_$DATE.tar.gz \
  docker-compose.yml \
  nginx/ \
  monitoring/ \
  scripts/ \
  .github/

# Criar arquivo de backup completo
echo "📁 Criando arquivo de backup completo..."
tar czf $BACKUP_DIR/$BACKUP_FILE \
  $BACKUP_DIR/postgres_$DATE.sql \
  $BACKUP_DIR/redis_$DATE.rdb \
  $BACKUP_DIR/postgres-data_$DATE.tar.gz \
  $BACKUP_DIR/redis-data_$DATE.tar.gz \
  $BACKUP_DIR/config_$DATE.tar.gz

# Remover arquivos temporários
rm -f $BACKUP_DIR/postgres_$DATE.sql
rm -f $BACKUP_DIR/redis_$DATE.rdb
rm -f $BACKUP_DIR/postgres-data_$DATE.tar.gz
rm -f $BACKUP_DIR/redis-data_$DATE.tar.gz
rm -f $BACKUP_DIR/config_$DATE.tar.gz

# Manter apenas os últimos 7 backups
echo "🧹 Removendo backups antigos..."
ls -t $BACKUP_DIR/goldeouro_backup_*.tar.gz | tail -n +8 | xargs -r rm

echo "✅ Backup concluído: $BACKUP_DIR/$BACKUP_FILE"

# Enviar para storage remoto (opcional)
if [ ! -z "$BACKUP_S3_BUCKET" ]; then
    echo "☁️ Enviando backup para S3..."
    aws s3 cp $BACKUP_DIR/$BACKUP_FILE s3://$BACKUP_S3_BUCKET/
fi
