# ✅ CHECKLIST BUILD APK - Gol de Ouro Mobile

**Data:** 2025-12-14  
**Objetivo:** Validar configuração antes do build

---

## 📋 CONFIGURAÇÃO DO PROJETO

### ✅ app.json

- [x] **Nome:** "Gol de Ouro"
- [x] **Slug:** "gol-de-ouro-mobile"
- [x] **Versão:** "2.0.0"
- [x] **Package Android:** "com.goldeouro.app"
- [x] **Version Code:** 2
- [x] **Project ID EAS:** "gol-de-ouro-mobile"

**Status:** ✅ Configurado corretamente

---

### ✅ eas.json

- [x] **Profile production:** Configurado
- [x] **Build Type:** "apk"
- [x] **CLI version:** ">= 7.8.6"

**Status:** ✅ Configurado corretamente

---

### ✅ env.js

- [x] **API URL:** Hardcoded para produção
- [x] **URL:** "https://goldeouro-backend-v2.fly.dev"
- [x] **WebSocket:** "wss://goldeouro-backend-v2.fly.dev"

**Status:** ✅ Configurado para produção

---

## ⚠️ PROBLEMAS IDENTIFICADOS

### 1. Conflito de Dependências

- [ ] **expo/config-plugins:** Não encontrado
- [ ] **@expo/config:** Problema com build/index.js
- [ ] **expo-router:** Não consegue carregar plugin

**Status:** 🔴 **BLOQUEANTE** - Corrigindo agora

---

### 2. Conflito de Versões

- [ ] **@expo/webpack-config:** Requer Expo SDK 49/50, temos SDK 51
- [ ] **Impacto:** Apenas para web (não usado)

**Status:** 🟡 **NÃO BLOQUEANTE** - Apenas web

---

## 🔧 AÇÕES EM ANDAMENTO

1. ✅ Removido `node_modules` e `package-lock.json`
2. ⏳ Reinstalando dependências com `--legacy-peer-deps`
3. ⏳ Validando configuração após reinstalação

---

## 📋 PRÓXIMOS PASSOS

1. **Após reinstalação:**
   - Validar `npx expo config`
   - Validar `npx expo-doctor`
   - Tentar build via EAS

2. **Se build funcionar:**
   - Continuar com validação
   - Gerar APK

3. **Se build falhar:**
   - Investigar problemas específicos
   - Aplicar correções adicionais

---

**Status:** ⏳ Reinstalação em andamento

