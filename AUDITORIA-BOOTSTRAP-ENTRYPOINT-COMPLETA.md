# 🔍 AUDITORIA COMPLETA - BOOTSTRAP & ENTRYPOINT
## Gol de Ouro Mobile - Diagnóstico do Erro "main has not been registered"

**Data:** 2025-01-24  
**Erro:** `Invariant Violation: "main" has not been registered`  
**Status:** ✅ CAUSA RAIZ IDENTIFICADA | 🔧 CORREÇÃO DISPONÍVEL

---

## ✅ ETAPA 1 — IDENTIFICAÇÃO DA ARQUITETURA

### Resposta: **ARQUITETURA TRADICIONAL (App.tsx + index.js)**

**Justificativa:**

**Arquivos Encontrados:**
- ✅ `App.js` existe na raiz (`goldeouro-mobile/App.js`)
- ✅ Usa `@react-navigation/native` (não expo-router)
- ✅ Estrutura tradicional com `src/screens/`
- ❌ **NÃO existe pasta `app/`** (necessária para expo-router)
- ❌ **NÃO existe `_layout.tsx`** (necessário para expo-router)

**Conteúdo Relevante:**
```javascript
// App.js linha 1-8
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
// NÃO usa expo-router
```

**Conflito Detectado:**
- `app.json` linha 24: `"plugins": ["expo-router"]` ← **CONFLITO**
- `package.json` linha 37: `"expo-router": "~3.5.23"` ← **DEPENDÊNCIA NÃO UTILIZADA**
- Mas estrutura é tradicional, não expo-router

---

## ✅ ETAPA 2 — PONTO DE ENTRADA REAL

### 2.1 Existe index.js ou index.ts?

**Resposta:** ❌ **NÃO EXISTE**

**Caminho Verificado:**
- `goldeouro-mobile/index.js` → ❌ Não existe
- `goldeouro-mobile/index.ts` → ❌ Não existe
- `goldeouro-mobile/index.tsx` → ❌ Não existe

### 2.2 Existe chamada explícita para AppRegistry?

**Resposta:** ❌ **NÃO EXISTE**

**Verificação:**
- `App.js` → Não contém `AppRegistry.registerComponent`
- Nenhum arquivo no projeto contém `AppRegistry`
- Nenhum arquivo contém `registerRootComponent`

### 2.3 package.json → "main" aponta para qual path?

**Resposta:** `"main": "App.js"`

**Caminho Exato:**
```json
// package.json linha 5
"main": "App.js"
```

**Problema Crítico:**
- `package.json` aponta para `App.js`
- Mas `App.js` **NÃO registra o componente no AppRegistry**
- Em produção, sem `index.js`, o React Native não sabe qual componente renderizar

### 2.4 Confirmação de Compatibilidade

**Status:** ❌ **INCOMPATÍVEL**

- Arquitetura: Tradicional (App.js)
- Entrypoint: `App.js` (mas não registrado)
- Falta: `index.js` para registrar o componente

---

## ✅ ETAPA 3 — EXPORTAÇÃO DO COMPONENTE PRINCIPAL

### 3.1 Arquivo Responsável

**Arquivo:** `goldeouro-mobile/App.js`

### 3.2 Tipo de Exportação

**Resposta:** ✅ `export default`

**Código:**
```javascript
// App.js linha 61
export default function App() {
  return (
    <AuthProvider>
      <PaperProvider>
        <NavigationContainer>
          {/* ... */}
        </NavigationContainer>
      </PaperProvider>
    </AuthProvider>
  );
}
```

### 3.3 Componente Raiz Válido

**Status:** ✅ **SIM**

- Existe apenas um componente raiz (`App`)
- Exportado corretamente como `export default`
- **MAS:** Não está registrado no AppRegistry

---

## ✅ ETAPA 4 — CONFLITOS E ARMADILHAS CLÁSSICAS

### 4.1 Uso Simultâneo de expo-router + App.tsx

**Status:** ✅ **CONFIRMADO**

- `app.json` tem plugin `expo-router`
- `package.json` tem dependência `expo-router`
- Mas estrutura é tradicional (`App.js` + `@react-navigation`)
- **CONFLITO:** Expo tenta usar expo-router mas estrutura não existe

### 4.2 App.tsx Existente mas Não Utilizado

**Status:** ❌ **NÃO APLICA**

- `App.js` existe e é usado como main
- Mas não está registrado no AppRegistry

### 4.3 app/ Folder Incompleto

**Status:** ✅ **CONFIRMADO**

- Pasta `app/` **NÃO EXISTE**
- Plugin `expo-router` espera essa pasta
- Causa conflito no build

### 4.4 Imports Quebrando em Produção

**Status:** ⚠️ **POSSÍVEL**

- Todos os imports parecem corretos
- Mas sem registro no AppRegistry, nada funciona

### 4.5 Código Condicional Baseado em __DEV__

**Status:** ❌ **NÃO ENCONTRADO**

- Nenhum código condicional baseado em `__DEV__` encontrado

### 4.6 Erros Silenciosos Impedindo AppRegistry.registerComponent

