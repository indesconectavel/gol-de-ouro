#!/bin/bash
# 📊 MONITORAR WORKFLOWS - GOL DE OURO
# ====================================
# Data: 15/11/2025
# Status: Script para monitorar workflows regularmente

echo "📊 Monitorando Workflows..."

# Verificar últimos 10 runs
echo "=== ÚLTIMOS 10 WORKFLOW RUNS ==="
gh run list --limit 10 --json conclusion,status,name,createdAt,workflowName | \
  jq -r '.[] | "\(.workflowName) - \(.name) - \(.conclusion) - \(.status) - \(.createdAt)"'

# Contar falhas
FAILURES=$(gh run list --limit 50 --json conclusion | jq '[.[] | select(.conclusion == "failure")] | length')
echo ""
echo "⚠️ Falhas nos últimos 50 runs: $FAILURES"

# Verificar workflows ativos
echo ""
echo "=== WORKFLOWS ATIVOS ==="
gh workflow list --json name,state | jq -r '.[] | "\(.name) - \(.state)"'

# Verificar PRs com workflows pendentes
echo ""
echo "=== PRs COM WORKFLOWS PENDENTES ==="
gh pr list --state open --json number,title,headRefName | \
  jq -r '.[] | "PR #\(.number): \(.title) (\(.headRefName))"'

echo ""
echo "✅ Monitoramento concluído!"

