# 🔧 CORREÇÃO - expo-vector-icons

**Data:** 2025-12-14  
**Problema:** Versão inexistente `expo-vector-icons@~14.0.2`

---

## 🔍 PROBLEMA IDENTIFICADO

**Erro:** `npm error notarget No matching version found for expo-vector-icons@~14.0.2`

**Causa:**
- O pacote correto é `@expo/vector-icons` (não `expo-vector-icons`)
- Havia duplicação no `package.json`:
  - ❌ `expo-vector-icons`: "~14.0.2" (linha 35) - **INCORRETO**
  - ✅ `@expo/vector-icons`: "^14.0.2" (linha 45) - **CORRETO**

---

## ✅ CORREÇÃO APLICADA

**Removida dependência incorreta:**
- ❌ Removido `expo-vector-icons` (pacote não existe)
- ✅ Mantido apenas `@expo/vector-icons` (pacote correto)

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

- ✅ Removida dependência duplicada e incorreta
- ✅ Mantido apenas `@expo/vector-icons` (correto)

---

**Status:** ✅ Correção aplicada, pronto para rebuild

**Ação:** Executar build novamente

---

**Última atualização:** 2025-12-14