**Status:** ✅ **CONFIRMADO**

- **CAUSA RAIZ:** `App.js` nunca chama `AppRegistry.registerComponent`
- Em dev, Expo CLI cria entrypoint temporário automaticamente
- Em produção, esse entrypoint não existe

---

## ✅ ETAPA 5 — VEREDITO TÉCNICO

### 🔥 Causa Raiz Exata do Erro

**CAUSA:** Falta de arquivo `index.js` que registre o componente `App` no `AppRegistry`.

**Detalhamento:**
1. `package.json` aponta `"main": "App.js"`
2. `App.js` exporta o componente mas **não o registra**
3. Em dev, Expo CLI cria `index.js` temporário automaticamente
4. Em produção (APK), esse `index.js` não existe
5. React Native não encontra componente registrado → erro

### 📍 Arquivo(s) Responsáveis

**Arquivos Faltantes:**
- ❌ `goldeouro-mobile/index.js` (NÃO EXISTE - CRÍTICO)

**Arquivos com Problemas:**
- ⚠️ `goldeouro-mobile/app.json` (plugin expo-router não utilizado)
- ⚠️ `goldeouro-mobile/package.json` (dependência expo-router não utilizada)

**Arquivo Correto:**
- ✅ `goldeouro-mobile/App.js` (componente correto, mas não registrado)

### ⚠️ Por Que Funciona em Dev e Quebra no APK

**Em Dev (expo start):**
1. Expo CLI detecta `package.json` → `"main": "App.js"`
2. Expo CLI cria automaticamente um `index.js` temporário que:
   ```javascript
   import { registerRootComponent } from 'expo';
   import App from './App';
   registerRootComponent(App);
   ```
3. Metro bundler usa esse `index.js` temporário
4. App funciona normalmente

**Em Produção (APK):**
1. EAS Build compila o projeto
2. Não há `index.js` explícito no projeto
3. Expo não cria entrypoint temporário em builds de produção
4. React Native tenta encontrar componente registrado
5. Não encontra → `Invariant Violation: "main" has not been registered`

### 🔥 Impacto Real no Build de Produção

**Impacto:** 🔴 **CRÍTICO**

- App não inicia em produção
- Erro ocorre antes de qualquer código executar
- Usuário vê tela de erro imediatamente
- Impossível usar o app

---

## 🛠️ ETAPA 6 — CORREÇÃO DEFINITIVA

### Arquivo 1: `index.js` (CRIAR)

**Caminho:** `goldeouro-mobile/index.js`

**Conteúdo Completo:**
```javascript
import { registerRootComponent } from 'expo';
import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
```

### Arquivo 2: `app.json` (CORRIGIR)

**Remover plugin expo-router não utilizado:**

```json
{
  "expo": {
    "name": "Gol de Ouro",
    "slug": "gol-de-ouro-mobile",
    "version": "2.0.0",
    "orientation": "portrait",
    "userInterfaceStyle": "light",
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.goldeouro.mobile"
    },
    "android": {
      "package": "com.goldeouro.app",
      "versionCode": 1,
      "permissions": [
        "android.permission.RECORD_AUDIO",
        "android.permission.CAMERA"
      ]
    },
    "plugins": [
      "expo-notifications",
      [
        "expo-image-picker",
        {
          "photosPermission": "O app precisa acessar suas fotos para permitir upload de foto de perfil."
        }
      ],
      [
        "expo-camera",
        {
          "cameraPermission": "O app precisa acessar a câmera para permitir fotos de perfil."
        }
      ]
    ],
    "extra": {
      "eas": {
        "projectId": "bc110919-1e7f-4ec7-b877-d30a80a7b496"
      }
    }
  }
}
```

**Mudanças:**
- ❌ Removido: `"expo-router"` da linha 24
- ❌ Removido: `"extra.router"` (linhas 39-42)

### Arquivo 3: `package.json` (OPCIONAL - Limpeza)

**Remover dependência não utilizada (opcional):**

```json
{
  "name": "gol-de-ouro-mobile",
  "version": "2.0.0",
  "description": "Gol de Ouro - Mobile App",
  "main": "index.js",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "build:android": "eas build --platform android",
    "build:ios": "eas build --platform ios",
    "build:all": "eas build --platform all",
    "submit:android": "eas submit --platform android",
    "submit:ios": "eas submit --platform ios"
  },
  "dependencies": {
    "@expo/vector-icons": "^14.0.2",
    "@react-native-async-storage/async-storage": "1.23.1",
    "@react-navigation/bottom-tabs": "^7.8.12",
    "@react-navigation/native": "^7.1.25",
    "@react-navigation/stack": "^7.6.12",
    "axios": "^1.6.7",
    "expo": "~51.0.0",
    "expo-av": "~14.0.7",
    "expo-blur": "~13.0.2",
    "expo-camera": "~15.0.16",
    "expo-constants": "~16.0.2",
    "expo-crypto": "~13.0.2",
    "expo-device": "~6.0.2",
    "expo-font": "~12.0.9",
    "expo-haptics": "~13.0.1",
    "expo-image-picker": "~15.1.0",
    "expo-linear-gradient": "~13.0.2",
    "expo-linking": "~6.3.1",
    "expo-notifications": "~0.28.9",
    "expo-secure-store": "~13.0.2",
    "expo-splash-screen": "~0.27.5",
    "expo-status-bar": "~1.12.1",
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "react-native": "0.74.5",
    "react-native-gesture-handler": "~2.16.1",
    "react-native-paper": "^5.12.3",
    "react-native-reanimated": "~3.10.1",
    "react-native-safe-area-context": "4.10.5",
    "react-native-screens": "3.31.1",
    "react-native-svg": "15.2.0",
    "react-native-vector-icons": "^10.0.3",
    "react-native-web": "~0.19.10"
  },
  "devDependencies": {
    "@babel/core": "^7.20.0",
    "@types/react": "~18.2.45",
    "metro": "^0.80.9",
    "typescript": "~5.3.3"
  },
  "private": true
}
```

