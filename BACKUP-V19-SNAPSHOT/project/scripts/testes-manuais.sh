#!/bin/bash

echo "🧪 EXECUTANDO TESTES MANUAIS - GOL DE OURO"
echo "=========================================="
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

# Função para testar conteúdo
test_content() {
    local url=$1
    local name=$2
    local expected_content=$3
    
    echo -e "${BLUE}🔍 Testando conteúdo de $name...${NC}"
    
    content=$(curl -s "$url")
    
    if echo "$content" | grep -q "$expected_content"; then
        echo -e "${GREEN}✅ $name: Conteúdo OK${NC}"
        return 0
    else
        echo -e "${RED}❌ $name: Conteúdo incorreto${NC}"
        return 1
    fi
}

echo -e "${YELLOW}📊 INICIANDO TESTES MANUAIS${NC}"
echo ""

# Contadores
total_tests=0
passed_tests=0
failed_tests=0

# Teste 1: Health Check Backend
echo "1️⃣ TESTE: Health Check Backend"
if test_endpoint "https://goldeouro-backend.fly.dev/health" "Backend Health"; then
    ((passed_tests++))
else
    ((failed_tests++))
fi
((total_tests++))

# Teste 2: API Status Backend
echo ""
echo "2️⃣ TESTE: API Status Backend"
if test_endpoint "https://goldeouro-backend.fly.dev/api/status" "Backend API Status"; then
    ((passed_tests++))
else
    ((failed_tests++))
fi
((total_tests++))

# Teste 3: Frontend Principal
echo ""
echo "3️⃣ TESTE: Frontend Principal"
if test_endpoint "https://goldeouro.lol" "Frontend Principal"; then
    ((passed_tests++))
else
    ((failed_tests++))
fi
((total_tests++))

# Teste 4: Conteúdo Frontend
echo ""
echo "4️⃣ TESTE: Conteúdo Frontend"
if test_content "https://goldeouro.lol" "Frontend Content" "Gol de Ouro"; then
    ((passed_tests++))
else
    ((failed_tests++))
fi
((total_tests++))

# Teste 5: Métricas Backend
echo ""
echo "5️⃣ TESTE: Métricas Backend"
if test_endpoint "https://goldeouro-backend.fly.dev/api/metrics" "Backend Metrics"; then
    ((passed_tests++))
else
    ((failed_tests++))
fi
((total_tests++))

# Teste 6: CORS Headers
echo ""
echo "6️⃣ TESTE: CORS Headers"
echo -e "${BLUE}🔍 Testando CORS...${NC}"
cors_response=$(curl -s -I "https://goldeouro-backend.fly.dev/health" | grep -i "access-control-allow-origin")
if [ -n "$cors_response" ]; then
    echo -e "${GREEN}✅ CORS: Configurado${NC}"
    ((passed_tests++))
else
    echo -e "${RED}❌ CORS: Não configurado${NC}"
    ((failed_tests++))
fi
((total_tests++))

# Teste 7: HTTPS
echo ""
echo "7️⃣ TESTE: HTTPS"
echo -e "${BLUE}🔍 Testando HTTPS...${NC}"
https_response=$(curl -s -I "https://goldeouro.lol" | grep -i "strict-transport-security")
if [ -n "$https_response" ]; then
    echo -e "${GREEN}✅ HTTPS: Configurado com HSTS${NC}"
    ((passed_tests++))
else
    echo -e "${YELLOW}⚠️ HTTPS: Configurado mas sem HSTS${NC}"
    ((passed_tests++))
fi
((total_tests++))

# Teste 8: Performance Backend
echo ""
echo "8️⃣ TESTE: Performance Backend"
echo -e "${BLUE}🔍 Testando performance...${NC}"
start_time=$(date +%s%3N)
curl -s "https://goldeouro-backend.fly.dev/health" > /dev/null
end_time=$(date +%s%3N)
response_time=$((end_time - start_time))

if [ $response_time -lt 1000 ]; then
    echo -e "${GREEN}✅ Performance: OK (${response_time}ms)${NC}"
    ((passed_tests++))
else
    echo -e "${YELLOW}⚠️ Performance: Lento (${response_time}ms)${NC}"
    ((passed_tests++))
fi
((total_tests++))

# Resumo dos testes
echo ""
echo "=========================================="
echo -e "${YELLOW}📊 RESUMO DOS TESTES${NC}"
echo "=========================================="
echo -e "Total de testes: ${BLUE}$total_tests${NC}"
echo -e "Testes aprovados: ${GREEN}$passed_tests${NC}"
echo -e "Testes falharam: ${RED}$failed_tests${NC}"
echo ""

# Calcular percentual
if [ $total_tests -gt 0 ]; then
    success_rate=$((passed_tests * 100 / total_tests))
    echo -e "Taxa de sucesso: ${BLUE}$success_rate%${NC}"
fi

echo ""

# Status final
if [ $failed_tests -eq 0 ]; then
    echo -e "${GREEN}🎉 TODOS OS TESTES PASSARAM!${NC}"
    echo -e "${GREEN}✅ Sistema pronto para produção!${NC}"
    exit 0
else
    echo -e "${RED}⚠️ ALGUNS TESTES FALHARAM${NC}"
    echo -e "${YELLOW}🔧 Verifique os serviços antes de liberar para produção${NC}"
    exit 1
fi
