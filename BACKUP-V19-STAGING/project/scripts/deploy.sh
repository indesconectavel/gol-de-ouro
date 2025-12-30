#!/bin/bash

# Script de Deploy para Gol de Ouro
# Uso: ./scripts/deploy.sh [environment]

set -e

ENVIRONMENT=${1:-production}
PROJECT_NAME="goldeouro"
DOCKER_COMPOSE_FILE="docker-compose.yml"

echo "🚀 Iniciando deploy do Gol de Ouro para $ENVIRONMENT..."

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando. Por favor, inicie o Docker e tente novamente."
    exit 1
fi

# Verificar se docker-compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose não está instalado. Por favor, instale e tente novamente."
    exit 1
fi

# Parar containers existentes
echo "🛑 Parando containers existentes..."
docker-compose -f $DOCKER_COMPOSE_FILE down

# Remover imagens antigas
echo "🧹 Removendo imagens antigas..."
docker image prune -f

# Fazer pull das imagens mais recentes
echo "📥 Fazendo pull das imagens mais recentes..."
docker-compose -f $DOCKER_COMPOSE_FILE pull

# Construir imagens localmente
echo "🔨 Construindo imagens localmente..."
docker-compose -f $DOCKER_COMPOSE_FILE build --no-cache

# Iniciar containers
echo "🚀 Iniciando containers..."
docker-compose -f $DOCKER_COMPOSE_FILE up -d

# Aguardar containers ficarem prontos
echo "⏳ Aguardando containers ficarem prontos..."
sleep 30

# Verificar saúde dos containers
echo "🏥 Verificando saúde dos containers..."
docker-compose -f $DOCKER_COMPOSE_FILE ps

# Verificar logs
echo "📋 Verificando logs..."
docker-compose -f $DOCKER_COMPOSE_FILE logs --tail=50

# Testar endpoints
echo "🧪 Testando endpoints..."
curl -f http://localhost:3000/health || echo "❌ Backend não está respondendo"
curl -f http://localhost:5174/ || echo "❌ Player não está respondendo"
curl -f http://localhost:5173/ || echo "❌ Admin não está respondendo"

echo "✅ Deploy concluído com sucesso!"
echo "🌐 Aplicações disponíveis em:"
echo "   - Player: http://localhost:5174"
echo "   - Admin: http://localhost:5173"
echo "   - Backend: http://localhost:3000"
