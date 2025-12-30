# 🔐 DECISÃO DE AUTENTICAÇÃO ADMIN

**Data:** 17/11/2025  
**Status:** ✅ **DECISÃO TOMADA**

---

## 📋 SISTEMA ATUAL DO BACKEND

### Autenticação Admin:
- **Método:** Token fixo via header `x-admin-token`
- **Valor:** `process.env.ADMIN_TOKEN` (token fixo, não JWT)
- **Middleware:** `authAdminToken` em `middlewares/authMiddleware.js`
- **Rotas:** Todas as rotas `/api/admin/*` usam este middleware

### Endpoints Admin Disponíveis:
```
GET /api/admin/stats
GET /api/admin/game-stats
GET /api/admin/users
GET /api/admin/financial-report
GET /api/admin/top-players
GET /api/admin/recent-transactions
GET /api/admin/recent-shots
GET /api/admin/weekly-report
```

### ❌ NÃO EXISTE:
- `POST /auth/admin/login` - Endpoint não existe no backend
- Sistema JWT para admin - Não implementado

---

## ✅ DECISÃO TOMADA

### Opção Escolhida: **Token Fixo + Login Simples**

**Justificativa:**
1. Backend já usa token fixo
2. Mais simples e seguro para admin
3. Não requer mudanças no backend
4. Compatível com sistema atual

### Implementação:

1. **Login Admin:**
   - Validar credenciais localmente OU
   - Usar credenciais hardcoded para desenvolvimento
   - Gerar token fixo (mesmo valor do backend)
   - Salvar token no localStorage

2. **Requisições:**
   - Adicionar header `x-admin-token` com token fixo
   - Token vem de `process.env.ADMIN_TOKEN` (backend)
   - Frontend deve usar mesmo token

3. **Segurança:**
   - Token fixo é seguro porque:
     - Apenas admin tem acesso
     - Token não expira (mas pode ser revogado mudando env var)
     - Backend valida token em cada requisição

---

## 🛠️ IMPLEMENTAÇÃO

### 1. Configurar Token Fixo

**Arquivo:** `src/config/env.js`

```javascript
export const getAdminToken = () => {
  // Em produção, usar token do backend (mesmo valor de ADMIN_TOKEN)
  // Em desenvolvimento, usar token de desenvolvimento
  if (window.location.hostname === 'localhost') {
    return 'goldeouro123'; // Token de desenvolvimento
  }
  // Em produção, token deve vir de variável de ambiente ou config
  return process.env.VITE_ADMIN_TOKEN || 'goldeouro123';
};
```

### 2. Atualizar api.js

**Arquivo:** `src/services/api.js`

```javascript
import axios from 'axios';
import { getApiUrl, getAdminToken } from '../config/env';

const api = axios.create({
  baseURL: getApiUrl(),
  timeout: 30000, // 30 segundos
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de requisição - adicionar token admin
api.interceptors.request.use(
  (config) => {
    const token = getAdminToken();
    if (token) {
      config.headers['x-admin-token'] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de resposta - tratar erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Token inválido ou sem permissão
      localStorage.removeItem('admin-token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export { api };
export default api;
```

### 3. Simplificar Login

**Arquivo:** `src/pages/Login.jsx`

- Validar senha localmente
- Se válida, salvar flag de autenticação
- Não precisa chamar backend (token fixo)

---

**Status:** ✅ **DECISÃO TOMADA - PRONTO PARA IMPLEMENTAR**

