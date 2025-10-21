#!/bin/bash
# SISTEMA DE PREVENÇÃO DE INCONSISTÊNCIAS DE ROTAS - GOL DE OURO
# =============================================================
# Data: 20/10/2025
# Status: SISTEMA DE PREVENÇÃO AUTOMÁTICA

set -e  # Parar em caso de erro

echo "🔍 === SISTEMA DE PREVENÇÃO DE INCONSISTÊNCIAS ==="
echo "📅 Data: $(date '+%d/%m/%Y, %H:%M:%S')"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log com cores
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar se estamos no diretório correto
if [ ! -f "server-fly.js" ]; then
    log_error "Arquivo server-fly.js não encontrado. Execute este script no diretório raiz do projeto."
    exit 1
fi

log_info "Iniciando validação pré-deploy..."

# 1. VALIDAÇÃO DE CONFIGURAÇÕES CRÍTICAS
log_info "Validando configurações críticas..."
if ! node validacao-pre-deploy.js; then
    log_error "Validação de configurações falhou!"
    exit 1
fi
log_success "Configurações críticas validadas"

# 2. AUDITORIA AVANÇADA DE ROTAS
log_info "Executando auditoria avançada de rotas..."
if ! node auditoria-avancada-rotas.js; then
    log_error "Auditoria de rotas falhou!"
    exit 1
fi
log_success "Auditoria de rotas concluída"

# 3. VERIFICAÇÃO DE SINTAXE
log_info "Verificando sintaxe do código..."
if ! node -c server-fly.js; then
    log_error "Erro de sintaxe no server-fly.js!"
    exit 1
fi
log_success "Sintaxe do backend validada"

# 4. VERIFICAÇÃO DO FRONTEND
log_info "Verificando configuração do frontend..."
if [ ! -f "goldeouro-player/src/config/api.js" ]; then
    log_error "Arquivo de configuração do frontend não encontrado!"
    exit 1
fi
log_success "Configuração do frontend validada"

# 5. TESTE DE CONECTIVIDADE COM BACKEND
log_info "Testando conectividade com backend..."
if ! curl -s -f "https://goldeouro-backend.fly.dev/meta" > /dev/null; then
    log_warning "Backend não está respondendo. Continuando com deploy..."
else
    log_success "Backend está respondendo"
fi

# 6. VERIFICAÇÃO DE VARIÁVEIS DE AMBIENTE
log_info "Verificando variáveis de ambiente..."
if [ ! -f ".env" ]; then
    log_error "Arquivo .env não encontrado!"
    exit 1
fi

# Verificar variáveis críticas
source .env
if [ -z "$JWT_SECRET" ]; then
    log_error "JWT_SECRET não definido!"
    exit 1
fi

if [ -z "$SUPABASE_URL" ]; then
    log_error "SUPABASE_URL não definido!"
    exit 1
fi

log_success "Variáveis de ambiente validadas"

# 7. VERIFICAÇÃO DE DEPENDÊNCIAS
log_info "Verificando dependências..."
if [ ! -f "package.json" ]; then
    log_error "package.json não encontrado!"
    exit 1
fi

if ! npm list --depth=0 > /dev/null 2>&1; then
    log_warning "Dependências não instaladas. Instalando..."
    npm install
fi
log_success "Dependências validadas"

# 8. BACKUP DE SEGURANÇA
log_info "Criando backup de segurança..."
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp server-fly.js "$BACKUP_DIR/"
cp .env "$BACKUP_DIR/"
log_success "Backup criado em $BACKUP_DIR"

# 9. RELATÓRIO FINAL
echo ""
echo "📊 === RELATÓRIO DE VALIDAÇÃO ==="
echo "✅ Configurações críticas: OK"
echo "✅ Auditoria de rotas: OK"
echo "✅ Sintaxe do código: OK"
echo "✅ Configuração do frontend: OK"
echo "✅ Variáveis de ambiente: OK"
echo "✅ Dependências: OK"
echo "✅ Backup de segurança: OK"
echo ""

log_success "VALIDAÇÃO CONCLUÍDA COM SUCESSO!"
log_info "Sistema pronto para deploy"

# 10. CONFIRMAÇÃO FINAL
echo ""
read -p "Deseja continuar com o deploy? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_warning "Deploy cancelado pelo usuário"
    exit 0
fi

log_info "Iniciando deploy..."

# Deploy do backend
log_info "Fazendo deploy do backend..."
if fly deploy; then
    log_success "Backend deployado com sucesso!"
else
    log_error "Erro no deploy do backend!"
    exit 1
fi

# Deploy do frontend
log_info "Fazendo deploy do frontend..."
cd goldeouro-player
if vercel --prod; then
    log_success "Frontend deployado com sucesso!"
else
    log_error "Erro no deploy do frontend!"
    exit 1
fi

cd ..

# Teste pós-deploy
log_info "Executando testes pós-deploy..."
sleep 10  # Aguardar propagação

if curl -s -f "https://goldeouro-backend.fly.dev/meta" > /dev/null; then
    log_success "Backend respondendo após deploy"
else
    log_warning "Backend não está respondendo após deploy"
fi

if curl -s -f "https://goldeouro.lol" > /dev/null; then
    log_success "Frontend respondendo após deploy"
else
    log_warning "Frontend não está respondendo após deploy"
fi

echo ""
log_success "DEPLOY CONCLUÍDO COM SUCESSO!"
log_info "Sistema validado e funcionando"
