# 🔧 CORREÇÃO - Versão @expo/config-plugins

**Data:** 2025-12-14  
**Problema:** Versão incorreta de `@expo/config-plugins`

---

## 🔍 PROBLEMA IDENTIFICADO

**Erro:** `Cannot find module '@expo/config-plugins'` (mesmo após adicionar)

**Causa:**
- Versão `~9.0.0` pode não ser compatível com Expo SDK 51
- Precisa usar versão compatível com SDK 51

---

## ✅ CORREÇÃO APLICADA

**Ajustada versão para `~8.0.0`:**

```json
"devDependencies": {
  "@expo/config-plugins": "~8.0.0",
  ...
}
```

**Versão:** `~8.0.0` (compatível com Expo SDK 51)

---

## 🎯 PRÓXIMO PASSO: REBUILD

**Execute novamente:**

```powershell
cd goldeouro-mobile
npx eas build --platform android --profile production
```

---

**Status:** ✅ Versão ajustada, pronto para rebuild

**Ação:** Executar build novamente

---

**Última atualização:** 2025-12-14

