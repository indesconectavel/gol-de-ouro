# 🔐 CONFIGURAR TOKEN EXPO PARA GITHUB ACTIONS

**Data:** 2025-12-14

---

## 📋 PASSO A PASSO

### 1. Criar Token no Expo

1. Acesse: https://expo.dev/accounts/indesconectavel/settings/access-tokens
2. Faça login se necessário (indesconectavel@gmail.com)
3. Clique em **"Create token"**
4. Preencha:
   - **Name:** `GitHub Actions Build`
   - **Type:** `Access token` (padrão)
5. Clique em **"Create"**
6. **COPIE O TOKEN** (você só verá uma vez!)

---

### 2. Adicionar Secret no GitHub

1. Acesse seu repositório no GitHub:
   - https://github.com/seu-usuario/goldeouro-backend
2. Vá em: **Settings** (no topo do repositório)
3. No menu lateral esquerdo, clique em:
   - **Secrets and variables** → **Actions**
4. Clique no botão **"New repository secret"**
5. Preencha:
   - **Name:** `EXPO_TOKEN`
   - **Secret:** Cole o token copiado do Expo
6. Clique em **"Add secret"**

---

### 3. Verificar Configuração

1. Volte para: **Secrets and variables** → **Actions**
2. Você deve ver `EXPO_TOKEN` na lista
3. ✅ Configuração concluída!

---

## 🚀 PRÓXIMO PASSO

Após configurar o token:

1. Acesse: https://github.com/seu-usuario/goldeouro-backend/actions
2. Execute o workflow **"Build Android APK"**
3. Aguarde o build
4. Baixe o APK

---

## ⚠️ IMPORTANTE

- Token é sensível - não compartilhe
- Token deve ter permissões de build
- Se perder o token, crie um novo

---

**Última atualização:** 2025-12-14

