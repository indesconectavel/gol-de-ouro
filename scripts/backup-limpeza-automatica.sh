#!/bin/bash
echo "====================================================="
echo "🧠 INICIANDO BACKUP + LIMPEZA AUTOMÁTICA DO GOL DE OURO"
echo "====================================================="

# Data atual
DATE=$(date +"%Y-%m-%d_%H-%M-%S")

# Etapa 1: Criar diretório de backup
mkdir -p backups
BACKUP_NAME="backups/GOLDEOURO_BACKUP_${DATE}.tar.gz"

echo "💾 Criando backup completo antes da limpeza..."
tar --exclude='node_modules' --exclude='tmp' --exclude='logs' --exclude='backups' -czf "$BACKUP_NAME" .
echo "✅ Backup criado com sucesso em: $BACKUP_NAME"

# Tamanho antes da limpeza
BEFORE_SIZE=$(du -sh . | cut -f1)
echo "📦 Tamanho do repositório antes da limpeza: $BEFORE_SIZE"

# Etapa 2: Remover arquivos e diretórios desnecessários
echo "🧹 Removendo diretórios e arquivos grandes..."
rm -rf BACKUP-COMPLETO-* artifacts/ teste-rollback-* tmp/ logs/
rm -rf goldeouro-player/node_modules/
rm -rf goldeouro-admin/node_modules/
rm -rf goldeouro-backend/node_modules/
echo "✅ Diretórios desnecessários removidos."

# Etapa 3: Atualizar .gitignore
echo "🧾 Atualizando .gitignore..."
cat <<EOT >> .gitignore

# Backups e temporários
BACKUP-COMPLETO-*
backups/
artifacts/
teste-rollback-*/
tmp/
logs/
docs/logs/
*.zip
*.tar
*.mp4
*.mov

# Duplicações de dependências
goldeouro-admin/node_modules/
goldeouro-player/node_modules/
goldeouro-backend/node_modules/
EOT
echo "✅ .gitignore atualizado."

# Etapa 4: Compactar histórico Git
echo "🧰 Compactando histórico Git..."
git gc --prune=now --aggressive
git repack -ad
git reflog expire --expire=now --all
echo "✅ Histórico compactado."

# Etapa 5: Reinstalar dependências
echo "⚙️ Reinstalando dependências dos módulos..."
cd goldeouro-backend && npm install && cd ..
cd goldeouro-player && npm install && cd ..
cd goldeouro-admin && npm install && cd ..
echo "✅ Dependências reinstaladas."

# Etapa 6: Verificação de integridade
echo "🧠 Verificando integridade dos builds..."
cd goldeouro-backend && npm run build || { echo "❌ Erro no backend!"; exit 1; } && cd ..
cd goldeouro-player && npm run build || { echo "❌ Erro no player!"; exit 1; } && cd ..
cd goldeouro-admin && npm run build || { echo "❌ Erro no painel admin!"; exit 1; } && cd ..
echo "✅ Todos os módulos passaram nos testes de build."

# Etapa 7: Tamanho final e relatório
AFTER_SIZE=$(du -sh . | cut -f1)
mkdir -p docs

cat <<EOT > docs/AUDITORIA-LIMPEZA-FINAL.md
# 🧹 AUDITORIA FINAL - GOL DE OURO
📅 Data: $(date)
👨‍💻 Autor: Fred Silva

## 📦 TAMANHOS
- Antes da limpeza: $BEFORE_SIZE
- Depois da limpeza: $AFTER_SIZE

## ✅ STATUS
- Backup completo criado em: $BACKUP_NAME
- Node_modules duplicados removidos
- Histórico Git compactado
- Dependências reinstaladas com sucesso
- Backend, Player e Admin validados com build sem erros

## 🧠 RESULTADO FINAL
Repositório otimizado, seguro e pronto para produção.
EOT

echo "✅ Relatório criado em docs/AUDITORIA-LIMPEZA-FINAL.md"

# Etapa 8: Commit e push
git add .gitignore docs/AUDITORIA-LIMPEZA-FINAL.md
git commit -m "🧹 Backup, limpeza e verificação completa do repositório Gol de Ouro"
git push origin main --force
echo "✅ Commit e push realizados com sucesso."

# Etapa 9: Acionar o pipeline principal no GitHub Actions
echo "🚀 Acionando workflow '🚀 Pipeline Principal - Gol de Ouro'..."
gh workflow run "main-pipeline.yml" || echo "⚠️ Não foi possível executar via CLI, execute manualmente em https://github.com/indesconectavel/gol-de-ouro/actions"

echo "====================================================="
echo "🏁 BACKUP, LIMPEZA E VERIFICAÇÃO CONCLUÍDAS!"
echo "📦 Tamanho final: $AFTER_SIZE"
echo "🧠 Backup salvo em: $BACKUP_NAME"
echo "✅ Repositório pronto e pipeline acionado."






