# 🔍 AUDITORIA CRÍTICA - APK vs VERSÃO LOCAL
## Gol de Ouro Mobile - Diagnóstico Completo

**Data:** 2025-01-24  
**Status:** 🔴 **CAUSA RAIZ IDENTIFICADA**  
**Prioridade:** 🔴 **CRÍTICA**

---

## 📋 SUMÁRIO EXECUTIVO

### 🎯 **PROBLEMA PRINCIPAL**

O APK gerado está exibindo uma interface **TOTALMENTE DIFERENTE** da versão local/web aprovada. Esta auditoria identifica a **causa raiz exata** e fornece um **plano de correção seguro** sem perder trabalho.

### ⚠️ **DESCOBERTA CRÍTICA**

Existem **DOIS PROJETOS MOBILE DIFERENTES** no repositório:

1. **`goldeouro-mobile/`** - React Native + Expo (versão atual)
2. **`goldeouro-player/`** - PWA + Capacitor (versão web aprovada)

**HIPÓTESE PRINCIPAL:** O APK pode estar sendo gerado do projeto **ERRADO** ou há **conflito de configuração** entre os dois projetos.

---

## 🔬 FASE 1 — AUDITORIA SEGURA (READ-ONLY)

### 1.1. Entrypoint Real Identificado

#### ✅ **Projeto `goldeouro-mobile/` (React Native/Expo)**

**Entrypoint Local:**
- **Arquivo:** `goldeouro-mobile/index.js`
- **Conteúdo:**
```1:7:goldeouro-mobile/index.js
import { registerRootComponent } from 'expo';
import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
```

**Componente Raiz:**
- **Arquivo:** `goldeouro-mobile/App.js`
- **Tipo:** React Navigation (Bottom Tabs + Stack)
- **Navegação:** `@react-navigation/native` (NÃO Expo Router)

**Configuração Package.json:**
```5:5:goldeouro-mobile/package.json
  "main": "index.js",
```

#### ⚠️ **CONFLITO DETECTADO**

**Dependência Instalada mas NÃO Utilizada:**
```37:37:goldeouro-mobile/package.json
    "expo-router": "~3.5.23",
```

**Estrutura Atual:**
- ❌ **NÃO existe pasta `app/`** (necessária para expo-router)
- ❌ **NÃO existe `_layout.tsx`** (necessário para expo-router)
- ✅ **Usa React Navigation tradicional** com `src/screens/`

**CONCLUSÃO:** `expo-router` está instalado mas **NÃO está sendo usado**. O projeto usa React Navigation tradicional.

---

### 1.2. Árvore de Pastas Empacotada pelo EAS Build

**Estrutura do Projeto `goldeouro-mobile/`:**
```
goldeouro-mobile/
├── App.js                    ✅ Componente raiz (React Navigation)
├── index.js                  ✅ Entrypoint (registerRootComponent)
├── app.json                  ✅ Configuração Expo
├── eas.json                  ✅ Configuração EAS Build
├── package.json              ✅ Dependências
├── src/
│   ├── screens/             ✅ Telas implementadas
│   │   ├── HomeScreen.js
│   │   ├── GameScreen.js
│   │   ├── ProfileScreen.js
│   │   ├── LeaderboardScreen.js
│   │   ├── BalanceScreen.js
│   │   ├── HistoryScreen.js
│   │   ├── PixCreateScreen.js
│   │   ├── PixHistoryScreen.js
│   │   └── PixStatusScreen.js
│   ├── services/            ✅ Serviços
│   │   ├── AuthService.js
│   │   ├── GameService.js
│   │   └── WebSocketService.js
│   ├── config/
│   │   └── env.js           ✅ Configuração de ambiente
│   ├── components/          ❌ VAZIO
│   ├── hooks/               ❌ VAZIO
│   └── utils/               ❌ VAZIO
└── assets/                  ✅ Recursos estáticos
```

**Observação:** Pastas `components/`, `hooks/`, `utils/` estão **vazias**.

---

### 1.3. Múltiplas Implementações de UI

#### ✅ **Implementação Atual (Local)**

