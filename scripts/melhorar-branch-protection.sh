#!/bin/bash
# 🔒 MELHORAR BRANCH PROTECTION - GOL DE OURO
# ============================================
# Data: 15/11/2025
# Status: Script para melhorar branch protection

echo "🔒 Melhorando Branch Protection..."

# Configurar required status checks e PR reviews
gh api repos/indesconectavel/gol-de-ouro/branches/main/protection \
  --method PATCH \
  --field required_status_checks[strict]=true \
  --field required_status_checks[contexts][]="CI" \
  --field required_status_checks[contexts][]="Testes Automatizados" \
  --field required_status_checks[contexts][]="Segurança e Qualidade" \
  --field enforce_admins=true \
  --field required_pull_request_reviews[required_approving_review_count]=1 \
  --field required_pull_request_reviews[dismiss_stale_reviews]=true \
  --field required_pull_request_reviews[require_code_owner_reviews]=false \
  --field restrictions=null \
  --field allow_force_pushes=false \
  --field allow_deletions=false \
  --field required_linear_history=false

echo "✅ Branch Protection melhorada!"

