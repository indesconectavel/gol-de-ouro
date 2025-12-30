#!/bin/bash
# Script para executar próximos passos após autenticação do GitHub CLI

echo "🚀 Executando próximos passos após autenticação..."

# Verificar autenticação
echo ""
echo "🔍 Verificando autenticação..."
gh auth status

if [ $? -ne 0 ]; then
    echo "❌ GitHub CLI não está autenticado"
    echo "💡 Execute: gh auth login"
    exit 1
fi

echo ""
echo "✅ GitHub CLI autenticado!"

# Verificar PR #18
echo ""
echo "📋 Verificando PR #18..."
gh pr view 18 --json state,merged,mergeable,reviewDecision,statusCheckRollup,url

# Verificar status checks
echo ""
echo "🔍 Verificando status checks do PR #18..."
gh pr checks 18

# Mostrar informações do repositório
echo ""
echo "📊 Informações do repositório..."
gh repo view --json name,description,url

echo ""
echo "✅ Verificação concluída!"