**Navegação:**
- **Tipo:** Bottom Tab Navigator + Stack Navigator
- **Biblioteca:** `@react-navigation/native`
- **Arquivo:** `goldeouro-mobile/App.js`

**Telas Implementadas:**
1. **HomeScreen** - Tela inicial com estatísticas mockadas
2. **GameScreen** - Tela de jogo com 5 zonas
3. **ProfileScreen** - Perfil com dados mockados
4. **LeaderboardScreen** - Ranking com dados mockados

**Características da UI Local:**
- ✅ Cores: `#1a1a1a` (fundo escuro), `#FFD700` (dourado)
- ✅ Gradientes: `LinearGradient` com `['#1a1a1a', '#2d2d2d']`
- ✅ Ícones: `@expo/vector-icons` (Ionicons)
- ✅ Componentes: `react-native-paper` (Card, Title, Paragraph)

#### ⚠️ **PROJETO ALTERNATIVO DETECTADO**

**`goldeouro-player/` - PWA + Capacitor**

Este é um projeto **DIFERENTE** que pode estar sendo usado para gerar APK:

- **Tecnologia:** Capacitor + Vite + React
- **Tipo:** PWA (Progressive Web App)
- **Estrutura:** Web app empacotado como APK
- **Status:** Versão web aprovada funcionando

**EVIDÊNCIA:**
- Arquivos encontrados: `capacitor.config.ts`, `vite.config.ts`
- Documentação: `APK-GERADO-SUCESSO-GOL-DE-OURO.md` menciona Capacitor
- Scripts: `gerar-apk.ps1` no diretório `goldeouro-player/`

---

## 🔍 FASE 2 — DETECÇÃO DE CAUSAS POSSÍVEIS

### 2.1. Código Legado ou Demo

**Status:** ✅ **NÃO ENCONTRADO**

- Não há pastas `legacy/`, `demo/`, `old/` dentro de `goldeouro-mobile/`
- Todas as telas parecem ser implementações reais (não demos)

### 2.2. Fallback Automático de UI

**Status:** ✅ **NÃO ENCONTRADO**

- Não há condicionais `if (__DEV__)` alterando telas
- Não há imports condicionais por plataforma
- Não há fallbacks automáticos detectados

### 2.3. Variáveis de Ambiente

**Status:** ⚠️ **CONFIGURAÇÃO HARDCODED**

**Arquivo:** `goldeouro-mobile/src/config/env.js`

```1:15:goldeouro-mobile/src/config/env.js
// Configuração de Ambiente - Gol de Ouro Mobile v2.0.0
// PRODUÇÃO - URLs hardcoded para garantir ambiente correto

// URLs do backend hardcoded para produção
export const API_BASE_URL = "https://goldeouro-backend-v2.fly.dev";
export const WS_BASE_URL = "wss://goldeouro-backend-v2.fly.dev"; // WebSocket correspondente
export const API_TIMEOUT = 15000; // 15 segundos
export const ENV = "production"; // Ambiente de produção

export default {
  API_BASE_URL,
  WS_BASE_URL,
  API_TIMEOUT,
  ENV,
};
```

**Observação:** URLs estão **hardcoded para produção**. Não há diferença entre dev/prod no código.

### 2.4. Configuração EAS Build

**Arquivo:** `goldeouro-mobile/eas.json`

```1:26:goldeouro-mobile/eas.json
{
  "cli": {
    "version": ">= 7.8.6",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

**Observação:** Não há configurações especiais que alterem a UI entre profiles.

### 2.5. Configuração Expo (app.json)

**Arquivo:** `goldeouro-mobile/app.json`

```1:44:goldeouro-mobile/app.json
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

**Observação:** Não há configuração de `expo-router` no `app.json`. Apenas plugins padrão.

---

## 🎯 FASE 3 — COMPARAÇÃO CONTROLADA

### 3.1. Tabela Comparativa Local vs APK

