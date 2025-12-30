#!/bin/bash

echo "📊 MONITORAMENTO EM TEMPO REAL - GOL DE OURO"
echo "============================================"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para testar endpoint
test_endpoint() {
    local url=$1
    local name=$2
    local expected_status=${3:-200}
    
    echo -e "${BLUE}🔍 Testando $name...${NC}"
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$response" = "$expected_status" ]; then
        echo -e "${GREEN}✅ $name: OK (HTTP $response)${NC}"
        return 0
    else
        echo -e "${RED}❌ $name: FALHOU (HTTP $response)${NC}"
        return 1
    fi
}

# Função para monitorar logs
monitor_logs() {
    echo -e "${BLUE}📊 Monitorando logs do Fly.io...${NC}"
    echo "Pressione Ctrl+C para parar"
    echo ""
    
    # Monitorar logs em tempo real
    flyctl logs --app goldeouro-backend
}

# Função para verificar status
check_status() {
    echo -e "${BLUE}📊 Verificando status do sistema...${NC}"
    echo ""
    
    # Verificar Fly.io
    echo -e "${YELLOW}⚙️ Backend (Fly.io):${NC}"
    flyctl status --app goldeouro-backend
    echo ""
    
    # Verificar endpoints
    echo -e "${YELLOW}🌐 Endpoints:${NC}"
    test_endpoint "https://goldeouro-backend.fly.dev/health" "Backend Health"
    test_endpoint "https://goldeouro-backend.fly.dev/api/metrics" "Backend Metrics"
    test_endpoint "https://goldeouro.lol" "Frontend Principal"
    echo ""
}

# Função para monitorar performance
monitor_performance() {
    echo -e "${BLUE}⚡ Monitorando performance...${NC}"
    echo ""
    
    # Testar tempo de resposta
    echo -e "${YELLOW}📊 Tempo de Resposta:${NC}"
    
    # Backend
    start_time=$(date +%s%3N)
    curl -s "https://goldeouro-backend.fly.dev/health" > /dev/null
    end_time=$(date +%s%3N)
    backend_time=$((end_time - start_time))
    
    # Frontend
    start_time=$(date +%s%3N)
    curl -s "https://goldeouro.lol" > /dev/null
    end_time=$(date +%s%3N)
    frontend_time=$((end_time - start_time))
    
    echo "Backend: ${backend_time}ms"
    echo "Frontend: ${frontend_time}ms"
    echo ""
    
    # Verificar se está dentro dos limites
    if [ $backend_time -lt 1000 ]; then
        echo -e "${GREEN}✅ Backend: Performance OK${NC}"
    else
        echo -e "${YELLOW}⚠️ Backend: Performance lenta${NC}"
    fi
    
    if [ $frontend_time -lt 3000 ]; then
        echo -e "${GREEN}✅ Frontend: Performance OK${NC}"
    else
        echo -e "${YELLOW}⚠️ Frontend: Performance lenta${NC}"
    fi
    echo ""
}

# Menu principal
echo -e "${YELLOW}📋 OPÇÕES DE MONITORAMENTO:${NC}"
echo ""
echo "1. Verificar status do sistema"
echo "2. Monitorar logs em tempo real"
echo "3. Monitorar performance"
echo "4. Testar todos os endpoints"
echo "5. Sair"
echo ""

read -p "Escolha uma opção (1-5): " option

case $option in
    1)
        check_status
        ;;
    2)
        monitor_logs
        ;;
    3)
        monitor_performance
        ;;
    4)
        echo -e "${BLUE}🧪 Testando todos os endpoints...${NC}"
        echo ""
        test_endpoint "https://goldeouro-backend.fly.dev/health" "Backend Health"
        test_endpoint "https://goldeouro-backend.fly.dev/api/metrics" "Backend Metrics"
        test_endpoint "https://goldeouro.lol" "Frontend Principal"
        echo ""
        ;;
    5)
        echo -e "${GREEN}👋 Saindo do monitoramento...${NC}"
        exit 0
        ;;
    *)
        echo -e "${RED}❌ Opção inválida!${NC}"
        exit 1
        ;;
esac

echo -e "${GREEN}✅ Monitoramento concluído!${NC}"
echo ""
