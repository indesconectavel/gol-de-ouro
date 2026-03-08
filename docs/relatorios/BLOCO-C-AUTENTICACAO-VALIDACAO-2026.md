# BLOCO C — AUTENTICAÇÃO — Validação e Relatório

**Projeto:** Gol de Ouro  
**Data:** 08/03/2026  
**Branch:** `feature/bloco-c-auth`  
**Base:** `main` (commit b66867f)  
**Modo:** READ-FIRST → diagnóstico → correções → relatório

---

## 1. Objetivo do BLOCO

Revisar e estabilizar o sistema de autenticação (login, sessão, logout, AuthContext, rotas protegidas e redirects) **sem alterar** produção, gameplay, saldo, financeiro, apostas ou interface fora do fluxo de auth.

---

## 2. Arquivos Revisados (auditoria read-first)

| Arquivo | Função |
|--------|--------|
| `goldeouro-player/src/contexts/AuthContext.jsx` | Estado global de auth, login, logout, restauração de sessão |
| `goldeouro-player/src/pages/Login.jsx` | Página de login, uso de `useAuth().login`, redirect para `/dashboard` |
| `goldeouro-player/src/services/apiClient.js` | Axios com Bearer token, 401 → remove authToken/userData |
| `goldeouro-player/src/config/api.js` | API_ENDPOINTS (LOGIN, PROFILE, etc.), logout() redirect |
| `goldeouro-player/src/components/ProtectedRoute.jsx` | Proteção por `user` + `loading`, redirect para `/` |
| `goldeouro-player/src/App.jsx` | Rotas: `/` = Login, protegidas: dashboard, game, profile, withdraw, pagamentos |
| `goldeouro-player/src/components/Navigation.jsx` | Menu e botão Sair (logout) |
| `goldeouro-player/src/pages/Dashboard.jsx` | Botão de logout no header |
| `server-fly.js` | `/api/auth/login`, `/api/user/profile`, authenticateToken |
| `controllers/authController.js` | register/login (usado por rotas alternativas) |
| `routes/authRoutes.js` | POST /register, POST /login |

---

## 3. Diagnóstico (antes das alterações)

### 3.1 Fluxo de login
- Login em `Login.jsx` chama `login(email, password)` do AuthContext.
- AuthContext usa `apiClient.post(API_ENDPOINTS.LOGIN, { email, password })`.
- Backend (`server-fly.js`) responde com `{ token, user: { id, email, username, saldo, tipo, ... } }`.
- Frontend grava `localStorage.setItem('authToken', token)` e `setUser(userData)`.

### 3.2 Token e sessão
- Token em `localStorage.authToken`.
- AuthContext **não** gravava `userData` no localStorage no login; apenas estado React.
- Na restauração (refresh), AuthContext fazia `apiClient.get(PROFILE)` e `setUser(response.data)`.
- Backend retorna `{ success: true, data: { id, email, ... } }`, mas o código fazia `setUser(response.data)` → usuário virava `{ success: true, data: {...} }`, quebrando `user.id` e estado.

### 3.3 Logout
- Navigation e Dashboard tinham `handleLogout` próprio: chamavam `apiClient.post('/auth/logout', { token })`, limpavam `authToken` e `user` e navegavam para `/`.
- Backend **não** tinha rota `/api/auth/logout` → 404.
- **Não** usavam `useAuth().logout()` → estado do AuthContext (user) permanecia preenchido até refresh.

### 3.4 Rotas protegidas
- ProtectedRoute usa `user` e `loading` do AuthContext; sem user redireciona para `/`.
- Rotas protegidas: `/dashboard`, `/game`, `/gameshoot`, `/profile`, `/withdraw`, `/pagamentos`.

### 3.5 Redirects
- Login sucesso → `/dashboard`.
- Rota protegida sem token → `/`.
- `config/api.js` `logout()` redirecionava para `/login` (rota inexistente; login é `/`).

### 3.6 Mensagens de erro
- AuthContext usava `error.response?.data?.message || 'Erro ao fazer login'`.
- Backend devolve 401 com "Credenciais inválidas", 503 com "Sistema temporariamente indisponível".
- Não havia tratamento explícito para 503 no frontend.

### 3.7 Inconsistências encontradas
1. Restauração de sessão: `setUser(response.data)` em vez de `setUser(response.data.data)`.
2. Logout na Navigation/Dashboard não usava AuthContext → estado não era limpo.
3. Backend sem POST `/api/auth/logout` → frontend recebia 404 ao sair.
4. `api.js` logout() com redirect para `/login` em vez de `/`.
5. authController register retornava `balance` e `role` em vez de `saldo` e `tipo` (compatibilidade com frontend/select do banco).