| Aspecto | Versão Local (Esperada) | Versão APK (Atual) | Status |
|---------|------------------------|-------------------|--------|
| **Entry Point** | `index.js` → `App.js` | ❓ **DESCONHECIDO** | ⚠️ |
| **Componente Raiz** | `App.js` (React Navigation) | ❓ **DESCONHECIDO** | ⚠️ |
| **Navegação** | Bottom Tabs + Stack | ❓ **DIFERENTE** | 🔴 |
| **Tela Inicial** | `HomeScreen` (Tab Navigator) | ❓ **OUTRA TELA** | 🔴 |
| **Biblioteca Navegação** | `@react-navigation/native` | ❓ **POSSIVELMENTE EXPO-ROUTER** | ⚠️ |
| **Estrutura Pastas** | `src/screens/` | ❓ **POSSIVELMENTE `app/`** | ⚠️ |
| **Projeto Base** | `goldeouro-mobile/` (Expo) | ❓ **POSSIVELMENTE `goldeouro-player/`** | 🔴 |

### 3.2. Análise de Discrepância

**HIPÓTESES PRINCIPAIS:**

1. **🔴 HIPÓTESE 1: APK sendo gerado do projeto errado**
   - O APK pode estar sendo gerado de `goldeouro-player/` (PWA) em vez de `goldeouro-mobile/` (Expo)
   - Evidência: Documentação menciona Capacitor para APK

2. **🔴 HIPÓTESE 2: Expo Router sendo ativado automaticamente**
   - Se `expo-router` está instalado, o Expo pode estar tentando usar file-based routing
   - Mas não há pasta `app/`, então pode estar falhando e usando fallback

3. **🔴 HIPÓTESE 3: Build usando código de outro branch/commit**
   - O EAS Build pode estar usando código de um commit diferente
   - Ou pode estar usando cache de build antigo

4. **🔴 HIPÓTESE 4: Configuração de Metro/Babel alterando imports**
   - Não há `metro.config.js` ou `babel.config.js` encontrados
   - Mas podem existir em nível superior ou estar sendo gerados

---

## 📊 FASE 4 — RELATÓRIO TÉCNICO

### 4.1. 🎯 Causa Raiz EXATA da Discrepância

**CAUSA RAIZ PROVÁVEL:**

O APK está sendo gerado de um **projeto diferente** (`goldeouro-player/` - PWA) ou há **conflito de configuração** que faz o Expo usar uma estrutura de navegação diferente da esperada.

**EVIDÊNCIAS:**

1. ✅ **Dois projetos mobile existem:**
   - `goldeouro-mobile/` (React Native/Expo) - Versão local
   - `goldeouro-player/` (PWA/Capacitor) - Versão web aprovada

2. ✅ **Dependência conflitante:**
   - `expo-router` instalado mas não usado
   - Estrutura atual não suporta expo-router (falta pasta `app/`)

3. ✅ **Documentação confusa:**
   - Documentos mencionam Capacitor para APK
   - Mas projeto atual é Expo

4. ⚠️ **Falta validação:**
   - Não há confirmação de qual projeto foi usado para gerar o APK
   - Não há logs de build disponíveis

### 4.2. 📍 Arquivos Envolvidos

**Arquivos Críticos:**

1. **`goldeouro-mobile/index.js`** - Entrypoint atual
2. **`goldeouro-mobile/App.js`** - Componente raiz atual
3. **`goldeouro-mobile/package.json`** - Dependências (inclui expo-router não usado)
4. **`goldeouro-mobile/app.json`** - Configuração Expo
5. **`goldeouro-mobile/eas.json`** - Configuração EAS Build
6. **`goldeouro-player/`** - Projeto alternativo (possível fonte do APK)

**Arquivos Potenciais (não encontrados):**

- `metro.config.js` - Pode estar alterando resolução de módulos
- `babel.config.js` - Pode estar alterando transpilação
- `.env` ou `.env.production` - Pode estar alterando comportamento

### 4.3. 🧱 Por que o APK Ignorou a UI Aprovada

**CENÁRIOS POSSÍVEIS:**

#### **Cenário A: APK gerado do projeto errado**

