# CIRURGIA AUTH REAL — PAINEL ADMIN

**Data:** 2026-05-06  
**Projeto alvo:** `goldeouro-admin`  
**Backend de referência:** `https://goldeouro-backend-v2.fly.dev`  
**Escopo executado:** login real JWT + propagação de Bearer token no cliente admin

---

## 1) Objetivo da cirurgia

Conectar o painel admin ao contrato real de autenticação do backend:

- `POST /api/auth/login`
- header autenticado: `Authorization: Bearer <JWT>`
- sessão inválida (`401/403`) deve limpar token e redirecionar para `/login`

---

## 2) Arquivos alterados

No `goldeouro-admin`:

- `src/pages/Login.jsx`
- `src/js/auth.js`
- `src/js/api.js`
- `src/services/api.js`
- `src/services/dataService.js`
- `src/components/Sidebar.jsx`

Sem alteração em backend, banco ou deploy.

---

## 3) Correções implementadas

### 3.1 Login real (`Login.jsx`)

- removido fluxo local/fake de senha hardcoded
- adicionado envio de credenciais reais (`email` + `password`) para:
  - `POST https://goldeouro-backend-v2.fly.dev/api/auth/login` (ou `VITE_API_URL`)
- em sucesso:
  - salva token real JWT no `localStorage`
  - salva dados mínimos do usuário (quando retornados)
  - redireciona para `/painel`
- em falha:
  - exibe mensagem real retornada pela API (fallback quando necessário)

### 3.2 Helper de autenticação (`src/js/auth.js`)

Criadas/ajustadas funções:

- `getToken()`
- `setToken(token)`
- `removeToken()`
- `isAuthenticated()`
- `logout()`

Também adicionadas:

- `setUser(user)`
- `getUser()`

### 3.3 Clientes HTTP padronizados em Bearer JWT

`src/js/api.js`:

- removeu `x-admin-token`
- adiciona `Authorization: Bearer <token>`
- mantém `Content-Type: application/json`
- em `401/403`: `logout()` + redirect para `/login`

`src/services/api.js` (axios):

- removeu header hardcoded legado
- request interceptor injeta Bearer token
- response interceptor trata `401/403` com limpeza de sessão + redirect

`src/services/dataService.js`:

- usa helper central `getToken()`
- mantém `Content-Type: application/json`
- em `401/403`: `logout()` + redirect para `/login`

### 3.4 Logout da UI (`Sidebar.jsx`)

- botão sair passou a usar `logout` real do helper de auth (`src/js/auth.js`)
- mantém navegação para `/login` após limpeza de sessão

---

## 4) Itens deliberadamente fora de escopo

- sem alteração de backend
- sem alteração de banco
- sem correção de páginas mockadas/fallbacks
- sem mudança de rotas não relacionadas à autenticação
- `vercel.json` existente com rewrites preservado

---

## 5) Validações executadas

### Build frontend

- comando: `npm run build` (em `goldeouro-admin`)
- resultado: **PASSOU**

### Verificação estática JS puro

- comando:
  - `node --check src/js/auth.js`
  - `node --check src/js/api.js`
  - `node --check src/services/api.js`
  - `node --check src/services/dataService.js`
- resultado: **PASSOU**

---

## 6) Conclusão

O painel admin foi conectado ao fluxo de autenticação JWT real no cliente, com sessão centralizada e propagação consistente do token nas requisições.

**Decisão para deploy controlado do painel admin:** **GO**  
(recomendado executar smoke funcional de login + navegação autenticada em ambiente controlado antes do deploy definitivo)

---

**Fim do relatório.**
