# 🔧 Correção: CORS em Localhost - Backend Forçado em Desenvolvimento

**Data:** 2025-01-24  
**Problema:** Login falhando em `localhost:5173` devido a CORS  
**Causa:** Bootstrap e kill switch estavam forçando backend de produção mesmo em desenvolvimento local

---

## 🔴 Problema Identificado

### Sintomas
- Login falhava com erro de CORS em `localhost:5173`
- Requisições iam diretamente para `https://goldeouro-backend-v2.fly.dev/api/auth/login`
- Proxy do Vite não estava sendo usado
- Console mostrava: `❌ API Response Error: [object Object]`

### Causa Raiz

O `bootstrap.ts` e o kill switch inline no `index.html` estavam forçando o backend de produção (`https://goldeouro-backend-v2.fly.dev`) mesmo quando o aplicativo estava rodando em `localhost:5173`. Isso causava:

1. **CORS:** O backend de produção não permite requisições de `localhost:5173`
2. **Proxy ignorado:** O proxy do Vite (`/api` → `https://goldeouro-backend-v2.fly.dev`) não era usado porque as requisições iam direto para o backend
3. **Login falhando:** Todas as requisições de API falhavam com erro de CORS

---

## ✅ Correções Aplicadas

### 1. `index.html` - Kill Switch Inline

**Antes:**
```javascript
// Forçava backend sempre
sessionStorage.setItem('API_BASE_URL', 'https://goldeouro-backend-v2.fly.dev');
localStorage.setItem('API_BASE_URL', 'https://goldeouro-backend-v2.fly.dev');
window.__API_BASE_URL__ = 'https://goldeouro-backend-v2.fly.dev';
```

**Depois:**
```javascript
// Só força backend se estiver em produção
const isProduction = typeof window !== 'undefined' && (
  window.location.hostname.includes('goldeouro.lol') ||
  window.location.hostname.includes('goldeouro.com') ||
  window.location.hostname === 'www.goldeouro.lol' ||
  window.location.hostname === 'goldeouro.lol'
);

if (isProduction) {
  // Forçar backend de produção
  sessionStorage.setItem('API_BASE_URL', 'https://goldeouro-backend-v2.fly.dev');
  localStorage.setItem('API_BASE_URL', 'https://goldeouro-backend-v2.fly.dev');
  window.__API_BASE_URL__ = 'https://goldeouro-backend-v2.fly.dev';
} else {
  // Em desenvolvimento, usar proxy do Vite
  console.log('[KILL-SW-INLINE] ✅ Modo desenvolvimento - usando proxy do Vite');
}
```

### 2. `environments.js` - Verificação de Ambiente

**Antes:**
```javascript
// Usava backend forçado sempre que __FORCED_BACKEND__ estava definido
if (typeof window !== 'undefined' && window.__FORCED_BACKEND__) {
  const forcedBackend = window.__API_BASE_URL__;
  if (forcedBackend) {
    return { API_BASE_URL: forcedBackend, ... };
  }
}
```

**Depois:**
```javascript
// Só usa backend forçado se estiver em produção
if (typeof window !== 'undefined' && window.__FORCED_BACKEND__) {
  const hostname = window.location.hostname;
  const isProductionDomain = hostname.includes('goldeouro.lol') || 
                             hostname.includes('goldeouro.com') ||
                             hostname === 'www.goldeouro.lol' ||
                             hostname === 'goldeouro.lol';
  
  if (isProductionDomain) {
    // Usar backend forçado
    const forcedBackend = window.__API_BASE_URL__;
    if (forcedBackend) {
      return { API_BASE_URL: forcedBackend, ... };
    }
  } else {
    // Em desenvolvimento, ignorar backend forçado
    console.log('[ENV] Modo desenvolvimento - ignorando backend forçado, usando proxy');
  }
}
```

### 3. `apiClient.js` - Verificação de Ambiente

**Antes:**
```javascript
// Usava backend forçado sempre
if (typeof window !== 'undefined' && window.__FORCED_BACKEND__) {
  const forcedBackend = window.__API_BASE_URL__;
  if (forcedBackend) {
    return { API_BASE_URL: forcedBackend, ... };
  }
}
```

