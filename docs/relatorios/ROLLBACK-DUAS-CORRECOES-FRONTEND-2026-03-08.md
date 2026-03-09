# ROLLBACK — DUAS CORREÇÕES FRONTEND

**Data:** 2026-03-08  
**Patch a reverter:** [PATCH-DUAS-CORRECOES-FRONTEND-2026-03-08.md](PATCH-DUAS-CORRECOES-FRONTEND-2026-03-08.md)

---

## Instruções de rollback

Reverter **apenas** as duas linhas alteradas pelo patch, nos mesmos arquivos.

### 1. Dashboard.jsx

**Arquivo:** `goldeouro-player/src/pages/Dashboard.jsx`  
**Linha ~55 (dentro de `loadUserData`, no bloco que trata `pixResponse`):**

Trocar:

```javascript
setRecentBets(pixResponse.data.data.payments || [])
```

por:

```javascript
setRecentBets(pixResponse.data.data.historico_pagamentos || [])
```

### 2. AuthContext.jsx

**Arquivo:** `goldeouro-player/src/contexts/AuthContext.jsx`  
**Linha ~36 (no `.then` do `apiClient.get(API_ENDPOINTS.PROFILE)`):**

Trocar:

```javascript
setUser(response.data.data)
```

por:

```javascript
setUser(response.data)
```

---

## Resultado após rollback

- Dashboard voltará a usar a propriedade inexistente `historico_pagamentos`, e a lista "Apostas Recentes" ficará novamente sempre vazia.
- Após refresh com token, o estado `user` no AuthContext voltará a ser o envelope `{ success, data }` em vez do objeto de perfil.

---

**Nenhuma alteração em backend ou banco. Rollback apenas no frontend.**
