#!/bin/bash
echo "🧹 LIMPEZA COMPLETA DO HISTÓRICO GIT - GOL DE OURO"
echo "=================================================="

# Backup do estado atual
echo "💾 Criando backup do estado atual..."
git bundle create backup-before-cleanup.bundle --all

# Remover arquivos grandes do histórico
echo "🗑️ Removendo arquivos grandes do histórico..."

# Remover arquivos .bundle do histórico
git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch goldeouro-backend/artifacts/backup-backend-r0-20250923-1605.bundle' --prune-empty --tag-name-filter cat -- --all
git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch goldeouro-player/backup-modo-jogador-2025-09-22-1200.bundle' --prune-empty --tag-name-filter cat -- --all
git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch goldeouro-player/artifacts/backup-player-r0-20250923-1605.bundle' --prune-empty --tag-name-filter cat -- --all
git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch goldeouro-admin/artifacts/backup-admin-r0-20250923-1605.bundle' --prune-empty --tag-name-filter cat -- --all
git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch goldeouro-admin/artifacts/PRE-CLEAN-BACKUP.bundle' --prune-empty --tag-name-filter cat -- --all

# Limpar referências
echo "🧽 Limpando referências..."
git for-each-ref --format="delete %(refname)" refs/original | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Verificar tamanho final
echo "📊 Verificando tamanho final..."
git count-objects -vH

echo "✅ Limpeza do histórico concluída!"
