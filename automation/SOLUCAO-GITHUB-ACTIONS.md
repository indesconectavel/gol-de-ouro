# 🚀 SOLUÇÃO - BUILD APK VIA GITHUB ACTIONS

**Data:** 2025-12-14  
**Método:** GitHub Actions + EAS (Mais Confiável)

---

## ✅ VANTAGENS

- ✅ Não depende de configuração local
- ✅ Build automático em ambiente limpo
- ✅ Histórico de builds no GitHub
- ✅ Downloads automáticos
- ✅ Mais confiável que CLI local

---

## 🔧 CONFIGURAÇÃO NECESSÁRIA

### 1. Criar Token Expo

1. Acesse: https://expo.dev/accounts/indesconectavel/settings/access-tokens
2. Clique em "Create token"
3. Dê um nome: "GitHub Actions Build"
4. Copie o token gerado

### 2. Adicionar Secret no GitHub

1. Acesse seu repositório no GitHub
2. Vá em: **Settings** → **Secrets and variables** → **Actions**
3. Clique em **"New repository secret"**
4. Nome: `EXPO_TOKEN`
5. Valor: Cole o token do Expo criado acima
6. Clique em **"Add secret"**

---

## 🚀 COMO USAR

### Opção 1: Build Manual (Recomendado)

1. Acesse: https://github.com/seu-usuario/goldeouro-backend/actions
2. Clique em **"Build Android APK"** no menu lateral
3. Clique em **"Run workflow"**
4. Selecione:
   - Branch: `main` ou `master`
   - Profile: `production`
5. Clique em **"Run workflow"**
6. Aguarde o build completar (15-30 minutos)
7. Baixe o APK na aba **"Artifacts"**

### Opção 2: Build Automático

O build será executado automaticamente quando:
- Fizer push para `main` ou `master`
- Modificar arquivos em `goldeouro-mobile/`

---

## 📋 ARQUIVO CRIADO

✅ `.github/workflows/build-android-apk.yml`

Este arquivo configura o GitHub Actions para:
- Instalar dependências
- Fazer build via EAS
- Aguardar conclusão
- Baixar APK
- Disponibilizar para download

---

## 🔍 VERIFICAR STATUS

1. Acesse: https://github.com/seu-usuario/goldeouro-backend/actions
2. Veja o status do workflow
3. Clique no workflow para ver logs detalhados
4. Baixe o APK na seção "Artifacts"

---

## ⚠️ IMPORTANTE

- Token Expo deve ser adicionado como secret
- Repositório deve estar no GitHub
- Workflow será executado em ambiente Ubuntu limpo
- Build levará 15-30 minutos

---

## 🎯 PRÓXIMOS PASSOS

1. **Agora:** Adicionar `EXPO_TOKEN` como secret no GitHub
2. **Depois:** Executar workflow manualmente
3. **Depois:** Baixar APK dos artifacts
4. **Depois:** Instalar e testar no dispositivo

---

**Última atualização:** 2025-12-14

