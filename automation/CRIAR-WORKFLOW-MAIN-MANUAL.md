# 🚀 CRIAR WORKFLOW NA BRANCH MAIN MANUALMENTE

**Data:** 2025-12-14  
**Problema:** Workflow não aparece porque está em branch diferente

---

## ✅ SOLUÇÃO: Criar Diretamente no GitHub

Como há mudanças locais não commitadas, a melhor solução é criar o workflow diretamente no GitHub na branch `main`.

---

## 📋 PASSO A PASSO

### 1. Acessar Criação de Arquivo

1. Acesse: https://github.com/indesconectavel/gol-de-ouro
2. Certifique-se de estar na branch `main` (dropdown no topo)
3. Clique em "Add file" → "Create new file"
4. OU acesse diretamente: https://github.com/indesconectavel/gol-de-ouro/new/main

### 2. Criar Arquivo

**Caminho do arquivo:** `.github/workflows/build-android-apk.yml`

**Conteúdo:** (Cole o conteúdo completo abaixo)

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

      - name: Initialize EAS project
        working-directory: ./goldeouro-mobile
        run: |
          echo "Checking EAS project configuration..."
          if ! eas project:info > /dev/null 2>&1; then
            echo "EAS project not initialized, initializing..."
            eas init --id --non-interactive || echo "Init failed, continuing..."
          fi

      - name: Build APK
        working-directory: ./goldeouro-mobile
        run: |
          echo "Starting EAS build..."
          eas build --platform android \
            --profile ${{ github.event.inputs.profile || 'production' }} \
            --non-interactive \
            --no-wait || {
              echo "Build submission failed, checking status..."
              eas build:list --platform android --limit 5
              exit 1
            }
          echo "Build submitted successfully"

      - name: Wait for build to complete
        working-directory: ./goldeouro-mobile
        run: |
          echo "Waiting for build to complete..."
          BUILD_ID=$(eas build:list --platform android --limit 1 --json | jq -r '.[0].id')
          if [ -z "$BUILD_ID" ] || [ "$BUILD_ID" = "null" ]; then
            echo "Error: Could not get build ID"
            exit 1
          fi
          echo "Build ID: $BUILD_ID"
          echo "BUILD_ID=$BUILD_ID" >> $GITHUB_ENV
          eas build:wait --id $BUILD_ID || {
            echo "Build wait failed, but continuing to check status..."
            eas build:list --platform android --limit 1
            exit 1
          }

      - name: Download APK
        working-directory: ./goldeouro-mobile
        run: |
          echo "Downloading APK..."
          if [ -n "$BUILD_ID" ]; then
            eas build:download --platform android --id $BUILD_ID --output ./build.apk || {
              echo "Download by ID failed, trying latest..."
              eas build:download --platform android --latest --output ./build.apk
            }
          else
            eas build:download --platform android --latest --output ./build.apk
          fi
          if [ ! -f ./build.apk ]; then
            echo "Error: APK file not found after download"
            exit 1
          fi
          echo "APK downloaded successfully: $(ls -lh ./build.apk)"

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

### 3. Salvar Arquivo

1. Role até o final da página
2. Clique em "Start commit"
3. Mensagem: `feat: Adicionar workflow Build Android APK`
4. Selecione: **"Commit directly to the main branch"**
5. Clique em "Commit new file"

### 4. Verificar Workflow

1. Acesse: https://github.com/indesconectavel/gol-de-ouro/actions
2. Recarregue a página (F5)
3. Você deve ver "Build Android APK" na lista

### 5. Executar Workflow

1. Clique em "Build Android APK"
2. Clique em "Run workflow"
3. Selecione:
   - Branch: `main`
   - Profile: `production`
4. Clique em "Run workflow"

---

## ✅ ALTERNATIVA: EXECUTAR DIRETAMENTE

Se preferir não criar na branch main, você pode executar diretamente pela URL:

1. **Acesse:** https://github.com/indesconectavel/gol-de-ouro/actions/workflows/build-android-apk.yml
2. **Clique em:** "Run workflow"
3. **Selecione:** Branch `test/branch-protection-config`
4. **Execute**

---

**Última atualização:** 2025-12-14