**Depois:**
```javascript
// Só usa backend forçado se estiver em produção
const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
const isProductionDomain = hostname.includes('goldeouro.lol') || 
                           hostname.includes('goldeouro.com') ||
                           hostname === 'www.goldeouro.lol' ||
                           hostname === 'goldeouro.lol';

if (typeof window !== 'undefined' && window.__FORCED_BACKEND__ && isProductionDomain) {
  const forcedBackend = window.__API_BASE_URL__;
  if (forcedBackend) {
    return { API_BASE_URL: forcedBackend, ... };
  }
}

// Em desenvolvimento, usar ambiente normal (que usa proxy)
if (!isProductionDomain) {
  console.log('[API-CLIENT] Modo desenvolvimento - usando proxy do Vite');
  return env;
}
```

### 4. `api.js` - Verificação de Ambiente

**Antes:**
```javascript
// Usava backend forçado sempre
if (typeof window !== 'undefined' && window.__FORCED_BACKEND__) {
  const forcedBackend = window.__API_BASE_URL__;
  if (forcedBackend) {
    API_BASE_URL = forcedBackend;
  }
}
```

**Depois:**
```javascript
// Só usa backend forçado se estiver em produção
if (typeof window !== 'undefined' && window.__FORCED_BACKEND__) {
  const hostname = window.location.hostname;
  const isProductionDomain = hostname.includes('goldeouro.lol') || 
                             hostname.includes('goldeouro.com') ||
                             hostname === 'www.goldeouro.lol' ||
                             hostname === 'goldeouro.lol';
  
  if (isProductionDomain) {
    const forcedBackend = window.__API_BASE_URL__;
    if (forcedBackend) {
      API_BASE_URL = forcedBackend;
    }
  } else {
    console.log('[API] Modo desenvolvimento - ignorando backend forçado, usando proxy');
  }
}
```

---

## 🧪 Validação

### Como Testar

1. **Iniciar servidor Vite:**
   ```powershell
   cd "e:\Chute de Ouro\goldeouro-backend\goldeouro-player"
   npm run dev
   ```

2. **Acessar em modo anônimo:**
   - Abrir navegador em modo anônimo (`Ctrl + Shift + N`)
   - Acessar `http://localhost:5173`

3. **Verificar console:**
   - Deve aparecer: `[KILL-SW-INLINE] ✅ Modo desenvolvimento - usando proxy do Vite`
   - Deve aparecer: `[ENV] Modo desenvolvimento - ignorando backend forçado, usando proxy`
   - Deve aparecer: `[API-CLIENT] Modo desenvolvimento - usando proxy do Vite`

4. **Tentar fazer login:**
   - Email: `free10signer@gmail.com`
   - Senha: `Free10signer`
   - Deve funcionar sem erros de CORS

5. **Verificar Network:**
   - Abrir DevTools (`F12`) → Aba "Network"
   - Tentar fazer login
   - Verificar se as requisições vão para `http://localhost:5173/api/auth/login` (proxy)
   - NÃO deve haver requisições diretas para `https://goldeouro-backend-v2.fly.dev/api/auth/login`

---

## 📋 Checklist de Validação

- [ ] Console mostra logs de modo desenvolvimento
- [ ] Requisições vão para `http://localhost:5173/api/...` (proxy)
- [ ] Login funciona sem erros de CORS
- [ ] Nenhuma requisição direta para `https://goldeouro-backend-v2.fly.dev`
- [ ] Em produção (`www.goldeouro.lol`), backend de produção é usado corretamente

---

## 🎯 Resultado Esperado

### Em Desenvolvimento (`localhost:5173`)
- ✅ Usa proxy do Vite (`/api` → `https://goldeouro-backend-v2.fly.dev`)
- ✅ Não força backend de produção
- ✅ Login funciona sem CORS
- ✅ Todas as requisições passam pelo proxy

### Em Produção (`www.goldeouro.lol`)
- ✅ Força backend de produção (`https://goldeouro-backend-v2.fly.dev`)
- ✅ Não usa proxy
- ✅ Requisições diretas para o backend
- ✅ Blindagem contra backend antigo funciona

---

**Status:** Correção aplicada  
**Arquivos modificados:**
- `goldeouro-player/index.html`
- `goldeouro-player/src/config/environments.js`
- `goldeouro-player/src/services/apiClient.js`
- `goldeouro-player/src/config/api.js`

**Próxima ação:** Testar login em `localhost:5173` e validar que funciona sem CORS



