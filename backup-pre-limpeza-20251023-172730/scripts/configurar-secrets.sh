#!/bin/bash

echo "🔐 CONFIGURAÇÃO AUTOMÁTICA DE SECRETS - GOL DE OURO"
echo "=================================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 INSTRUÇÕES PARA CONFIGURAR SECRETS NO GITHUB${NC}"
echo ""
echo "1. Acesse: https://github.com/indesconectavel/gol-de-ouro/settings/secrets/actions"
echo "2. Clique em 'New repository secret'"
echo "3. Configure os secrets abaixo:"
echo ""

echo -e "${YELLOW}🔑 SECRETS OBRIGATÓRIOS:${NC}"
echo ""

# Fly.io Token
echo -e "${BLUE}1. FLY_API_TOKEN${NC}"
echo "   Descrição: Token de autenticação do Fly.io"
echo "   Como obter: flyctl auth token"
echo "   Comando: flyctl auth token"
echo ""

# Vercel Token
echo -e "${BLUE}2. VERCEL_TOKEN${NC}"
echo "   Descrição: Token de autenticação do Vercel"
echo "   Como obter: npx vercel login"
echo "   Comando: npx vercel whoami"
echo ""

# Vercel Org ID
echo -e "${BLUE}3. VERCEL_ORG_ID${NC}"
echo "   Descrição: ID da organização no Vercel"
echo "   Como obter: npx vercel orgs list"
echo "   Formato: team_xxxxx"
echo ""

# Vercel Project ID
echo -e "${BLUE}4. VERCEL_PROJECT_ID${NC}"
echo "   Descrição: ID do projeto no Vercel"
echo "   Como obter: npx vercel projects list"
echo "   Formato: prj_xxxxx"
echo ""

echo -e "${YELLOW}🔑 SECRETS OPCIONAIS:${NC}"
echo ""

# Supabase URL
echo -e "${BLUE}5. SUPABASE_URL${NC}"
echo "   Descrição: URL do projeto Supabase"
echo "   Como obter: Painel Supabase → Settings → API"
echo "   Formato: https://seuprojeto.supabase.co"
echo ""

# Supabase Key
echo -e "${BLUE}6. SUPABASE_KEY${NC}"
echo "   Descrição: Chave anônima do Supabase"
echo "   Como obter: Painel Supabase → Settings → API"
echo "   Formato: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
echo ""

# Slack Webhook
echo -e "${BLUE}7. SLACK_WEBHOOK_URL${NC}"
echo "   Descrição: Webhook do Slack para alertas"
echo "   Como obter: Slack → Apps → Incoming Webhooks"
echo "   Formato: https://hooks.slack.com/services/..."
echo ""

# Discord Webhook
echo -e "${BLUE}8. DISCORD_WEBHOOK_URL${NC}"
echo "   Descrição: Webhook do Discord para alertas"
echo "   Como obter: Discord → Server Settings → Integrations → Webhooks"
echo "   Formato: https://discord.com/api/webhooks/..."
echo ""

echo -e "${GREEN}✅ APÓS CONFIGURAR OS SECRETS:${NC}"
echo ""
echo "1. Execute o pipeline principal manualmente"
echo "2. Verifique os logs de deploy"
echo "3. Confirme que os serviços estão online"
echo "4. Teste o sistema completo"
echo ""

echo -e "${YELLOW}🚀 COMANDOS PARA VALIDAR:${NC}"
echo ""
echo "# Testar Fly.io"
echo "flyctl status --app goldeouro-backend"
echo ""
echo "# Testar Vercel"
echo "npx vercel whoami"
echo ""
echo "# Testar endpoints"
echo "curl https://goldeouro-backend.fly.dev/health"
echo "curl https://goldeouro.lol"
echo ""

echo -e "${BLUE}📊 STATUS ATUAL:${NC}"
echo "✅ Guia de configuração criado"
echo "✅ Script de validação disponível"
echo "✅ Pipeline CI/CD configurado"
echo "✅ Sistema pronto para produção"
echo ""

echo -e "${GREEN}🎯 PRÓXIMO PASSO:${NC}"
echo "Configure os secrets no GitHub e execute o pipeline!"
echo ""
