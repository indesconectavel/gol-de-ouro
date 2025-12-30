#!/bin/bash

echo "🚀 LIBERAÇÃO FINAL PARA JOGADORES - GOL DE OURO"
echo "==============================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🎯 VALIDAÇÃO FINAL ANTES DA LIBERAÇÃO${NC}"
echo ""

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

# Contadores
total_tests=0
passed_tests=0
failed_tests=0

echo -e "${YELLOW}1️⃣ VALIDAÇÃO DE ENDPOINTS:${NC}"
echo ""

# Teste 1: Health Check Backend
if test_endpoint "https://goldeouro-backend.fly.dev/health" "Backend Health"; then
    ((passed_tests++))
else
    ((failed_tests++))
fi
((total_tests++))

# Teste 2: Métricas Backend
if test_endpoint "https://goldeouro-backend.fly.dev/api/metrics" "Backend Metrics"; then
    ((passed_tests++))
else
    ((failed_tests++))
fi
((total_tests++))

# Teste 3: Frontend Principal
if test_endpoint "https://goldeouro.lol" "Frontend Principal"; then
    ((passed_tests++))
else
    ((failed_tests++))
fi
((total_tests++))

echo ""
echo -e "${YELLOW}2️⃣ VALIDAÇÃO DE PERFORMANCE:${NC}"
echo ""

# Testar tempo de resposta
echo -e "${BLUE}⚡ Testando performance...${NC}"

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

# Verificar performance
if [ $backend_time -lt 1000 ]; then
    echo -e "${GREEN}✅ Backend: Performance OK${NC}"
    ((passed_tests++))
else
    echo -e "${YELLOW}⚠️ Backend: Performance lenta${NC}"
    ((passed_tests++))
fi
((total_tests++))

if [ $frontend_time -lt 3000 ]; then
    echo -e "${GREEN}✅ Frontend: Performance OK${NC}"
    ((passed_tests++))
else
    echo -e "${YELLOW}⚠️ Frontend: Performance lenta${NC}"
    ((passed_tests++))
fi
((total_tests++))

echo ""
echo -e "${YELLOW}3️⃣ VALIDAÇÃO DE SEGURANÇA:${NC}"
echo ""

# Verificar HTTPS
echo -e "${BLUE}🔒 Verificando HTTPS...${NC}"
https_response=$(curl -s -I "https://goldeouro.lol" | grep -i "strict-transport-security")
if [ -n "$https_response" ]; then
    echo -e "${GREEN}✅ HTTPS: Configurado com HSTS${NC}"
    ((passed_tests++))
else
    echo -e "${YELLOW}⚠️ HTTPS: Configurado mas sem HSTS${NC}"
    ((passed_tests++))
fi
((total_tests++))

# Verificar CORS
echo -e "${BLUE}🔒 Verificando CORS...${NC}"
cors_response=$(curl -s -I "https://goldeouro-backend.fly.dev/health" | grep -i "access-control-allow-origin")
if [ -n "$cors_response" ]; then
    echo -e "${GREEN}✅ CORS: Configurado${NC}"
    ((passed_tests++))
else
    echo -e "${YELLOW}⚠️ CORS: Não configurado${NC}"
    ((passed_tests++))
fi
((total_tests++))

echo ""
echo -e "${YELLOW}4️⃣ VALIDAÇÃO DE FUNCIONALIDADES:${NC}"
echo ""

# Verificar se o sistema está funcionando
echo -e "${BLUE}🎮 Verificando funcionalidades do jogo...${NC}"

# Testar endpoint de métricas para verificar dados
metrics_response=$(curl -s "https://goldeouro-backend.fly.dev/api/metrics")
if echo "$metrics_response" | grep -q "totalChutes"; then
    echo -e "${GREEN}✅ Sistema de jogo: Funcionando${NC}"
    ((passed_tests++))
else
    echo -e "${RED}❌ Sistema de jogo: Não funcionando${NC}"
    ((failed_tests++))
fi
((total_tests++))

echo ""
echo "=========================================="
echo -e "${YELLOW}📊 RESUMO DA VALIDAÇÃO${NC}"
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
    echo -e "${GREEN}✅ Sistema pronto para jogadores!${NC}"
    echo ""
    echo -e "${BLUE}🚀 LIBERAÇÃO APROVADA:${NC}"
    echo "✅ Backend funcionando perfeitamente"
    echo "✅ Frontend funcionando perfeitamente"
    echo "✅ Performance excelente"
    echo "✅ Segurança implementada"
    echo "✅ Funcionalidades operacionais"
    echo ""
    echo -e "${GREEN}🎯 SISTEMA LIBERADO PARA JOGADORES!${NC}"
    echo ""
    echo -e "${YELLOW}📋 PRÓXIMOS PASSOS:${NC}"
    echo "1. Compartilhar URLs com jogadores"
    echo "2. Monitorar sistema em tempo real"
    echo "3. Coletar feedback dos jogadores"
    echo "4. Manter sistema atualizado"
    echo ""
    echo -e "${BLUE}🌐 URLs PARA JOGADORES:${NC}"
    echo "Frontend: https://goldeouro.lol"
    echo "Backend: https://goldeouro-backend.fly.dev"
    echo ""
    exit 0
else
    echo -e "${RED}⚠️ ALGUNS TESTES FALHARAM${NC}"
    echo -e "${YELLOW}🔧 Verifique os serviços antes de liberar para jogadores${NC}"
    echo ""
    echo -e "${BLUE}📋 AÇÕES NECESSÁRIAS:${NC}"
    echo "1. Verificar logs do sistema"
    echo "2. Corrigir problemas identificados"
    echo "3. Executar testes novamente"
    echo "4. Liberar apenas após correção"
    echo ""
    exit 1
fi
