#!/bin/bash

# Script para executar validações pós-deploy
# Uso: bash scripts/executar-validacoes.sh

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "🚀 EXECUTANDO VALIDAÇÕES PÓS-DEPLOY"
echo "═══════════════════════════════════════════════════════════"
echo ""

BACKEND_URL="${BACKEND_URL:-https://goldeouro-backend-v2.fly.dev}"

# 1. Health Check
echo "1️⃣  Verificando health do backend..."
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "${BACKEND_URL}/health")
if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo "   ✅ Backend está online"
else
    echo "   ⚠️  Backend retornou código: $HEALTH_RESPONSE"
fi
echo ""

# 2. Verificar X-Frame-Options
echo "2️⃣  Verificando headers de segurança..."
HEADERS=$(curl -s -I "${BACKEND_URL}/health")
if echo "$HEADERS" | grep -q "X-Frame-Options: DENY"; then
    echo "   ✅ X-Frame-Options: DENY (presente)"
else
    echo "   ⚠️  X-Frame-Options não encontrado"
fi

if echo "$HEADERS" | grep -q "X-Content-Type-Options: nosniff"; then
    echo "   ✅ X-Content-Type-Options: nosniff (presente)"
else
    echo "   ⚠️  X-Content-Type-Options não encontrado"
fi
echo ""

# 3. Verificar meta info
echo "3️⃣  Verificando meta info..."
META_RESPONSE=$(curl -s "${BACKEND_URL}/meta")
if echo "$META_RESPONSE" | grep -q "version"; then
    echo "   ✅ Meta info disponível"
    echo "$META_RESPONSE" | jq '.' 2>/dev/null || echo "$META_RESPONSE"
else
    echo "   ⚠️  Meta info não disponível"
fi
echo ""

echo "═══════════════════════════════════════════════════════════"
echo "✅ VALIDAÇÕES CONCLUÍDAS"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📋 PRÓXIMOS PASSOS MANUAIS:"
echo ""
echo "1. Verificar Security Advisor no Supabase"
echo "2. Executar scripts/validar-pagamentos-expired.sql"
echo "3. Executar node scripts/testar-criar-pix.js [email] [senha] [valor]"
echo ""

