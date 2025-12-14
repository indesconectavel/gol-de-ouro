# 🔍 DIAGNÓSTICO EXPO - Gol de Ouro Mobile

**Data:** 2025-12-14  
**Objetivo:** Identificar problemas bloqueantes para build do APK

---

## ✅ VERSÕES INSTALADAS

- **Expo CLI:** 0.18.31
- **Node.js:** v22.17.0
- **Expo SDK:** ~51.0.0

---

## ⚠️ PROBLEMAS IDENTIFICADOS

### 1. Conflito de Dependências - `expo/config-plugins`

**Erro:**
```
Cannot find module 'expo/config-plugins'
```

**Causa:**
- `expo-router` requer `expo/config-plugins`
- Pacote não está sendo encontrado corretamente
- Conflito entre versões de `@expo/config-plugins` e `expo-config-plugins`

**Status:** 🔴 **BLOQUEANTE** - Impede `expo-doctor` e `expo config`

---

### 2. Conflito de Versões - `@expo/webpack-config`

**Erro:**
```
peer expo@"^49.0.7 || ^50.0.0-0" from @expo/webpack-config@19.0.1
Found: expo@51.0.39
```

**Causa:**
- `@expo/webpack-config@19.0.1` requer Expo SDK 49 ou 50
- Projeto usa Expo SDK 51
- Incompatibilidade de versões

**Status:** 🟡 **NÃO BLOQUEANTE** - Apenas para web (que não usaremos)

---

## 🔧 CORREÇÕES APLICADAS

1. ✅ Instalado `@expo/config-plugins@latest`
2. ⚠️ Tentativa de remover `expo-config-plugins` (falhou por conflito)
3. ✅ Reinstalado `expo@~51.0.0` para garantir compatibilidade

---

## 📋 PRÓXIMAS AÇÕES

1. **Verificar instalação correta do `expo/config-plugins`**
2. **Testar `npx expo config` novamente**
3. **Se necessário, reinstalar dependências completamente**

---

## 🎯 IMPACTO NO BUILD

- **EAS Build:** Pode funcionar mesmo com warnings do `expo-doctor`
- **Recomendação:** Tentar build direto via EAS, ignorando warnings não-críticos

---

**Status:** ⚠️ Problemas identificados, correções em andamento

