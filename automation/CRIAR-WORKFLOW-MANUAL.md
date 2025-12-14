# 🔧 CRIAR WORKFLOW MANUALMENTE NO GITHUB

**Data:** 2025-12-14  
**Situação:** Workflow não aparece no GitHub

---

## ✅ SOLUÇÃO: Criar Workflow Manualmente

Se o push não funcionar ou você preferir criar manualmente:

### PASSO 1: Criar Arquivo no GitHub

1. Acesse: https://github.com/indesconectavel/gol-de-ouro
2. Clique em **"Add file"** → **"Create new file"**
3. Digite o caminho: `.github/workflows/build-android-apk.yml`
4. Cole o conteúdo abaixo:

---

## 📄 CONTEÚDO DO WORKFLOW

```yaml
name: Build Android APK

on:
  workflow_dispatch:
    inputs:
      profile:
        description: 'Build profile'
        required: true
        default: 'production'
        type: choice
        options:
          - production
          - preview
  push:
    branches:
      - main
      - master
    paths:
      - 'goldeouro-mobile/**'
      - '.github/workflows/build-android-apk.yml'

jobs:
  build:
    name: Build Android APK
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: goldeouro-mobile/package-lock.json

      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Install dependencies
        working-directory: ./goldeouro-mobile
        run: |
          npm install --legacy-peer-deps
          npm install @expo/config-plugins@latest --legacy-peer-deps

      - name: Build APK
        working-directory: ./goldeouro-mobile
        run: |
          eas build --platform android \
            --profile ${{ github.event.inputs.profile || 'production' }} \
            --non-interactive \
            --no-wait

      - name: Wait for build to complete
        working-directory: ./goldeouro-mobile
        run: |
          BUILD_ID=$(eas build:list --platform android --limit 1 --json | jq -r '.[0].id')
          echo "Build ID: $BUILD_ID"
          echo "BUILD_ID=$BUILD_ID" >> $GITHUB_ENV
          eas build:wait --id $BUILD_ID

      - name: Download APK
        working-directory: ./goldeouro-mobile
        run: |
          eas build:download --platform android --latest --output ./build.apk

      - name: Upload APK artifact
        uses: actions/upload-artifact@v4
        with:
          name: android-apk
          path: goldeouro-mobile/build.apk
          retention-days: 30

      - name: Get build info
        working-directory: ./goldeouro-mobile
        run: |
          eas build:list --platform android --limit 1 --json > build-info.json
          cat build-info.json

      - name: Upload build info
        uses: actions/upload-artifact@v4
        with:
          name: build-info
          path: goldeouro-mobile/build-info.json
```

---

### PASSO 2: Salvar Arquivo

1. Role até o final da página
2. Clique em **"Commit new file"**
3. Mensagem: `feat: Adicionar workflow para build APK Android`
4. Clique em **"Commit new file"**

---

### PASSO 3: Adicionar Secret

1. Acesse: https://github.com/indesconectavel/gol-de-ouro/settings/secrets/actions
2. Clique em **"New repository secret"**
3. Name: `EXPO_TOKEN`
4. Secret: `fGr2EHaOgPjlMWxwSp6IkEp3HTHa2dJo8OJncLK4`
5. Clique em **"Add secret"**

---

### PASSO 4: Executar Workflow

1. Acesse: https://github.com/indesconectavel/gol-de-ouro/actions
2. Você deve ver **"Build Android APK"** na lista
3. Clique nele
4. Clique em **"Run workflow"**
5. Selecione profile: `production`
6. Clique em **"Run workflow"**

---

**Última atualização:** 2025-12-14