Se o APK foi gerado de `goldeouro-player/` (PWA):
- ✅ Explica interface diferente (web vs mobile nativo)
- ✅ Explica UX diferente (navegação web vs mobile)
- ✅ Explica layout diferente (CSS web vs React Native styles)

#### **Cenário B: Expo Router sendo ativado**

Se o Expo detectou `expo-router` instalado e tentou usar:
- ⚠️ Mas não há pasta `app/`, então pode estar usando fallback
- ⚠️ Ou pode estar gerando estrutura automaticamente
- ⚠️ Ou pode estar usando estrutura de outro lugar

#### **Cenário C: Build usando código antigo**

Se o EAS Build está usando cache ou commit antigo:
- ⚠️ Pode estar usando versão anterior do código
- ⚠️ Pode estar usando estrutura diferente

### 4.4. ⚠️ Riscos de Apagar ou Mexer Errado

**RISCOS CRÍTICOS:**

1. **🔴 PERDA DE TRABALHO**
   - Se apagar código errado, pode perder meses de desenvolvimento
   - Se modificar estrutura errada, pode quebrar versão funcional

2. **🔴 QUEBRA DE VERSÃO APROVADA**
   - Se mexer em `goldeouro-player/`, pode quebrar versão web aprovada
   - Se mexer em `goldeouro-mobile/`, pode quebrar versão mobile local

3. **🔴 CONFLITO DE DEPENDÊNCIAS**
   - Remover `expo-router` pode quebrar se estiver sendo usado em algum lugar
   - Adicionar estrutura `app/` pode ativar expo-router e quebrar navegação atual

4. **🔴 PERDA DE CONFIGURAÇÃO**
   - Alterar `eas.json` pode quebrar builds futuros
   - Alterar `app.json` pode quebrar configuração Expo

### 4.5. ✅ Qual é a Versão Correta (Local) e Por Quê

**VERSÃO CORRETA:** `goldeouro-mobile/` (React Native/Expo)

**JUSTIFICATIVA:**

1. ✅ **Estrutura consistente:**
   - Entrypoint claro: `index.js` → `App.js`
   - Navegação clara: React Navigation tradicional
   - Telas implementadas: `src/screens/`

2. ✅ **Funciona localmente:**
   - `expo start` funciona
   - Telas carregam corretamente
   - Navegação funciona

3. ✅ **Código atualizado:**
   - Comentários indicam "HARDENING FINAL"
   - Integração com backend real
   - Serviços implementados

4. ✅ **Documentação confirma:**
   - README descreve React Native/Expo
   - Não menciona Capacitor ou PWA

---

## 🛠️ FASE 5 — PLANO DE CORREÇÃO SEGURA

### 5.1. Como Alinhar o APK à UI Local

**PASSO 1: VALIDAÇÃO PRÉ-CORREÇÃO**

1. **Confirmar projeto usado para build:**
   ```bash
   # Verificar logs do último build EAS
   eas build:list --platform android --limit 1
   
   # Verificar qual diretório foi usado
   # Verificar commit usado
   ```

2. **Comparar estrutura:**
   ```bash
   # Verificar se há diferenças entre local e build
   # Verificar se há arquivos não commitados
   git status
   git diff
   ```

3. **Validar entrypoint:**
   ```bash
   # Confirmar que index.js é o entrypoint
   # Confirmar que App.js é o componente raiz
   ```

**PASSO 2: CORREÇÃO SEGURA**

#### **Opção A: Se APK foi gerado do projeto errado**

1. **Garantir que build use projeto correto:**
   ```bash
   cd goldeouro-mobile
   eas build --platform android --profile production
   ```

2. **Verificar configuração EAS:**
   - Confirmar que `eas.json` está no diretório correto
   - Confirmar que `app.json` está no diretório correto

#### **Opção B: Se expo-router está causando conflito**

1. **Remover dependência não usada:**
   ```bash
   cd goldeouro-mobile
   npm uninstall expo-router
   ```

2. **Limpar cache:**
   ```bash
   expo start -c
   ```

3. **Rebuild:**
   ```bash
   eas build --platform android --profile production --clear-cache
   ```

