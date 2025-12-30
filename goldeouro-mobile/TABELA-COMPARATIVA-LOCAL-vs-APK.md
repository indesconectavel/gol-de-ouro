# 📊 TABELA COMPARATIVA - LOCAL vs APK

**Data:** 2025-01-24  
**Objetivo:** Comparar versão local aprovada vs APK gerado

---

## 🔍 COMPARAÇÃO TÉCNICA

| Aspecto | Versão Local (Esperada) | Versão APK (Atual) | Status |
|--------|------------------------|-------------------|--------|
| **Projeto Base** | `goldeouro-mobile/` | ❓ `goldeouro-player/`? | 🔴 |
| **Tecnologia** | React Native + Expo | ❓ Capacitor + PWA? | 🔴 |
| **Entry Point** | `index.js` | ❓ Desconhecido | ⚠️ |
| **Componente Raiz** | `App.js` | ❓ Desconhecido | ⚠️ |
| **Navegação** | React Navigation | ❓ Expo Router? | 🔴 |
| **Biblioteca Navegação** | `@react-navigation/native` | ❓ `expo-router`? | ⚠️ |
| **Estrutura Pastas** | `src/screens/` | ❓ `app/`? | ⚠️ |
| **Tela Inicial** | `HomeScreen` (Tab Navigator) | ❓ Outra tela | 🔴 |
| **Fluxo Navegação** | Bottom Tabs → Stack | ❓ File-based routing? | 🔴 |

---

## 🎨 COMPARAÇÃO DE UI

| Elemento | Versão Local | Versão APK | Status |
|----------|--------------|------------|--------|
| **Cores Fundo** | `#1a1a1a` (escuro) | ❓ Diferente | 🔴 |
| **Cores Primárias** | `#FFD700` (dourado) | ❓ Diferente | 🔴 |
| **Gradientes** | `LinearGradient` | ❓ CSS? | 🔴 |
| **Ícones** | `@expo/vector-icons` | ❓ Outros? | ⚠️ |
| **Componentes** | `react-native-paper` | ❓ HTML/CSS? | 🔴 |
| **Layout** | React Native Styles | ❓ CSS Web? | 🔴 |

---

## 📱 COMPARAÇÃO DE TELAS

| Tela | Versão Local | Versão APK | Status |
|------|--------------|------------|--------|
| **Home** | ✅ `HomeScreen.js` | ❓ Diferente | 🔴 |
| **Jogo** | ✅ `GameScreen.js` | ❓ Diferente | 🔴 |
| **Perfil** | ✅ `ProfileScreen.js` | ❓ Diferente | 🔴 |
| **Ranking** | ✅ `LeaderboardScreen.js` | ❓ Diferente | 🔴 |
| **Saldo** | ✅ `BalanceScreen.js` | ❓ Existe? | ⚠️ |
| **Histórico** | ✅ `HistoryScreen.js` | ❓ Existe? | ⚠️ |
| **PIX** | ✅ `PixCreateScreen.js` | ❓ Existe? | ⚠️ |

---

## 🔧 COMPARAÇÃO DE CONFIGURAÇÃO

| Arquivo | Versão Local | Versão APK | Status |
|---------|--------------|------------|--------|
| **package.json** | ✅ `main: "index.js"` | ❓ Diferente? | ⚠️ |
| **app.json** | ✅ Expo config | ❓ Capacitor config? | 🔴 |
| **eas.json** | ✅ EAS Build | ❓ Existe? | ⚠️ |
| **Entry Point** | ✅ `index.js` | ❓ `index.html`? | 🔴 |

---

## 📦 COMPARAÇÃO DE DEPENDÊNCIAS

| Dependência | Versão Local | Versão APK | Status |
|-------------|--------------|------------|--------|
| **expo-router** | ⚠️ Instalado mas não usado | ❓ Usado? | ⚠️ |
| **@react-navigation** | ✅ Usado | ❓ Usado? | ⚠️ |
| **capacitor** | ❌ Não instalado | ❓ Instalado? | 🔴 |
| **vite** | ❌ Não instalado | ❓ Instalado? | 🔴 |

---

## 🎯 CONCLUSÃO

### **DISCREPÂNCIAS IDENTIFICADAS:**

1. 🔴 **Projeto diferente** - APK pode estar sendo gerado de `goldeouro-player/`
2. 🔴 **Tecnologia diferente** - Capacitor vs Expo
3. 🔴 **Navegação diferente** - File-based routing vs React Navigation
4. 🔴 **UI diferente** - CSS Web vs React Native Styles

### **AÇÃO NECESSÁRIA:**

Validar qual projeto foi usado para gerar o APK e garantir que o build use `goldeouro-mobile/`.

---

**LEGENDA:**
- ✅ Confirmado
- ⚠️ Suspeito/Conflito
- 🔴 Crítico/Diferente
- ❓ Desconhecido

