# 🚀 PIPELINE PRINCIPAL - GOL DE OURO
# Copie o conteúdo abaixo e cole no GitHub

name: 🚀 Pipeline Principal - Gol de Ouro

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - name: 🔍 Checkout do código
        uses: actions/checkout@v4

      - name: ⚙️ Configurar Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18

      - name: 📦 Instalar dependências
        run: npm install --legacy-peer-deps

      - name: 🧱 Build do projeto
        run: npm run build

      - name: 🚀 Deploy Backend (Fly.io)
        uses: superfly/flyctl-actions@master
        with:
          args: "deploy --remote-only"
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}

      - name: 🌐 Deploy Frontend (Vercel)
        run: npx vercel --prod --yes
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

      - name: ✅ Validar endpoints principais
        run: |
          echo "🔍 Testando endpoints de produção..."
          curl -f https://goldeouro-backend.fly.dev/health
          curl -f https://goldeouro-backend.fly.dev/api/status
          echo "✅ Todos os endpoints estão funcionando!"

      - name: 📊 Log final
        run: |
          echo "=================================================="
          echo "🏆 DEPLOY DO GOL DE OURO CONCLUÍDO COM SUCESSO!"
          echo "🌐 Frontend: https://goldeouro.lol"
          echo "⚙️ Backend:  https://goldeouro-backend.fly.dev"
          echo "=================================================="

---

# 📋 INSTRUÇÕES PARA CRIAR MANUALMENTE:

1. Acesse: https://github.com/indesconectavel/gol-de-ouro
2. Clique em "Actions" (aba superior)
3. Clique em "New workflow" ou "Set up a workflow yourself"
4. Cole o conteúdo YAML acima
5. Salve o arquivo como "main-pipeline.yml"
6. Commit com a mensagem: "🚀 Adicionado Pipeline Principal - Gol de Ouro"

# 🔗 LINK DIRETO:
https://github.com/indesconectavel/gol-de-ouro/actions/new

# ✅ APÓS CRIAR:
- O workflow aparecerá na lista
- Clique em "Run workflow"
- Selecione branch "main"
- Execute o pipeline
