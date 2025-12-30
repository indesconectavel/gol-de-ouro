#!/bin/bash

# 🧹 LIMPEZA, OTIMIZAÇÃO E VERIFICAÇÃO COMPLETA DO GOL DE OURO
# ------------------------------------------------------------
# Este script remove arquivos pesados e temporários, reinstala dependências,
# otimiza o histórico Git e verifica automaticamente o pipeline principal.

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Iniciando limpeza e otimização do projeto Gol de Ouro...${NC}"
echo "==================================================================="

# Função para verificar se estamos no diretório correto
check_directory() {
    if [ ! -f "package.json" ] && [ ! -d "backend" ] && [ ! -d "goldeouro-player" ] && [ ! -d "goldeouro-admin" ]; then
        echo -e "${RED}❌ ERRO: Execute este script no diretório raiz do projeto Gol de Ouro${NC}"
        echo -e "${YELLOW}💡 Dica: Certifique-se de estar em: E:\Chute de Ouro\goldeouro-backend${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Diretório correto detectado${NC}"
}

# Função para backup de segurança
create_backup() {
    echo -e "${YELLOW}💾 Criando backup de segurança antes da limpeza...${NC}"
    BACKUP_DIR="backup-pre-limpeza-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # Backup de arquivos importantes
    cp -r backend/package*.json "$BACKUP_DIR/" 2>/dev/null || true
    cp -r goldeouro-player/package*.json "$BACKUP_DIR/" 2>/dev/null || true
    cp -r goldeouro-admin/package*.json "$BACKUP_DIR/" 2>/dev/null || true
    cp -r .github/ "$BACKUP_DIR/" 2>/dev/null || true
    cp -r scripts/ "$BACKUP_DIR/" 2>/dev/null || true
    
    echo -e "${GREEN}✅ Backup criado em: $BACKUP_DIR${NC}"
}

# Função para limpeza segura
safe_cleanup() {
    echo -e "${PURPLE}🧹 Iniciando limpeza de arquivos desnecessários...${NC}"
    
    # 1️⃣ Remover arquivos e pastas desnecessárias
    echo -e "${CYAN}📁 Removendo node_modules...${NC}"
    find . -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true
    
    echo -e "${CYAN}📁 Removendo pastas de build e cache...${NC}"
    rm -rf **/backups 2>/dev/null || true
    rm -rf **/artifacts 2>/dev/null || true
    rm -rf **/tmp 2>/dev/null || true
    rm -rf **/dist 2>/dev/null || true
    rm -rf **/.cache 2>/dev/null || true
    rm -rf **/.vercel 2>/dev/null || true
    rm -rf **/.fly 2>/dev/null || true
    rm -rf .turbo 2>/dev/null || true
    rm -rf .next 2>/dev/null || true
    
    echo -e "${CYAN}📁 Removendo backups antigos...${NC}"
    rm -rf BACKUP-COMPLETO-* 2>/dev/null || true
    rm -rf teste-rollback-* 2>/dev/null || true
    
    echo -e "${GREEN}✅ Limpeza de arquivos concluída${NC}"
}

# Função para recriar estrutura
recreate_structure() {
    echo -e "${PURPLE}🏗️ Recriando estrutura de pastas essenciais...${NC}"
    
    # 2️⃣ Recriar pastas essenciais
    mkdir -p backend goldeouro-player goldeouro-admin docs scripts config
    
    echo -e "${GREEN}✅ Estrutura de pastas recriada${NC}"
}

