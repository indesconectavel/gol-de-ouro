# 🔧 CORREÇÃO - Versões Incompatíveis (expo doctor)

**Data:** 2025-12-14  
**Problema:** Múltiplas versões incompatíveis identificadas pelo `expo doctor`

---

## 🔍 PROBLEMAS IDENTIFICADOS

### 1. Versões Incompatíveis:
- ❌ `@expo/config-plugins@9.0.17` → ✅ Deve ser `~8.0.0`
- ❌ `metro@0.81.5` → ✅ Deve ser `~0.80.8`
- ❌ `metro-resolver@0.81.5` → ✅ Deve ser `~0.80.8`
- ❌ `metro-config@0.81.5` → ✅ Deve ser `~0.80.8`
- ❌ `expo-image-picker@15.0.7` → ✅ Deve ser `~15.1.0`
- ❌ `typescript@5.9.3` → ✅ Deve ser `~5.3.3`

### 2. Dependências Faltando:
- ❌ `react-dom` faltando (requerido por `react-native-web`)

### 3. Dependências Desnecessárias:
- ❌ `@types/react-native` não deve estar instalado diretamente
- ❌ `@expo/config-plugins` não deve estar instalado diretamente (usar `expo/config-plugins`)

### 4. Erro no Build:
- ❌ `Cannot find module 'metro-core'`

---

## ✅ CORREÇÕES APLICADAS

1. ✅ Removido `@expo/config-plugins` (usar `expo/config-plugins` via expo)
2. ✅ Removido `metro` e `metro-react-native-babel-preset` (serão instalados via expo)
3. ✅ Adicionado `react-dom@18.2.0`
4. ✅ Removido `@types/react-native`
5. ✅ Ajustado `typescript` para `~5.3.3`
6. ✅ Ajustado `expo-image-picker` para `~15.1.0`

---

## 🎯 PRÓXIMO PASSO

**Executar `npx expo install --fix` para corrigir automaticamente todas as versões:**

```powershell
cd goldeouro-mobile
npx expo install --fix
```

**Depois executar build novamente:**

```powershell
npx eas build --platform android --profile production
```

---

**Status:** ✅ Correções aplicadas manualmente, executar `expo install --fix` para completar

**Ação:** Executar `npx expo install --fix`

---

**Última atualização:** 2025-12-14