---

## 4. Ajustes realizados

### 4.1 AuthContext.jsx
- **Restauração de sessão:** uso de `response.data.data` quando o backend retorna `{ success: true, data: {...} }`, com fallback `payload?.data ?? payload`.
- **Mensagem 503:** em erro de login, se `status === 503` exibir "Sistema indisponível".
- **Logout:** também remover `userData` do localStorage para alinhar com apiClient (401).

### 4.2 Navigation.jsx
- Import de `useAuth`; uso de `logout: authLogout` do contexto.
- `handleLogout`: chamar `authLogout()` e em seguida `navigate('/', { replace: true })`.
- Remoção da chamada a `apiClient.post('/auth/logout')` e da limpeza manual de localStorage (centralizada no AuthContext).
- Remoção do import de `apiClient` (não usado para logout).

### 4.3 Dashboard.jsx
- Import de `useAuth`; uso de `logout: authLogout`.
- `handleLogout`: chamar `authLogout()` e `navigate('/', { replace: true })`.
- Remoção da chamada ao backend e da limpeza manual de localStorage.

### 4.4 config/api.js
- `logout()`: redirect alterado de `window.location.href = '/login'` para `window.location.href = '/'`.

### 4.5 server-fly.js (backend)
- Nova rota `POST /api/auth/logout` retornando `200` e `{ success: true, message: 'Logout realizado' }` (comportamento apenas cliente; backend não altera estado).

### 4.6 controllers/authController.js
- Resposta do register: uso de `saldo: newUser.saldo` e `role: newUser.tipo` em vez de `balance`/`role` para alinhar ao select do Supabase.

---

## 5. Validação no preview

- **Build:** `npm run build` no `goldeouro-player` concluído com sucesso (sem erros de lint nos arquivos alterados).
- **Preview:** ao fazer push da branch `feature/bloco-c-auth`, o preview online (ex.: Vercel) deve ser usado para validar:
  - Login válido → redireciona para `/dashboard`.
  - Login inválido → mensagem "Credenciais inválidas" (ou equivalente do backend).
  - Refresh na área logada → sessão mantida (perfil restaurado corretamente).
  - Logout (Sair) → limpa sessão e redireciona para `/`.
  - Acesso a `/game`, `/profile`, `/pagamentos` sem login → redirect para `/`.
  - Com login → acesso normal às rotas protegidas.

---

## 6. Testes executados

- Build de produção do frontend (`npm run build` em `goldeouro-player`): **OK**.
- Linter nos arquivos alterados: **sem erros**.
- Nenhuma alteração em gameplay, saldo, financeiro, apostas ou interface fora do fluxo de autenticação.

---

## 7. Resultado final

- **Branch:** `feature/bloco-c-auth` criada a partir de `main`.
- **Arquivos alterados (escopo BLOCO C):**  
  `AuthContext.jsx`, `Navigation.jsx`, `Dashboard.jsx`, `config/api.js`, `server-fly.js`, `controllers/authController.js`.
- **Arquivo modificado fora do escopo (não incluso no commit do BLOCO C):**  
  `goldeouro-player/src/config/environments.js` — override temporário de URL para validação de branch espelho; não incluso no commit.
- **Regressões:** nenhuma identificada no escopo do BLOCO C; alterações restritas ao fluxo de autenticação.
- **Status do BLOCO:** **BLOCO C VALIDADO COM RESSALVAS** — a validação principal oficial ocorre no preview online da branch; o status só poderá virar "BLOCO C VALIDADO" após confirmação real no preview.

---

## 8. Instruções para validação no preview

1. Fazer push da branch: `git push -u origin feature/bloco-c-auth`.
2. Abrir o preview gerado (ex.: link do Vercel para a branch).
3. Testar:
   - Login com credenciais válidas → deve ir para dashboard.
   - Login com credenciais inválidas → mensagem de erro controlada.
   - Após login, dar refresh → deve continuar logado.
   - Clicar em "Sair" → deve ir para a tela de login e não voltar logado ao navegar.
   - Sem login, acessar `/game`, `/profile` ou `/pagamentos` → deve redirecionar para `/`.

Produção permanece congelada; baseline de rollback: FyKKeg6zb.
