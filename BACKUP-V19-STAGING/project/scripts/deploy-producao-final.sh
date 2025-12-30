#!/bin/bash
# 🚀 DEPLOY PARA PRODUÇÃO - GOL DE OURO
# Deploy completo após auditoria Go-Live

set -e

echo "🚀 === DEPLOY PARA PRODUÇÃO - GOL DE OURO ==="
echo "📅 Data: $(date)"
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# URLs de Produção
BACKEND_URL="https://goldeouro-backend-v2.fly.dev"
PLAYER_URL="https://goldeouro.lol"
ADMIN_URL="https://admin.goldeouro.lol"

echo "📋 URLs de Produção:"
echo "  Backend: $BACKEND_URL"
echo "  Player: $PLAYER_URL"
echo "  Admin: $ADMIN_URL"
echo ""

# 1. Verificar Health Check atual
echo "🔍 Verificando Health Check atual..."
if curl -f --max-time 10 "$BACKEND_URL/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend está online${NC}"
else
    echo -e "${YELLOW}⚠️ Backend pode estar offline ou com problemas${NC}"
fi
echo ""

# 2. Deploy Backend (Fly.io)
echo "🚀 === DEPLOY BACKEND (Fly.io) ==="
echo "App: goldeouro-backend-v2"
echo ""

if command -v flyctl &> /dev/null; then
    echo "Executando deploy do backend..."
    flyctl deploy --app goldeouro-backend-v2 --remote-only
    echo -e "${GREEN}✅ Deploy do backend concluído${NC}"
else
    echo -e "${YELLOW}⚠️ flyctl não encontrado. Use: flyctl deploy --app goldeouro-backend-v2${NC}"
fi
echo ""

# 3. Aguardar deploy estabilizar
echo "⏳ Aguardando deploy estabilizar (30s)..."
sleep 30

# 4. Verificar Health Check após deploy
echo "🔍 Verificando Health Check após deploy..."
SUCCESS=0
for i in {1..6}; do
    echo "Tentativa $i de 6..."
    if curl -f --max-time 30 "$BACKEND_URL/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Health Check OK na tentativa $i${NC}"
        SUCCESS=1
        break
    fi
    if [ $i -lt 6 ]; then
        echo "⏳ Aguardando 10s..."
        sleep 10
    fi
done

if [ "$SUCCESS" = "0" ]; then
    echo -e "${RED}❌ Health Check falhou após 6 tentativas${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 === DEPLOY CONCLUÍDO COM SUCESSO ===${NC}"
echo "✅ Backend: $BACKEND_URL"
echo "✅ Player: $PLAYER_URL"
echo "✅ Admin: $ADMIN_URL"
echo ""
echo "📊 Próximos passos:"
echo "  1. Validar endpoints críticos"
echo "  2. Testar fluxo completo do jogo"
echo "  3. Monitorar logs por 7 dias"
echo ""

