#!/usr/bin/env bash
# Deploy Admin V19 - Vercel
# Uso: ./automation/deploy_admin.sh [stg|prod]

set -e

ENV=${1:-stg}
ENV_UPPER=$(echo "$ENV" | tr '[:lower:]' '[:upper:]')

echo "🚀 Iniciando deploy admin para ambiente: $ENV_UPPER"

# Validar variáveis de ambiente
if [ -z "$VERCEL_TOKEN" ]; then
  echo "❌ Erro: VERCEL_TOKEN não configurado"
  exit 1
fi

# Verificar se vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
  echo "❌ Erro: vercel CLI não encontrado. Instale: npm i -g vercel"
  exit 1
fi

# Determinar projeto
PROJECT_NAME="${VERCEL_PROJECT_ADMIN:-goldeouro-admin}"

echo "📦 Projeto: $PROJECT_NAME"

# Fazer deploy
if [ "$ENV" == "prod" ]; then
  echo "🔄 Executando deploy PRODUCTION..."
  vercel --prod --confirm --token "$VERCEL_TOKEN" --scope "$VERCEL_TEAM_ID"
else
  echo "🔄 Executando deploy STAGING..."
  vercel --token "$VERCEL_TOKEN" --scope "$VERCEL_TEAM_ID"
fi

if [ $? -eq 0 ]; then
  echo "✅ Deploy concluído com sucesso!"
else
  echo "❌ Deploy falhou!"
  exit 1
fi

