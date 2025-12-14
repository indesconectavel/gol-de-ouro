# ⚠️ PROBLEMA NO BUILD EAS - SOLUÇÃO ALTERNATIVA

**Data:** 2025-12-14  
**Problema:** EAS CLI não consegue encontrar `expo/config-plugins`  
**Causa:** Conflito entre dependências locais e EAS CLI

---

## 🔍 PROBLEMA IDENTIFICADO

O EAS CLI está falhando ao tentar ler a configuração do projeto porque:
1. `npx expo config` falha localmente (módulo '../log' não encontrado)
2. EAS CLI usa fallback mas ainda assim falha
3. `expo-router` plugin requer `expo/config-plugins` que não está disponível no contexto do EAS CLI

---

## ✅ SOLUÇÕES ALTERNATIVAS

### OPÇÃO 1: Build via Dashboard do Expo (RECOMENDADO)

1. Acesse: https://expo.dev/accounts/indesconectavel/projects/gol-de-ouro-mobile/builds
2. Clique em "Create a build"
3. Selecione:
   - Platform: Android
   - Profile: production
   - Build type: APK
4. Clique em "Build"

**Vantagens:**
- Não depende de configuração local
- Interface visual
- Mais confiável

---

### OPÇÃO 2: Corrigir Dependências Localmente

Execute na ordem:

```bash
cd goldeouro-mobile

# Remover node_modules completamente
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json

# Reinstalar tudo
npm install --legacy-peer-deps

# Tentar build novamente
eas build --platform android --profile production
```

---

### OPÇÃO 3: Usar Expo Go Temporariamente

Para testes rápidos, pode usar Expo Go:
```bash
npx expo start
```

Depois escanear QR code com Expo Go app.

**Limitação:** Não testa build de produção completo.

---

## 📋 STATUS ATUAL

- ✅ Login EAS: Funcionando
- ✅ Configuração: Corrigida (env.js, eas.json)
- ❌ Build EAS: Falhando (problema de dependências)
- ✅ Alternativa: Build via Dashboard disponível

---

## 🎯 RECOMENDAÇÃO

**Usar OPÇÃO 1 (Dashboard do Expo)** - É a forma mais confiável e não depende de configuração local.

---

**Última atualização:** 2025-12-14

