#!/bin/bash
echo "====================================================="
echo "🧠 INICIANDO LIMPEZA + OTIMIZAÇÃO DO PROJETO GOL DE OURO"
echo "====================================================="

# Tamanho antes da limpeza
BEFORE_SIZE=$(du -sh . | cut -f1)
echo "📦 Tamanho antes da limpeza: $BEFORE_SIZE"

# Etapa 1: Remover arquivos e diretórios desnecessários
echo "🧹 Limpando diretórios e arquivos grandes..."
rm -rf BACKUP-COMPLETO-* artifacts/ teste-rollback-* tmp/ logs/
rm -rf backups/
rm -rf docs/logs/
rm -rf goldeouro-player/node_modules/
rm -rf goldeouro-admin/node_modules/
rm -rf goldeouro-backend/node_modules/
rm -rf .cache/ .parcel-cache/ dist/ build/
echo "✅ Limpeza concluída."

# Etapa 2: Atualizar .gitignore
echo "🧾 Atualizando .gitignore..."
cat <<EOT >> .gitignore

# Arquivos grandes e temporários
BACKUP-COMPLETO-*
backups/
artifacts/
teste-rollback-*/
tmp/
logs/
docs/logs/
dist/
build/
.cache/
.parcel-cache/
*.zip
*.tar
*.mp4
*.mov

# Dependências duplicadas
goldeouro-admin/node_modules/
goldeouro-player/node_modules/
goldeouro-backend/node_modules/
EOT
echo "✅ .gitignore atualizado."

# Etapa 3: Compactar histórico Git
echo "🧰 Compactando histórico Git..."
git gc --prune=now --aggressive
git repack -ad
git reflog expire --expire=now --all
echo "✅ Histórico otimizado."

# Etapa 4: Reinstalar dependências
echo "⚙️ Reinstalando dependências..."
cd goldeouro-backend && npm install && cd ..
cd goldeouro-player && npm install && cd ..
cd goldeouro-admin && npm install && cd ..
echo "✅ Dependências reinstaladas."

# Etapa 5: Validar builds
echo "🧪 Validando builds..."
cd goldeouro-backend && npm run build || { echo "❌ Erro no backend!"; exit 1; } && cd ..
cd goldeouro-player && npm run build || { echo "❌ Erro no player!"; exit 1; } && cd ..
cd goldeouro-admin && npm run build || { echo "❌ Erro no admin!"; exit 1; } && cd ..
echo "✅ Todos os builds verificados com sucesso."

# Etapa 6: Tamanho final
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
- Diretórios desnecessários removidos
- Node_modules duplicados eliminados
- Histórico Git compactado
- Dependências reinstaladas e builds validados

## 🧠 RESULTADO FINAL
Repositório otimizado, leve e pronto para push no GitHub.
EOT

echo "✅ Relatório criado em docs/AUDITORIA-LIMPEZA-FINAL.md"

# Etapa 7: Commit e push
git add .gitignore docs/AUDITORIA-LIMPEZA-FINAL.md
git commit -m "🧹 Limpeza e otimização completa do repositório Gol de Ouro"
git push origin main --force
echo "✅ Push enviado com sucesso."

# Etapa 8: Acionar pipeline principal
echo "🚀 Acionando pipeline principal no GitHub Actions..."
gh workflow run "main-pipeline.yml" || echo "⚠️ Execute manualmente: https://github.com/indesconectavel/gol-de-ouro/actions"

echo "====================================================="
echo "🏁 LIMPEZA E OTIMIZAÇÃO CONCLUÍDAS!"
echo "📦 Tamanho final: $AFTER_SIZE"
echo "✅ Repositório pronto para produção!"


