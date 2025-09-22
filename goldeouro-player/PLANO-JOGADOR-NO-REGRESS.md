# 🛡️ PLANO ANTI-REGRESSÃO - MODO JOGADOR

**Data:** 21 de Setembro de 2025 - 23:50:00  
**Status:** ⏳ **AGUARDANDO APROVAÇÃO**  
**Objetivo:** Blindagem total do Modo Jogador sem regressão  
**Foco:** Apenas Modo Jogador (não tocar no Painel Admin)

---

## 📋 **RESUMO EXECUTIVO**

| Categoria | Patches | Arquivos Afetados | Risco | Prioridade |
|-----------|---------|-------------------|-------|------------|
| **Isolamento de Ambientes** | 4 | 3 | 🟡 MÉDIO | 🔴 CRÍTICO |
| **API Client Único** | 2 | 2 | 🟢 BAIXO | 🔴 CRÍTICO |
| **UI Never-Throw** | 6 | 8 | 🟡 MÉDIO | 🟡 ALTO |
| **Testes de Fluxo** | 3 | 5 | 🟢 BAIXO | 🟡 ALTO |
| **Compatibilidade Backend** | 2 | 3 | 🟢 BAIXO | 🟢 MÉDIO |

**TOTAL:** 17 patches em 21 arquivos

---

## 1. 🌍 **ISOLAMENTO DE AMBIENTES**

### **PATCH 1.1: Configuração de Ambientes por Canal**

**Arquivo:** `src/config/environments.js` (NOVO)

```javascript
// Configuração de Ambientes - Gol de Ouro Player
const environments = {
  development: {
    API_BASE_URL: 'http://192.168.1.100:3000', // IP local do desenvolvedor
    USE_MOCKS: true,
    USE_SANDBOX: true,
    LOG_LEVEL: 'debug'
  },
  staging: {
    API_BASE_URL: 'https://api.staging.goldeouro.lol',
    USE_MOCKS: false,
    USE_SANDBOX: true,
    LOG_LEVEL: 'info'
  },
  production: {
    API_BASE_URL: 'https://api.goldeouro.lol',
    USE_MOCKS: false,
    USE_SANDBOX: false,
    LOG_LEVEL: 'error'
  }
};

// Detectar ambiente atual
const getCurrentEnvironment = () => {
  const env = import.meta.env.VITE_APP_ENV || 'development';
  return environments[env] || environments.development;
};

// Guarda de segurança: erro se mocks em produção
const validateEnvironment = () => {
  const env = getCurrentEnvironment();
  if (!import.meta.env.DEV && env.USE_MOCKS) {
    throw new Error('🚨 CRÍTICO: USE_MOCKS=true em ambiente de produção!');
  }
  return env;
};

export { getCurrentEnvironment, validateEnvironment };
export default getCurrentEnvironment();
```

**Linhas:** 1-35 (arquivo novo)

---

### **PATCH 1.2: Variáveis de Ambiente Expo**

**Arquivo:** `.env.example` (NOVO)

```bash
# Configuração de Ambiente - Gol de Ouro Player
VITE_APP_ENV=development
VITE_API_URL=http://192.168.1.100:3000
VITE_USE_MOCKS=true
VITE_USE_SANDBOX=true
VITE_LOG_LEVEL=debug
```

**Linhas:** 1-6 (arquivo novo)

---

### **PATCH 1.3: Atualizar API Config**

**Arquivo:** `src/config/api.js`

**ANTES (linhas 1-4):**
```javascript
// Configuração da API - Gol de Ouro Player
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://goldeouro-backend.onrender.com';
```

**DEPOIS:**
```javascript
// Configuração da API - Gol de Ouro Player
import { validateEnvironment } from './environments.js';

const env = validateEnvironment();
const API_BASE_URL = env.API_BASE_URL;
```

**Linhas:** 1-4 (modificação)

---

### **PATCH 1.4: Remover Config Duplicada**

