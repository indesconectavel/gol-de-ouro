#!/bin/bash

# Script de Deploy e Validação - Gol de Ouro
# Execução: bash scripts/deploy-e-validar.sh

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║   DEPLOY E VALIDAÇÃO - GOL DE OURO                          ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

BACKEND_URL="https://goldeouro-backend-v2.fly.dev"

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${GREEN}✅ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 1. Verificar se está no diretório correto
if [ ! -f "server-fly.js" ]; then
    error "Execute este script do diretório raiz do projeto"
    exit 1
fi

log "Diretório correto detectado"

# 2. Verificar status do git
echo ""
echo "📋 Verificando alterações no Git..."
git status --short

# 3. Perguntar se deseja fazer commit
echo ""
read -p "Deseja fazer commit das alterações? (s/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    git add middlewares/authMiddleware.js src/websocket.js controllers/paymentController.js controllers/adminController.js server-fly.js
    git commit -m "fix: Correções críticas pós-auditoria Agent Browser"
    log "Alterações commitadas"
else
    warning "Pulando commit"
fi

# 4. Deploy no Fly.io
echo ""
echo "🚀 Fazendo deploy no Fly.io..."
read -p "Deseja fazer deploy agora? (s/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    flyctl deploy --app goldeouro-backend-v2
    log "Deploy concluído"
else
    warning "Pulando deploy"
fi

# 5. Aguardar servidor iniciar
echo ""
echo "⏳ Aguardando servidor iniciar..."
sleep 10

# 6. Validar health check
echo ""
echo "🏥 Validando health check..."
HEALTH_RESPONSE=$(curl -s "${BACKEND_URL}/health" || echo "ERROR")

if echo "$HEALTH_RESPONSE" | grep -q "success"; then
    log "Health check OK"
else
    error "Health check falhou"
    echo "Resposta: $HEALTH_RESPONSE"
    exit 1
fi

# 7. Executar script de validação
echo ""
echo "🧪 Executando validação..."
node scripts/validacao-go-live.js

# 8. Resumo final
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║   DEPLOY E VALIDAÇÃO CONCLUÍDOS                             ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
log "Próximos passos:"
echo "  1. Executar testes manuais em produção"
echo "  2. Validar PIX com Mercado Pago real"
echo "  3. Validar WebSocket com usuário real"
echo "  4. Validar Admin chutes"
echo ""
echo "📄 Documentação: docs/PROXIMOS-PASSOS-GO-LIVE.md"
echo ""

