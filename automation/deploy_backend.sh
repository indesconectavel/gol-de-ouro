#!/usr/bin/env bash
# Deploy Backend V19 - Fly.io
# Uso: ./automation/deploy_backend.sh [stg|prod]

set -e

ENV=${1:-stg}
ENV_UPPER=$(echo "$ENV" | tr '[:lower:]' '[:upper:]')

echo "🚀 Iniciando deploy backend para ambiente: $ENV_UPPER"

# Validar variáveis de ambiente
if [ -z "$FLY_API_TOKEN" ]; then
  echo "❌ Erro: FLY_API_TOKEN não configurado"
  exit 1
fi

# Determinar app name baseado no ambiente
if [ "$ENV" == "prod" ]; then
  APP_NAME="${FLY_APP_BACKEND:-goldeouro-backend}"
  CONFIG_FILE="fly.toml"
else
  APP_NAME="${FLY_APP_BACKEND_STAGING:-goldeouro-backend-staging}"
  CONFIG_FILE="fly.staging.toml"
fi

# Verificar se flyctl está instalado
if ! command -v flyctl &> /dev/null; then
  echo "❌ Erro: flyctl não encontrado. Instale: https://fly.io/docs/hands-on/install-flyctl/"
  exit 1
fi

# Verificar se arquivo de configuração existe
if [ ! -f "$CONFIG_FILE" ]; then
  echo "⚠️  Arquivo $CONFIG_FILE não encontrado, usando fly.toml padrão"
  CONFIG_FILE="fly.toml"
fi

echo "📦 App: $APP_NAME"
echo "📄 Config: $CONFIG_FILE"

# Fazer deploy
echo "🔄 Executando deploy..."
flyctl deploy \
  --app "$APP_NAME" \
  --config "$CONFIG_FILE" \
  --token "$FLY_API_TOKEN"

if [ $? -eq 0 ]; then
  echo "✅ Deploy concluído com sucesso!"
  
  # Verificar status
  echo "🔍 Verificando status do app..."
  flyctl status --app "$APP_NAME" --token "$FLY_API_TOKEN"
else
  echo "❌ Deploy falhou!"
  exit 1
fi

