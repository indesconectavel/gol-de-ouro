#!/bin/bash

# Script de Inicialização para Gol de Ouro
# Uso: ./scripts/start.sh

set -e

echo "🚀 Iniciando Gol de Ouro..."

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando. Por favor, inicie o Docker e tente novamente."
    exit 1
fi

# Gerar certificados SSL se não existirem
if [ ! -f "nginx/ssl/goldeouro.lol.crt" ]; then
    echo "🔐 Gerando certificados SSL..."
    ./scripts/generate-ssl.sh
fi

# Iniciar aplicação principal
echo "🐳 Iniciando containers da aplicação..."
docker-compose up -d

# Aguardar containers ficarem prontos
echo "⏳ Aguardando containers ficarem prontos..."
sleep 30

# Verificar saúde dos containers
echo "🏥 Verificando saúde dos containers..."
docker-compose ps

# Iniciar monitoramento (opcional)
if [ "$1" = "--with-monitoring" ]; then
    echo "📊 Iniciando monitoramento..."
    docker-compose -f monitoring/docker-compose.monitoring.yml up -d
fi

echo "✅ Gol de Ouro iniciado com sucesso!"
echo ""
echo "🌐 Aplicações disponíveis:"
echo "   - Player: http://localhost:5174"
echo "   - Admin: http://localhost:5173"
echo "   - Backend: http://localhost:3000"
echo ""
if [ "$1" = "--with-monitoring" ]; then
    echo "📊 Monitoramento:"
    echo "   - Grafana: http://localhost:3001 (admin/admin123)"
    echo "   - Prometheus: http://localhost:9090"
fi
echo ""
echo "📋 Para parar a aplicação: docker-compose down"
echo "📋 Para ver logs: docker-compose logs -f"
