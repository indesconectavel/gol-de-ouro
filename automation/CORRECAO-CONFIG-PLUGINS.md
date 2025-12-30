# 🔧 CORREÇÃO - @expo/config-plugins

**Data:** 2025-12-14  
**Problema:** `Cannot find module '@expo/config-plugins'`

---

## 🔍 PROBLEMA IDENTIFICADO

**Erro:** `Cannot find module '@expo/config-plugins'`

**Causa:**
- O módulo `@expo/config-plugins` não está instalado como dependência explícita
- É necessário para processar plugins do Expo (expo-image-picker, expo-camera, etc.)
- O EAS Build precisa deste módulo para ler a configuração do app

---

## ✅ CORREÇÃO APLICADA

**Adicionado `@expo/config-plugins` como devDependency:**

```json
"devDependencies": {
  "@expo/config-plugins": "~9.0.0",
  ...
}
```

**Versão:** `~9.0.0` (compatível com Expo SDK 51)

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

- ✅ Adicionado `@expo/config-plugins` como dependência explícita
- ✅ Versão compatível com Expo SDK 51

---

**Status:** ✅ Correção aplicada, pronto para rebuild

**Ação:** Executar build novamente

---

**Última atualização:** 2025-12-14

