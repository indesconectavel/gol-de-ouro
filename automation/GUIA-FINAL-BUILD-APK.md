# 🚀 GUIA FINAL - BUILD APK VIA GITHUB ACTIONS

**Data:** 2025-12-14  
**Token Expo:** ✅ Criado (`fGr2EHaOgPjlMWxwSp6IkEp3HTHa2dJo8OJncLK4`)  
**Repositório:** `indesconectavel/gol-de-ouro`

---

## ✅ SITUAÇÃO ATUAL

- ✅ Token Expo criado e ativo
- ✅ Login EAS funcionando
- ✅ Configuração do projeto correta
- ❌ EAS CLI local não funciona (conflito de dependências)
- ❌ Dashboard Expo com erro de permissões
- ✅ **SOLUÇÃO:** GitHub Actions (mais confiável)

---

## 📋 CONFIGURAÇÃO NECESSÁRIA

### PASSO 1: Adicionar Secret no GitHub

**Repositório:** `indesconectavel/gol-de-ouro`

1. Acesse: https://github.com/indesconectavel/gol-de-ouro/settings/secrets/actions
2. Clique em **"New repository secret"**
3. Preencha:
   - **Name:** `EXPO_TOKEN`
   - **Secret:** `fGr2EHaOgPjlMWxwSp6IkEp3HTHa2dJo8OJncLK4`
4. Clique em **"Add secret"**

---

### PASSO 2: Fazer Commit do Workflow

O arquivo `.github/workflows/build-android-apk.yml` já foi criado, mas precisa ser commitado:

```powershell
cd "E:\Chute de Ouro\goldeouro-backend"

# Adicionar workflow
git add .github/workflows/build-android-apk.yml
git add goldeouro-mobile/src/config/env.js
git add goldeouro-mobile/eas.json
git add automation/

# Commit
git commit -m "feat: Adicionar workflow GitHub Actions para build APK Android"

# Push
git push origin test/branch-protection-config
```

**Nota:** Se o workflow não estiver no repositório `gol-de-ouro`, você pode:
- Copiar o arquivo manualmente para o repositório correto
- OU fazer push deste repositório para lá

---

### PASSO 3: Executar Build

1. Acesse: https://github.com/indesconectavel/gol-de-ouro/actions
2. Clique em **"Build Android APK"** (no menu lateral)
3. Clique em **"Run workflow"** (botão no topo direito)
4. Selecione:
   - **Branch:** `test/branch-protection-config` (ou `main`/`master`)
   - **Profile:** `production`
5. Clique em **"Run workflow"**
6. Aguarde 15-30 minutos
7. Baixe o APK na aba **"Artifacts"**

---

## 📁 ESTRUTURA DO WORKFLOW

O workflow procura o projeto mobile em:
- `goldeouro-mobile/` (relativo à raiz do repositório)

**Se o projeto mobile estiver em outro local:**
- Ajuste o `working-directory` no workflow

---

## ✅ VANTAGENS DO GITHUB ACTIONS

- ✅ Ambiente limpo (Ubuntu)
- ✅ Não depende de configuração local
- ✅ Dependências instaladas corretamente
- ✅ Builds reproduzíveis
- ✅ Histórico completo
- ✅ Downloads automáticos

---

## ⚠️ IMPORTANTE

- Workflow deve estar no repositório `gol-de-ouro`
- Secret `EXPO_TOKEN` deve ser adicionado
- Projeto mobile deve estar em `goldeouro-mobile/`
- Build levará 15-30 minutos

---

## 🎯 PRÓXIMOS PASSOS

1. **Agora:** Adicionar `EXPO_TOKEN` como secret no GitHub
2. **Depois:** Fazer commit e push do workflow (se necessário)
3. **Depois:** Executar workflow manualmente
4. **Depois:** Baixar APK dos artifacts
5. **Depois:** Instalar e testar no dispositivo

---

**Status:** ✅ Tudo pronto para build via GitHub Actions