**Arquivo:** `src/config/env.js`

**AÇÃO:** DELETAR arquivo (substituído por environments.js)

**Linhas:** 1-19 (arquivo completo)

---

## 2. 🔌 **API CLIENT ÚNICO**

### **PATCH 2.1: Cliente API Centralizado**

**Arquivo:** `src/services/apiClient.js` (NOVO)

```javascript
// Cliente API Centralizado - Gol de Ouro Player
import axios from 'axios';
import { validateEnvironment } from '../config/environments.js';

const env = validateEnvironment();

// Configuração do cliente Axios
const apiClient = axios.create({
  baseURL: env.API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Interceptor para autenticação
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para tratamento de erros
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

**Linhas:** 1-40 (arquivo novo)

---

### **PATCH 2.2: Atualizar Serviços para Usar API Client**

**Arquivo:** `src/services/authService.js`

**ANTES (linhas 1-5):**
```javascript
import { API_ENDPOINTS } from '../config/api'

export const authService = {
  login: async (email, password) => {
    try {
      const response = await fetch(API_ENDPOINTS.LOGIN, {
```

**DEPOIS:**
```javascript
import apiClient from './apiClient.js'
import { API_ENDPOINTS } from '../config/api'

export const authService = {
  login: async (email, password) => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.LOGIN, {
```

**Linhas:** 1-5 (modificação)

---

## 3. 🎨 **UI NEVER-THROW**

### **PATCH 3.1: ErrorBoundary Global**

**Arquivo:** `src/components/ErrorBoundary.jsx` (NOVO)

```javascript
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🚨 ErrorBoundary capturou erro:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <div className="text-center p-8">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-white mb-4">
              Ops! Algo deu errado
            </h1>
            <p className="text-gray-300 mb-6">
              O aplicativo encontrou um erro inesperado.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-yellow-500 text-black px-6 py-2 rounded-lg font-medium hover:bg-yellow-600"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

**Linhas:** 1-45 (arquivo novo)

---

### **PATCH 3.2: Wrapper de Loading/Error**

**Arquivo:** `src/components/AsyncWrapper.jsx` (NOVO)

```javascript
import React from 'react';

const AsyncWrapper = ({ 
  loading = false, 
  error = null, 
  empty = false, 
  emptyMessage = 'Nenhum item encontrado',
  children 
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
        <span className="ml-3 text-white">Carregando...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <div className="text-red-500 text-4xl mb-4">❌</div>
        <p className="text-red-300 mb-4">Erro ao carregar dados</p>
        <p className="text-gray-400 text-sm">{error.message}</p>
      </div>
    );
  }

  if (empty) {
    return (
      <div className="text-center p-8">
        <div className="text-gray-500 text-4xl mb-4">📭</div>
        <p className="text-gray-300">{emptyMessage}</p>
      </div>
    );
  }

  return children;
};

export default AsyncWrapper;
```

**Linhas:** 1-40 (arquivo novo)

---

### **PATCH 3.3: Atualizar App.jsx com ErrorBoundary**

**Arquivo:** `src/App.jsx`

**ANTES (linhas 17-20):**
```javascript
function App() {
  return (
    <SidebarProvider>
      <Router>
        <div className="min-h-screen bg-slate-900">
```

**DEPOIS:**
```javascript
import ErrorBoundary from './components/ErrorBoundary'

function App() {
  return (
    <ErrorBoundary>
      <SidebarProvider>
        <Router>
          <div className="min-h-screen bg-slate-900">
```

**Linhas:** 1, 17-20 (modificação)

---

### **PATCH 3.4: Atualizar Dashboard com AsyncWrapper**

**Arquivo:** `src/pages/Dashboard.jsx`

**ANTES (linhas 8-16):**
```javascript
const [balance] = useState(150.00)
const recentBets = [
  { id: 1, amount: 10.00, result: 'Ganhou', date: '2024-01-15', prize: 15.00 },
  { id: 2, amount: 5.00, result: 'Perdeu', date: '2024-01-14', prize: 0.00 },
  { id: 3, amount: 20.00, result: 'Ganhou', date: '2024-01-13', prize: 30.00 },
]
```

**DEPOIS:**
```javascript
import AsyncWrapper from '../components/AsyncWrapper'

const [balance, setBalance] = useState(null)
const [recentBets, setRecentBets] = useState([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState(null)

// Verificar se recentBets é array
const safeRecentBets = Array.isArray(recentBets) ? recentBets : []
```

**Linhas:** 1, 8-16 (modificação)

---

### **PATCH 3.5: Atualizar Login com Loading States**

**Arquivo:** `src/pages/Login.jsx`

**ANTES (linhas 28-30):**
```javascript
const handleSubmit = (e) => {
  e.preventDefault()
  // Simular login
```

**DEPOIS:**
```javascript
const [loading, setLoading] = useState(false)
const [error, setError] = useState(null)

const handleSubmit = async (e) => {
  e.preventDefault()
  setLoading(true)
  setError(null)
  
  try {
    // Implementar login real
    await authService.login(formData.email, formData.password)
  } catch (err) {
    setError(err.message)
  } finally {
    setLoading(false)
  }
```

**Linhas:** 28-30 (modificação)

---

### **PATCH 3.6: Atualizar GameShoot com Error Handling**

**Arquivo:** `src/pages/GameShoot.jsx`

**ANTES (linha 1):**
```javascript
import React, { useEffect, useMemo, useState, useRef } from "react";
```

**DEPOIS:**
```javascript
import React, { useEffect, useMemo, useState, useRef } from "react";
import AsyncWrapper from '../components/AsyncWrapper'

// Adicionar estados de erro
const [gameError, setGameError] = useState(null)
const [gameLoading, setGameLoading] = useState(false)
```

**Linhas:** 1, 30-32 (modificação)

---

## 4. 🧪 **TESTES DE FLUXO**

### **PATCH 4.1: Configuração Maestro**

**Arquivo:** `maestro.yaml` (NOVO)

```yaml
# Configuração Maestro - Gol de Ouro Player
appId: com.goldeouro.player
---
# Fluxo de Login
- launchApp
- tapOn: "Entrar"
- inputText: "test@example.com"
- tapOn: "Senha"
- inputText: "password123"
- tapOn: "Entrar"
- assertVisible: "Dashboard"
```

**Linhas:** 1-12 (arquivo novo)

---

### **PATCH 4.2: Fluxo de Jogo**

**Arquivo:** `flows/jogo.yaml` (NOVO)

```yaml
# Fluxo de Jogo - Gol de Ouro Player
- launchApp
- tapOn: "Entrar"
- inputText: "test@example.com"
- inputText: "password123"
- tapOn: "Entrar"
- tapOn: "Jogar"
- assertVisible: "Zona de Chute"
- tapOn: "Chutar"
- assertVisible: "Resultado"
```

**Linhas:** 1-11 (arquivo novo)

---

### **PATCH 4.3: Fluxo de Saque**

**Arquivo:** `flows/saque.yaml` (NOVO)

```yaml
# Fluxo de Saque - Gol de Ouro Player
- launchApp
- tapOn: "Entrar"
- inputText: "test@example.com"
- inputText: "password123"
- tapOn: "Entrar"
- tapOn: "Saque"
- assertVisible: "Valor do Saque"
- inputText: "50"
- tapOn: "Solicitar Saque"
- assertVisible: "Saque Solicitado"
```

**Linhas:** 1-12 (arquivo novo)

---

### **PATCH 4.4: Script de Testes**

**Arquivo:** `scripts/test-flows.sh` (NOVO)

```bash
#!/bin/bash
# Script de Testes de Fluxo - Gol de Ouro Player

echo "🧪 Executando testes de fluxo..."

# Teste de Login
maestro test flows/login.yaml

# Teste de Jogo
maestro test flows/jogo.yaml

# Teste de Saque
maestro test flows/saque.yaml

echo "✅ Testes concluídos!"
```

**Linhas:** 1-12 (arquivo novo)

---

### **PATCH 4.5: Atualizar package.json**

**Arquivo:** `package.json`

**ANTES (linhas 6-15):**
```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage",
  "test:e2e": "cypress run",
  "test:e2e:open": "cypress open",
  "test:all": "npm run test && npm run test:e2e"
}
```

**DEPOIS:**
```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage",
  "test:e2e": "cypress run",
  "test:e2e:open": "cypress open",
  "test:flows": "bash scripts/test-flows.sh",
  "test:all": "npm run test && npm run test:e2e && npm run test:flows"
}
```

**Linhas:** 6-15 (modificação)

---

## 5. 🔄 **COMPATIBILIDADE COM BACKEND**

### **PATCH 5.1: Handshake de Versão**

**Arquivo:** `src/services/versionService.js` (NOVO)

```javascript
// Serviço de Compatibilidade de Versão - Gol de Ouro Player
import apiClient from './apiClient.js';

const VERSION_CHECK_ENDPOINT = '/meta';

export const versionService = {
  checkCompatibility: async () => {
    try {
      const response = await apiClient.get(VERSION_CHECK_ENDPOINT);
      const { minClientVersion, currentVersion } = response.data;
      
      const clientVersion = '1.0.0'; // Versão atual do app
      
      if (isVersionBelow(clientVersion, minClientVersion)) {
        return {
          needsUpdate: true,
          minVersion: minClientVersion,
          currentVersion: clientVersion
        };
      }
      
      return { needsUpdate: false };
    } catch (error) {
      console.warn('⚠️ Não foi possível verificar compatibilidade:', error);
      return { needsUpdate: false };
    }
  }
};

// Função auxiliar para comparar versões
const isVersionBelow = (current, minimum) => {
  const currentParts = current.split('.').map(Number);
  const minimumParts = minimum.split('.').map(Number);
  
  for (let i = 0; i < Math.max(currentParts.length, minimumParts.length); i++) {
    const currentPart = currentParts[i] || 0;
    const minimumPart = minimumParts[i] || 0;
    
    if (currentPart < minimumPart) return true;
    if (currentPart > minimumPart) return false;
  }
  
  return false;
};
```

**Linhas:** 1-40 (arquivo novo)

---

### **PATCH 5.2: Tela de Atualização**

**Arquivo:** `src/components/UpdateRequired.jsx` (NOVO)

```javascript
import React from 'react';

const UpdateRequired = ({ minVersion, currentVersion }) => {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center p-8 max-w-md">
        <div className="text-yellow-500 text-6xl mb-4">🔄</div>
        <h1 className="text-2xl font-bold text-white mb-4">
          Atualização Necessária
        </h1>
        <p className="text-gray-300 mb-4">
          Uma nova versão do aplicativo está disponível.
        </p>
        <div className="bg-slate-800 p-4 rounded-lg mb-6">
          <p className="text-sm text-gray-400">
            Versão atual: <span className="text-red-400">{currentVersion}</span>
          </p>
          <p className="text-sm text-gray-400">
            Versão mínima: <span className="text-green-400">{minVersion}</span>
          </p>
        </div>
        <button
          onClick={() => {
            // Implementar lógica de atualização
            window.location.href = 'https://play.google.com/store/apps/details?id=com.goldeouro.player';
          }}
          className="bg-yellow-500 text-black px-6 py-3 rounded-lg font-medium hover:bg-yellow-600 w-full"
        >
          Atualizar Agora
        </button>
      </div>
    </div>
  );
};

export default UpdateRequired;
```

**Linhas:** 1-35 (arquivo novo)

---

### **PATCH 5.3: Integrar Verificação no App**

**Arquivo:** `src/App.jsx`

**ANTES (linhas 17-20):**
```javascript
function App() {
  return (
    <ErrorBoundary>
      <SidebarProvider>
```

**DEPOIS:**
```javascript
import { useEffect, useState } from 'react'
import { versionService } from './services/versionService'
import UpdateRequired from './components/UpdateRequired'

function App() {
  const [versionCheck, setVersionCheck] = useState({ loading: true, needsUpdate: false })
  
  useEffect(() => {
    const checkVersion = async () => {
      const result = await versionService.checkCompatibility()
      setVersionCheck({ loading: false, ...result })
    }
    checkVersion()
  }, [])
  
  if (versionCheck.loading) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
    </div>
  }
  
  if (versionCheck.needsUpdate) {
    return <UpdateRequired 
      minVersion={versionCheck.minVersion}
      currentVersion={versionCheck.currentVersion}
    />
  }
  
  return (
    <ErrorBoundary>
      <SidebarProvider>
```

**Linhas:** 1, 17-20 (modificação)

---

## 📊 **RESUMO DOS PATCHES**

### **Arquivos Novos (8):**
1. `src/config/environments.js`
2. `.env.example`
3. `src/services/apiClient.js`
4. `src/components/ErrorBoundary.jsx`
5. `src/components/AsyncWrapper.jsx`
6. `maestro.yaml`
7. `flows/jogo.yaml`
8. `flows/saque.yaml`
9. `scripts/test-flows.sh`
10. `src/services/versionService.js`
11. `src/components/UpdateRequired.jsx`

### **Arquivos Modificados (10):**
1. `src/config/api.js` (linhas 1-4)
2. `src/App.jsx` (linhas 1, 17-20)
3. `src/services/authService.js` (linhas 1-5)
4. `src/pages/Dashboard.jsx` (linhas 1, 8-16)
5. `src/pages/Login.jsx` (linhas 28-30)
6. `src/pages/GameShoot.jsx` (linhas 1, 30-32)
7. `package.json` (linhas 6-15)

### **Arquivos Deletados (1):**
1. `src/config/env.js` (arquivo completo)

---

## 🎯 **VALIDAÇÃO PÓS-APLICAÇÃO**

### **Ambiente Local (Dev):**
- ✅ `EXPO_PUBLIC_USE_MOCKS=true`
- ✅ `EXPO_PUBLIC_USE_SANDBOX=true`
- ✅ API local funcionando
- ✅ Mocks ativos

### **Ambiente Staging:**
- ✅ `EXPO_PUBLIC_USE_MOCKS=false`
- ✅ `EXPO_PUBLIC_USE_SANDBOX=true`
- ✅ API staging funcionando
- ✅ Dados reais com sandbox

### **Ambiente Produção:**
- ✅ `EXPO_PUBLIC_USE_MOCKS=false`
- ✅ `EXPO_PUBLIC_USE_SANDBOX=false`
- ✅ API produção funcionando
- ✅ Dados reais apenas

---

## ⚠️ **RISCOS IDENTIFICADOS**

### **🟡 MÉDIO RISCO:**
- **Mudança de API Client:** Pode quebrar serviços existentes
- **ErrorBoundary:** Pode mascarar erros de desenvolvimento

### **🟢 BAIXO RISCO:**
- **Configuração de ambientes:** Isolamento total
- **Testes de fluxo:** Não afeta funcionalidade
- **Handshake de versão:** Opcional

---

## 🚀 **PRÓXIMOS PASSOS**

1. **Aguardar aprovação** deste plano
2. **Criar branch** `fix/jogador-no-regress`
3. **Aplicar patches** aprovados
4. **Testar** em todos os ambientes
5. **Executar** testes de fluxo
6. **Gerar** relatório pós-aplicação

---

**⏳ AGUARDANDO "APROVO APLICAR"**

**🎯 Plano pronto para implementação controlada!**