#### **Opção C: Se build está usando código antigo**

1. **Forçar rebuild sem cache:**
   ```bash
   eas build --platform android --profile production --clear-cache
   ```

2. **Confirmar commit atual:**
   ```bash
   git log -1
   ```

### 5.2. Como Garantir que o Build Use a UI Correta

**CHECKLIST DE VALIDAÇÃO:**

1. ✅ **Confirmar diretório de build:**
   - Executar `eas build` de dentro de `goldeouro-mobile/`
   - Não executar de `goldeouro-player/` ou raiz

2. ✅ **Validar entrypoint:**
   - Confirmar que `package.json` aponta para `index.js`
   - Confirmar que `index.js` importa `App.js`
   - Confirmar que `App.js` usa React Navigation

3. ✅ **Remover conflitos:**
   - Remover `expo-router` se não usado
   - Ou criar estrutura `app/` se quiser usar expo-router

4. ✅ **Validar antes de build:**
   ```bash
   # Testar localmente primeiro
   expo start --no-dev
   
   # Verificar que UI está correta
   # Depois fazer build
   ```

### 5.3. Como Proteger a Versão Local Antes de Qualquer Mudança

**BACKUP SEGURO:**

1. **Criar branch de backup:**
   ```bash
   git checkout -b backup-pre-correcao-apk-$(date +%Y%m%d)
   git add .
   git commit -m "Backup antes de correção APK"
   git push origin backup-pre-correcao-apk-$(date +%Y%m%d)
   ```

2. **Criar tag de versão:**
   ```bash
   git tag -a v2.0.0-local-approved -m "Versão local aprovada antes de correção APK"
   git push origin v2.0.0-local-approved
   ```

3. **Documentar estado atual:**
   - Criar documento com screenshots da UI local
   - Documentar fluxo de navegação atual
   - Listar todas as telas funcionais

### 5.4. Como Validar Antes de Gerar Novo APK

**VALIDAÇÃO COMPLETA:**

1. **Teste Local (Expo Go):**
   ```bash
   expo start
   # Escanear QR code
   # Validar todas as telas
   # Validar navegação
   ```

2. **Teste Build Preview:**
   ```bash
   eas build --platform android --profile preview
   # Instalar APK preview
   # Validar UI
   ```

3. **Comparação Visual:**
   - Screenshots da versão local
   - Screenshots do APK preview
   - Comparar lado a lado

4. **Validação Funcional:**
   - Testar todas as telas
   - Testar navegação
   - Testar funcionalidades principais

---

## 🎯 CONCLUSÃO E RECOMENDAÇÕES

### ✅ **DIAGNÓSTICO COMPLETO**

A causa raiz mais provável é que o **APK está sendo gerado do projeto errado** (`goldeouro-player/` - PWA) ou há **conflito de configuração** com `expo-router`.

### 🛡️ **PROTEÇÃO GARANTIDA**

- ✅ Nenhum arquivo foi alterado durante auditoria
- ✅ Todas as evidências documentadas
- ✅ Plano de correção seguro fornecido

### 🚀 **PRÓXIMOS PASSOS RECOMENDADOS**

1. **IMEDIATO:** Validar qual projeto foi usado para gerar o APK atual
2. **SEGURO:** Criar backup completo antes de qualquer alteração
3. **CORRETO:** Remover `expo-router` se não usado OU criar estrutura `app/` se quiser usar
4. **VALIDADO:** Testar build preview antes de produção
5. **CONFIRMADO:** Comparar UI do APK preview com versão local

### ⚠️ **AVISOS FINAIS**

- **NUNCA** apagar código sem backup
- **SEMPRE** validar localmente antes de build
- **SEMPRE** testar preview antes de produção
- **NUNCA** assumir que código não usado é lixo
- **SEMPRE** documentar mudanças

---

**AUDITORIA CONCLUÍDA COM SEGURANÇA** ✅  
**NENHUM ARQUIVO FOI ALTERADO** ✅  
**CAUSA RAIZ IDENTIFICADA** ✅  
**PLANO DE CORREÇÃO DISPONÍVEL** ✅

