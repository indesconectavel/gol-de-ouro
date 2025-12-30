# 🔧 CORREÇÃO - metro/src/lib/TerminalReporter

**Data:** 2025-12-14  
**Problema:** `Cannot find module 'metro/src/lib/TerminalReporter'`

---

## 🔍 PROBLEMA IDENTIFICADO

**Erro:** `Cannot find module 'metro/src/lib/TerminalReporter'`

**Causa:**
- O módulo `metro` não está instalado como dependência explícita
- É necessário para criar o bundle JavaScript durante o build
- O Expo CLI precisa do `metro` para processar o código React Native

**Fase:** `:app:createBundleReleaseJsAndAssets` (criação do bundle JS)

---

## ✅ CORREÇÃO APLICADA

**Adicionado `metro` como dependência:**

```json
"dependencies": {
  ...
  "metro": "^0.80.0"
}
```

**Versão:** `^0.80.0` (compatível com Expo SDK 51 e React Native 0.74.5)

---

## 🎯 PRÓXIMO PASSO: REBUILD

**Execute novamente:**

```powershell
cd goldeouro-mobile
npx eas build --platform android --profile production
```

**Agora deve funcionar!**

---

## 📋 O QUE FOI CORRIGIDO

- ✅ Adicionado `metro` como dependência explícita
- ✅ Versão compatível com Expo SDK 51

---

**Status:** ✅ Correção aplicada, pronto para rebuild

**Ação:** Executar build novamente

---

**Última atualização:** 2025-12-14
