# 🚨 FASE 3 — BLOCO C1: CORREÇÃO CRÍTICA DO CACHE
## Problema: Cache do Ambiente Persistindo URL Incorreta

**Data:** 19/12/2025  
**Hora:** 19:35:00  
**Status:** ✅ **CORREÇÃO CRÍTICA APLICADA**

---

## 🎯 PROBLEMA IDENTIFICADO

O sistema ainda está usando `goldeouro-backend.fly.dev` mesmo após correção e deploy.

**Evidências:**
```
baseURL: 'https://goldeouro-backend.fly.dev'
GET https://goldeouro-backend.fly.dev/meta net::ERR_NAME_NOT_RESOLVED
POST https://goldeouro-backend.fly.dev/auth/login net::ERR_NAME_NOT_RESOLVED
```

---

## 🔍 CAUSA RAIZ

### **Problema 1: Cache do Ambiente Persistindo**

O `apiClient` é criado uma vez quando o módulo é carregado:
```javascript
const env = getCurrentEnvironment(); // Executado UMA VEZ
const apiClient = axios.create({
  baseURL: env.API_BASE_URL // Usa valor do cache
});
```

Se o ambiente foi detectado incorretamente na primeira vez (por causa do cache), ele permanece incorreto.

---

### **Problema 2: Cache Não É Invalidado**

O cache do ambiente pode persistir mesmo após correção se:
- O cache foi criado antes da correção
- O cache não é invalidado quando detecta backend antigo
- O `sessionStorage` pode estar persistindo flags incorretas

---

## ✅ CORREÇÃO APLICADA

### **Correção 1: Função Dinâmica para Obter Ambiente**

**Arquivo:** `goldeouro-player/src/services/apiClient.js`

**Antes:**
```javascript
const env = getCurrentEnvironment(); // Executado uma vez
const apiClient = axios.create({
  baseURL: env.API_BASE_URL
});
```

**Depois:**
```javascript
const getEnv = () => {
  const env = getCurrentEnvironment();
  // Forçar produção se estiver em domínio de produção
  const hostname = window.location.hostname;
  if (hostname.includes('goldeouro.lol') || hostname.includes('goldeouro.com') || hostname === 'www.goldeouro.lol') {
    return {
      ...env,
      API_BASE_URL: 'https://goldeouro-backend-v2.fly.dev' // FORÇAR PRODUÇÃO
    };
  }
  return env;
};

const apiClient = axios.create({
  baseURL: getEnv().API_BASE_URL
});
```

---

### **Correção 2: Interceptor Atualiza baseURL Dinamicamente**

**Arquivo:** `goldeouro-player/src/services/apiClient.js`

**Adicionado no interceptor de request:**
```javascript
apiClient.interceptors.request.use(
  (config) => {
    // CORREÇÃO CRÍTICA: Sempre usar ambiente atual dinamicamente
    const currentEnv = getEnv();
    
    // Atualizar baseURL se necessário
    if (!config.baseURL || (config.baseURL.includes('goldeouro-backend.fly.dev') && !config.baseURL.includes('goldeouro-backend-v2.fly.dev'))) {
      config.baseURL = currentEnv.API_BASE_URL;
    }
    
    // CORREÇÃO CRÍTICA: Se URL absoluta contém backend antigo, substituir
    if (config.url.includes('goldeouro-backend.fly.dev') && !config.url.includes('goldeouro-backend-v2.fly.dev')) {
      config.url = config.url.replace('goldeouro-backend.fly.dev', 'goldeouro-backend-v2.fly.dev');
    }
    
    // ... resto do código
  }
);
```

---

### **Correção 3: Invalidar Cache Se Backend Antigo Detectado**

**Arquivo:** `goldeouro-player/src/config/environments.js`

**Adicionado em `getCurrentEnvironment()`:**
```javascript
// CORREÇÃO CRÍTICA: Forçar revalidação em produção para evitar cache incorreto
const hostname = window.location.hostname;
const isProductionDomain = hostname.includes('goldeouro.lol') || 
                           hostname.includes('goldeouro.com') ||
                           hostname === 'www.goldeouro.lol' ||
                           hostname === 'goldeouro.lol';

// Se for produção, ignorar cache se estiver usando backend antigo
if (isProductionDomain && environmentCache && environmentCache.API_BASE_URL && 
    environmentCache.API_BASE_URL.includes('goldeouro-backend.fly.dev') && 
    !environmentCache.API_BASE_URL.includes('goldeouro-backend-v2.fly.dev')) {
  // Cache inválido - forçar revalidação
  environmentCache = null;
  isInitialized = false;
}
```

---

## 📋 PRÓXIMOS PASSOS OBRIGATÓRIOS

### **1. Rebuild do Player**

```bash
cd goldeouro-player
npm run build
```

### **2. Redeploy no Vercel**

```bash
vercel --prod
```

### **3. Limpar Cache do Navegador**

**IMPORTANTE:** Após redeploy, limpar completamente o cache do navegador:

1. Abrir DevTools (F12)
2. Clicar com botão direito no botão de recarregar
3. Selecionar "Esvaziar cache e atualizar forçadamente" (ou "Empty Cache and Hard Reload")
4. OU usar Ctrl+Shift+Delete para limpar cache completamente

### **4. Validar Após Correção**

- ✅ Verificar que backend usado é `goldeouro-backend-v2.fly.dev`
- ✅ Verificar que não há erros `ERR_NAME_NOT_RESOLVED`
- ✅ Testar login
- ✅ Testar criação de PIX

---

## 🚨 VALIDAÇÃO PÓS-CORREÇÃO

### **Checklist:**

- [ ] Rebuild executado sem erros
- [ ] Redeploy executado com sucesso
- [ ] Cache do navegador limpo completamente
- [ ] Acessar `www.goldeouro.lol`
- [ ] Verificar console (F12) - não deve ter erros `ERR_NAME_NOT_RESOLVED`
- [ ] Verificar Network tab - backend deve ser `goldeouro-backend-v2.fly.dev`
- [ ] Testar login
- [ ] Testar criação de PIX

---

## 📊 STATUS

**Correção:** ✅ **APLICADA**  
**Rebuild:** ⏸️ **AGUARDANDO**  
**Redeploy:** ⏸️ **AGUARDANDO**  
**Validação:** ⏸️ **AGUARDANDO**

---

**Documento criado em:** 2025-12-19T19:35:00.000Z  
**Status:** ✅ **CORREÇÃO CRÍTICA APLICADA - AGUARDANDO REBUILD E REDEPLOY**

