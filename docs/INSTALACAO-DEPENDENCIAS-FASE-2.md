# 📦 INSTALAÇÃO DE DEPENDÊNCIAS - FASE 2

**Data:** 17/11/2025  
**Status:** ⚠️ **AÇÃO NECESSÁRIA**

---

## ⚠️ DEPENDÊNCIA FALTANTE

### expo-clipboard

O código usa `expo-clipboard` para copiar o código PIX, mas esta dependência não está no `package.json`.

**Solução:**

```bash
cd goldeouro-mobile
npx expo install expo-clipboard
```

**Ou adicionar manualmente no package.json:**

```json
{
  "dependencies": {
    "expo-clipboard": "~6.0.0"
  }
}
```

Depois executar:
```bash
npm install
```

---

## ✅ DEPENDÊNCIAS JÁ INSTALADAS

Todas as outras dependências necessárias já estão instaladas:
- ✅ expo-linear-gradient
- ✅ @expo/vector-icons
- ✅ expo-haptics
- ✅ axios
- ✅ @react-native-async-storage/async-storage
- ✅ react-native-paper
- ✅ @react-navigation/native
- ✅ @react-navigation/bottom-tabs
- ✅ @react-navigation/stack

---

**Status:** ⚠️ **INSTALAR expo-clipboard ANTES DE TESTAR**