**Mudanças:**
- ✅ Alterado: `"main": "App.js"` → `"main": "index.js"`
- ❌ Removido: `"expo-router": "~3.5.23"` (opcional, mas recomendado)

### Checklist Final de Validação

#### 1. Limpeza
```bash
cd goldeouro-mobile
rm -rf node_modules
rm -rf .expo
rm package-lock.json
npm install
```

#### 2. Verificação
```bash
# Verificar que index.js existe
ls -la index.js

# Verificar conteúdo
cat index.js
```

#### 3. Teste Local
```bash
# Limpar cache do Metro
npx expo start --clear

# Testar em dispositivo/emulador
npx expo start --android
```

#### 4. Build EAS
```bash
# Build de produção
eas build --platform android --profile production

# OU build preview para teste rápido
eas build --platform android --profile preview
```

---

## 🧪 ETAPA 7 — GARANTIA DE NÃO REGRESSÃO

### Por Que o Erro Não Pode Mais Ocorrer

1. **Entrypoint Explícito:**
   - `index.js` existe e registra o componente explicitamente
   - Não depende mais de criação automática do Expo CLI

2. **Compatibilidade Garantida:**
   - `package.json` → `"main": "index.js"` aponta para arquivo existente
   - `index.js` → `registerRootComponent(App)` registra corretamente
   - `App.js` → Componente exportado corretamente

3. **Conflitos Removidos:**
   - Plugin `expo-router` removido (não utilizado)
   - Dependência `expo-router` removida (opcional)
   - Estrutura consistente com arquitetura tradicional

### Como Garantir que Novos Builds Não Quebrem

1. **Validação Pré-Build:**
   ```bash
   # Verificar que index.js existe
   test -f index.js && echo "✅ index.js existe" || echo "❌ index.js não encontrado"
   
   # Verificar que App.js existe
   test -f App.js && echo "✅ App.js existe" || echo "❌ App.js não encontrado"
   
   # Verificar conteúdo do index.js
   grep -q "registerRootComponent" index.js && echo "✅ registerRootComponent encontrado" || echo "❌ registerRootComponent não encontrado"
   ```

2. **Teste Local Antes de Build:**
   ```bash
   # Sempre testar localmente primeiro
   npx expo start --clear
   # Verificar que app abre corretamente
   ```

3. **CI/CD Check (Opcional):**
   ```yaml
   # .github/workflows/build-check.yml
   - name: Verificar entrypoint
     run: |
       test -f index.js || exit 1
       grep -q "registerRootComponent" index.js || exit 1
   ```

### Boas Práticas Específicas para Expo + EAS

1. **Sempre ter `index.js` explícito:**
   - Não depender de criação automática do Expo CLI
   - Garantir compatibilidade com builds de produção

2. **Manter `package.json` → `"main"` atualizado:**
   - Se mudar entrypoint, atualizar `package.json`
   - Validar que arquivo existe

3. **Evitar conflitos de arquitetura:**
   - Não misturar expo-router com arquitetura tradicional
   - Se usar expo-router, ter estrutura `app/` completa
   - Se usar tradicional, não ter plugin expo-router

4. **Testar builds de produção regularmente:**
   - Não confiar apenas em dev
   - Testar APK/IPA antes de release

---

## 📊 RESUMO EXECUTIVO

### Problema Identificado
- ❌ Falta `index.js` que registre o componente no AppRegistry
- ⚠️ Conflito: plugin `expo-router` configurado mas não utilizado
- ⚠️ `package.json` → `"main"` aponta para `App.js` (mas deveria apontar para `index.js`)

### Solução Aplicada
- ✅ Criar `index.js` com `registerRootComponent(App)`
- ✅ Remover plugin `expo-router` do `app.json`
- ✅ Atualizar `package.json` → `"main": "index.js"`

### Resultado Esperado
- ✅ App abre corretamente no APK
- ✅ Componente registrado corretamente
- ✅ Pronto para produção real

---

**Auditoria realizada em:** 2025-01-24  
**Status:** ✅ CAUSA RAIZ IDENTIFICADA | 🔧 CORREÇÃO DISPONÍVEL  
**Próximo Passo:** Aplicar correções e rebuild APK