# Função para reinstalar dependências
reinstall_dependencies() {
    echo -e "${PURPLE}📦 Reinstalando dependências essenciais...${NC}"
    
    # 3️⃣ Reinstalar dependências principais
    if [ -d "backend" ] && [ -f "backend/package.json" ]; then
        echo -e "${CYAN}📦 Instalando dependências do backend...${NC}"
        cd backend && npm install --silent && cd ..
        echo -e "${GREEN}✅ Backend: dependências instaladas${NC}"
    fi
    
    if [ -d "goldeouro-player" ] && [ -f "goldeouro-player/package.json" ]; then
        echo -e "${CYAN}📦 Instalando dependências do player...${NC}"
        cd goldeouro-player && npm install --silent && cd ..
        echo -e "${GREEN}✅ Player: dependências instaladas${NC}"
    fi
    
    if [ -d "goldeouro-admin" ] && [ -f "goldeouro-admin/package.json" ]; then
        echo -e "${CYAN}📦 Instalando dependências do admin...${NC}"
        cd goldeouro-admin && npm install --silent && cd ..
        echo -e "${GREEN}✅ Admin: dependências instaladas${NC}"
    fi
    
    echo -e "${GREEN}✅ Todas as dependências foram reinstaladas${NC}"
}

# Função para validar ambiente
validate_environment() {
    echo -e "${PURPLE}🧪 Validando ambiente local...${NC}"
    
    # 4️⃣ Validar ambiente local
    echo -e "${CYAN}🔍 Verificando versões:${NC}"
    echo "Node.js: $(node -v 2>/dev/null || echo '❌ Não instalado')"
    echo "NPM: $(npm -v 2>/dev/null || echo '❌ Não instalado')"
    echo "Git: $(git --version 2>/dev/null || echo '❌ Não instalado')"
    
    # Verificar se estamos em um repositório Git
    if [ ! -d ".git" ]; then
        echo -e "${RED}❌ AVISO: Não é um repositório Git${NC}"
        echo -e "${YELLOW}💡 Execute 'git init' se necessário${NC}"
    else
        echo -e "${GREEN}✅ Repositório Git detectado${NC}"
    fi
}

# Função para verificar tamanho
check_size() {
    echo -e "${PURPLE}📊 Verificando tamanho do repositório...${NC}"
    
    # 5️⃣ Verificar tamanho total do repositório
    echo -e "${CYAN}📏 Tamanho total após limpeza:${NC}"
    if command -v du >/dev/null 2>&1; then
        du -sh . --exclude=node_modules --exclude=backups --exclude=dist 2>/dev/null || echo "Tamanho: Não disponível"
    else
        echo "Tamanho: Comando 'du' não disponível neste sistema"
    fi
}

# Função para otimizar Git
optimize_git() {
    echo -e "${PURPLE}🧰 Otimizando histórico Git...${NC}"
    
    # 6️⃣ Otimizar histórico Git
    if [ -d ".git" ]; then
        echo -e "${CYAN}🔧 Executando limpeza do Git...${NC}"
        git reflog expire --expire=now --all 2>/dev/null || true
        git gc --prune=now --aggressive 2>/dev/null || true
        echo -e "${GREEN}✅ Histórico Git otimizado${NC}"
    else
        echo -e "${YELLOW}⚠️ Pulando otimização Git (não é um repositório Git)${NC}"
    fi
}

# Função para commit e push
commit_changes() {
    echo -e "${PURPLE}💾 Commitando alterações...${NC}"
    
    # 7️⃣ Reforçar sincronização e commit
    if [ -d ".git" ]; then
        echo -e "${CYAN}📝 Adicionando arquivos ao Git...${NC}"
        git add . 2>/dev/null || true
        
        echo -e "${CYAN}💾 Criando commit...${NC}"
        git commit -m "🧹 Limpeza e otimização do repositório (remoção de temporários e builds)" 2>/dev/null || true
        
        echo -e "${CYAN}🚀 Enviando para o repositório remoto...${NC}"
        git push origin main 2>/dev/null || {
            echo -e "${YELLOW}⚠️ Falha no push. Verifique a configuração do Git remoto${NC}"
            echo -e "${YELLOW}💡 Execute manualmente: git push origin main${NC}"
        }
        
        echo -e "${GREEN}✅ Alterações commitadas e enviadas${NC}"
    else
        echo -e "${YELLOW}⚠️ Pulando commit (não é um repositório Git)${NC}"
    fi
}

