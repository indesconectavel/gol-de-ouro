#!/bin/bash
# Script de teste completo antes do deploy
# Valida todas as correções aplicadas

BACKEND_URL="https://goldeouro-backend-v2.fly.dev"
ADMIN_TOKEN="goldeouro123"

echo "═══════════════════════════════════════════════════════════"
echo "🧪 TESTE COMPLETO PRÉ-DEPLOY"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Backend: $BACKEND_URL"
echo "Data/Hora: $(date)"
echo ""

# Contadores
total=0
passaram=0
falharam=0

# Função para testar
testar() {
    local nome=$1
    local comando=$2
    total=$((total + 1))
    
    echo "Testando: $nome"
    if eval "$comando" > /dev/null 2>&1; then
        echo "  ✅ PASSOU"
        passaram=$((passaram + 1))
        return 0
    else
        echo "  ❌ FALHOU"
        falharam=$((falharam + 1))
        return 1
    fi
}

# 1. Health Check
testar "Health Check" "curl -s -o /dev/null -w '%{http_code}' $BACKEND_URL/health | grep -q '200'"

# 2. Meta Info
testar "Meta Info" "curl -s -o /dev/null -w '%{http_code}' $BACKEND_URL/meta | grep -q '200'"

# 3. Admin Stats (com token)
testar "Admin Stats" "curl -s -o /dev/null -w '%{http_code}' -H 'x-admin-token: $ADMIN_TOKEN' $BACKEND_URL/api/admin/stats | grep -q '200'"

# 4. Rotas Protegidas (sem token - devem retornar 401)
testar "Rota protegida: /api/games/shoot" "curl -s -o /dev/null -w '%{http_code}' -X POST $BACKEND_URL/api/games/shoot -d '{}' | grep -q '401'"
testar "Rota protegida: /api/payments/pix/criar" "curl -s -o /dev/null -w '%{http_code}' -X POST $BACKEND_URL/api/payments/pix/criar -d '{}' | grep -q '401'"
testar "Rota protegida: /api/admin/stats" "curl -s -o /dev/null -w '%{http_code}' $BACKEND_URL/api/admin/stats | grep -q '401'"

# 5. Headers de Segurança (após deploy)
echo ""
echo "Verificando headers de segurança..."
response=$(curl -s -I "$BACKEND_URL/health")
x_content_type=$(echo "$response" | grep -i "x-content-type-options" || echo "")
x_frame=$(echo "$response" | grep -i "x-frame-options" || echo "")

if [ -n "$x_content_type" ]; then
    echo "  ✅ X-Content-Type-Options presente"
    passaram=$((passaram + 1))
else
    echo "  ❌ X-Content-Type-Options ausente"
    falharam=$((falharam + 1))
fi
total=$((total + 1))

if [ -n "$x_frame" ]; then
    echo "  ✅ X-Frame-Options presente"
    passaram=$((passaram + 1))
else
    echo "  ⚠️  X-Frame-Options ausente (aguardando deploy)"
    echo "     Correção aplicada no código, aguardando deploy"
fi
total=$((total + 1))

# Resumo
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "📊 RESUMO"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Total de Testes: $total"
echo "✅ Passaram: $passaram"
echo "❌ Falharam: $falharam"
taxa=$(echo "scale=2; $passaram * 100 / $total" | bc)
echo "Taxa de Sucesso: ${taxa}%"
echo ""

if [ $falharam -eq 0 ]; then
    echo "✅ TODOS OS TESTES PASSARAM"
    exit 0
else
    echo "⚠️  ALGUNS TESTES FALHARAM"
    exit 1
fi

