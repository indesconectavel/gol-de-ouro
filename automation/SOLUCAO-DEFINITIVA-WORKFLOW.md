# ✅ SOLUÇÃO DEFINITIVA - CRIAR WORKFLOW VIA PR

**Data:** 2025-12-14  
**Problema:** Workflow não existe na branch `main`, GitHub mostra "not found"

---

## 🔍 CAUSA DO PROBLEMA

- ✅ Workflow existe na branch `test/branch-protection-config`
- ❌ GitHub procura workflows na branch `main` (padrão)
- ❌ Como não está em `main`, mostra "not found"

---

## ✅ SOLUÇÃO: CRIAR VIA PULL REQUEST

Como a branch `main` está protegida, vamos criar via PR:

---

## 📋 PASSO A PASSO

### 1. Criar Arquivo em Nova Branch

1. **Acesse:** https://github.com/indesconectavel/gol-de-ouro/new/main

2. **No campo de nome do arquivo, digite:**
   ```
   .github/workflows/build-android-apk.yml
   ```

3. **Cole o conteúdo completo abaixo:**

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

4. **Role até o final da página**

5. **No campo "Commit message", digite:**
   ```
   feat: Adicionar workflow Build Android APK
   ```

6. **Selecione:** "Create a new branch for this commit and start a pull request"

7. **Nome da branch sugerido:** `add-build-android-apk-workflow` (ou deixe o padrão)

8. **Clique em "Propose changes"**

---

### 2. Aprovar e Fazer Merge do PR

1. **Após criar o PR, você será redirecionado para a página do Pull Request**

2. **Revise o PR** (deve mostrar apenas o arquivo `.github/workflows/build-android-apk.yml`)

3. **Se tudo estiver correto:**
   - Clique em "Merge pull request"
   - Clique em "Confirm merge"

4. **Após merge:**
   - O workflow estará na branch `main`
   - Aparecerá na lista de workflows
   - Poderá ser executado normalmente

---

### 3. Executar Workflow

1. **Acesse:** https://github.com/indesconectavel/gol-de-ouro/actions

2. **Você deve ver "Build Android APK" na lista**

3. **Clique em "Build Android APK"**

4. **Clique em "Run workflow"**

5. **Selecione:**
   - Branch: `main`
   - Profile: `production`

6. **Clique em "Run workflow"**

---

## ⏱️ TEMPO ESTIMADO

- Criar arquivo: 2 minutos
- Criar PR: Automático
- Aprovar PR: 1 minuto
- **Total:** ~3 minutos

---

## ✅ VANTAGENS

- ✅ Workflow aparecerá na lista principal
- ✅ Pode ser executado facilmente
- ✅ Fica na branch `main` (produção)
- ✅ Segue o processo correto do GitHub

---

**Status:** ✅ Solução definitiva - Criar via PR

**Próximo passo:** Criar arquivo e PR conforme instruções acima

---

**Última atualização:** 2025-12-14