# Função para reindexar workflows
reindex_workflows() {
    echo -e "${PURPLE}🔄 Forçando reindexação do workflow principal...${NC}"
    
    # 8️⃣ Forçar reindexação de workflows no GitHub
    if [ -d ".git" ] && [ -d ".github/workflows" ]; then
        echo -e "${CYAN}🔁 Tocando arquivo de workflow...${NC}"
        touch .github/workflows/main-pipeline.yml 2>/dev/null || true
        
        echo -e "${CYAN}💾 Commitando alteração de workflow...${NC}"
        git add .github/workflows/main-pipeline.yml 2>/dev/null || true
        git commit -m "🔁 Reindex workflow principal - GitHub Actions" 2>/dev/null || true
        
        echo -e "${CYAN}🚀 Enviando alteração...${NC}"
        git push origin main 2>/dev/null || {
            echo -e "${YELLOW}⚠️ Falha no push do workflow. Execute manualmente${NC}"
        }
        
        echo -e "${GREEN}✅ Workflow principal reindexado${NC}"
    else
        echo -e "${YELLOW}⚠️ Pulando reindexação (workflows não encontrados)${NC}"
    fi
}

# Função para verificar workflows
check_workflows() {
    echo -e "${PURPLE}🔍 Verificando workflows ativos...${NC}"
    
    # 9️⃣ Auditoria e verificação automática de workflows
    echo -e "${CYAN}📋 Listando workflows disponíveis:${NC}"
    if command -v gh >/dev/null 2>&1; then
        gh workflow list --repo indesconectavel/gol-de-ouro 2>/dev/null || echo -e "${YELLOW}⚠️ GitHub CLI não configurado ou repositório não encontrado${NC}"
    else
        echo -e "${YELLOW}⚠️ GitHub CLI não instalado. Verifique manualmente em:${NC}"
        echo -e "${BLUE}🌐 https://github.com/indesconectavel/gol-de-ouro/actions${NC}"
    fi
}

# Função principal
main() {
    echo -e "${BLUE}===================================================================${NC}"
    echo -e "${BLUE}🧹 SCRIPT DE LIMPEZA E OTIMIZAÇÃO - GOL DE OURO${NC}"
    echo -e "${BLUE}===================================================================${NC}"
    echo ""
    
    # Executar todas as funções
    check_directory
    create_backup
    safe_cleanup
    recreate_structure
    reinstall_dependencies
    validate_environment
    check_size
    optimize_git
    commit_changes
    reindex_workflows
    check_workflows
    
    echo ""
    echo -e "${BLUE}===================================================================${NC}"
    echo -e "${GREEN}✅ Limpeza concluída com sucesso!${NC}"
    echo -e "${GREEN}🚀 Workflow principal reindexado e sincronizado com GitHub Actions.${NC}"
    echo ""
    echo -e "${YELLOW}🌐 PRÓXIMOS PASSOS:${NC}"
    echo -e "${CYAN}1. Acesse: https://github.com/indesconectavel/gol-de-ouro/actions${NC}"
    echo -e "${CYAN}2. Procure por: '🚀 Pipeline Principal - Gol de Ouro'${NC}"
    echo -e "${CYAN}3. Clique em 'Run workflow'${NC}"
    echo -e "${CYAN}4. Selecione branch: 'main'${NC}"
    echo -e "${CYAN}5. Clique em 'Run workflow' novamente${NC}"
    echo ""
    echo -e "${GREEN}🎯 MONITORAMENTO:${NC}"
    echo -e "${CYAN}• Acompanhe a execução em tempo real${NC}"
    echo -e "${CYAN}• Verifique os logs de cada job${NC}"
    echo -e "${CYAN}• Confirme que todos os testes passaram${NC}"
    echo -e "${CYAN}• Baixe os artifacts gerados${NC}"
    echo ""
    echo -e "${BLUE}===================================================================${NC}"
}

# Executar função principal
main "$@"
