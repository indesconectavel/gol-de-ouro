#!/bin/bash
# Script para validar X-Frame-Options após deploy

BACKEND_URL="https://goldeouro-backend-v2.fly.dev"

echo "═══════════════════════════════════════════════════════════"
echo "🔍 VALIDAÇÃO: X-Frame-Options"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Verificando headers do backend..."
echo ""

response=$(curl -s -I "$BACKEND_URL/health")
x_frame=$(echo "$response" | grep -i "x-frame-options" || echo "")

if [ -z "$x_frame" ]; then
    echo "❌ X-Frame-Options não encontrado"
    echo "   Aguardar deploy ou verificar configuração"
else
    echo "✅ X-Frame-Options encontrado:"
    echo "   $x_frame"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"

