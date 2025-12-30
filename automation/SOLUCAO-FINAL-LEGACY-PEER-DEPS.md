# ✅ SOLUÇÃO FINAL - LEGACY PEER DEPS

**Data:** 2025-12-14  
**Problema:** Conflitos de dependências no build EAS

---

## 🔍 PROBLEMA

O EAS Build está falhando por conflitos de peer dependencies durante `npm install`.

---

## ✅ SOLUÇÃO APLICADA

**Configurado `eas.json` para usar `--legacy-peer-deps` durante o build:**

```json
"production": {
  "android": {
    "buildType": "apk"
  },
  "env": {
    "NODE_ENV": "production"
  },
  "npm": {
    "installArgs": ["--legacy-peer-deps"]
  }
}
```

**Isso força o npm a ignorar conflitos de peer dependencies durante o build.**

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

- ✅ Removido `@expo/webpack-config` incompatível
- ✅ Ajustado `react` para `18.2.0`
- ✅ Configurado `--legacy-peer-deps` no EAS Build
- ✅ Ajustado `@expo/vector-icons` para versão compatível

---

**Status:** ✅ Solução aplicada, pronto para rebuild

**Ação:** Executar build novamente

---

**Última atualização:** 2025-12-14

