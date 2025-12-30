# 🔧 CORREÇÃO FINAL - @expo/config-plugins

**Data:** 2025-12-14  
**Problema:** `Cannot find module '@expo/config-plugins'` mesmo após adicionar

---

## 🔍 PROBLEMA IDENTIFICADO

**Erro:** `Cannot find module '@expo/config-plugins'`

**Causa:**
- `NODE_ENV=production` no `eas.json` faz o npm ignorar `devDependencies`
- `@expo/config-plugins` estava em `devDependencies`
- Precisa estar em `dependencies` para ser instalado durante o build

---

## ✅ CORREÇÕES APLICADAS

1. **Removido `NODE_ENV=production` do `eas.json`**
   - Evita que devDependencies sejam ignoradas

2. **Movido `@expo/config-plugins` para `dependencies`**
   - Garante que seja instalado durante o build
   - Versão: `~9.0.0` (compatível com Expo SDK 51)

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

- ✅ Removido `NODE_ENV=production` do eas.json
- ✅ Movido `@expo/config-plugins` para dependencies
- ✅ Versão compatível com Expo SDK 51

---

**Status:** ✅ Correções finais aplicadas, pronto para rebuild

**Ação:** Executar build novamente

---

**Última atualização:** 2025-12-14

