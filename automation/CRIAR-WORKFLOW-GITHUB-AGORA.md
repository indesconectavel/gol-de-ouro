# 🚀 CRIAR WORKFLOW NO GITHUB AGORA

**Data:** 2025-12-14  
**Situação:** Workflow não aparece porque está em branch diferente

---

## ✅ SOLUÇÃO: Criar Diretamente no GitHub

O workflow está commitado na branch `test/branch-protection-config`, mas precisa estar na branch `main` para aparecer. Vamos criar diretamente no GitHub:

---

## 📋 PASSO A PASSO

### 1. Acessar Criação de Workflow

1. Acesse: https://github.com/indesconectavel/gol-de-ouro
2. Clique na aba **"Actions"**
3. Clique em **"New workflow"** (ou **"Skip this and set up a workflow yourself →"**)
4. Clique em **"set up a workflow yourself"**

---

### 2. Criar Arquivo

1. No campo de nome do arquivo, digite: `.github/workflows/build-android-apk.yml`
2. Cole o conteúdo abaixo:

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

### 3. Salvar Arquivo

1. Role até o final da página
2. Clique em **"Start commit"**
3. Mensagem: `feat: Adicionar workflow Build Android APK`
4. Selecione: **"Commit directly to the main branch"**
5. Clique em **"Commit new file"**

---

### 4. Adicionar Secret (OBRIGATÓRIO)

1. Acesse: https://github.com/indesconectavel/gol-de-ouro/settings/secrets/actions
2. Clique em **"New repository secret"**
3. Preencha:
   - **Name:** `EXPO_TOKEN`
   - **Secret:** `fGr2EHaOgPjlMWxwSp6IkEp3HTHa2dJo8OJncLK4`
4. Clique em **"Add secret"**

---

### 5. Executar Workflow

1. Acesse: https://github.com/indesconectavel/gol-de-ouro/actions
2. Você deve ver **"Build Android APK"** na lista
3. Clique nele
4. Clique em **"Run workflow"**
5. Selecione:
   - **Branch:** `main`
   - **Profile:** `production`
6. Clique em **"Run workflow"**

---

## ✅ PRONTO!

Após esses passos, o workflow estará disponível e você poderá executá-lo.

---

**Última atualização:** 2025-12-14

