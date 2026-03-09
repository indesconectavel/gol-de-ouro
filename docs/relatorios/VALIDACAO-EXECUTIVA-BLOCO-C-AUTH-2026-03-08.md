# Validação Executiva — Bloco C (Autenticação / Acesso)
**Gol de Ouro — Auditoria Forense Read-Only**  
**Data:** 2026-03-08  
**Modo:** READ-ONLY (nenhuma alteração de código, env, build ou deploy)

---

## 1️⃣ Escopo auditado

| Categoria | Itens |
|-----------|--------|
| **Páginas** | `/` (Login), `/register`, `/forgot-password`, `/reset-password` |
| **Componentes** | `Login.jsx`, `Register.jsx`, `ForgotPassword.jsx`, `ResetPassword.jsx` |
| **Infraestrutura** | `AuthContext.jsx`, `ProtectedRoute.jsx`, `apiClient.js`, `config/api.js`, `config/environments.js` |
| **Backend (leitura)** | `server-fly.js` (rotas `/api/auth/*`, `/api/user/profile`), `controllers/authController.js`, `routes/authRoutes.js` |

**Localização do frontend:** `goldeouro-player/src/`  
**Localização do backend:** raiz do repositório (`server-fly.js` como servidor principal de deploy)

---

## 2️⃣ Arquitetura de autenticação

### Tabela de evidências (arquivo e linha)

| Item | Arquivo | Evidência |
|------|---------|-----------|
| **Token storage** | `goldeouro-player/src/contexts/AuthContext.jsx` L61-62, L88-89, L103-104 | `localStorage.setItem('authToken', token)` no login/register; `localStorage.removeItem('authToken')` no logout e no catch de profile |
| **Validação de sessão** | `AuthContext.jsx` L29-49 | `useEffect` lê `localStorage.getItem('authToken')`; se existir, chama `apiClient.get(API_ENDPOINTS.PROFILE)` para validar |
| **Carregamento de profile** | `AuthContext.jsx` L33-35 | `apiClient.get(API_ENDPOINTS.PROFILE).then(response => setUser(response.data))` |
| **Estado loading** | `AuthContext.jsx` L25, L52-53, L69-71 | `const [loading, setLoading] = useState(true)`; set true no login/register, false no finally e no finally do profile |
| **Comportamento se token inválido** | `AuthContext.jsx` L36-41, `apiClient.js` L184-186 | No AuthContext: `.catch` remove `authToken` e `userData`, `setUser(null)`. No apiClient: em 401 remove `authToken` e `userData` |

### Endpoints utilizados

| Uso | Endpoint | Definido em |
|-----|----------|-------------|
| Login | `POST /api/auth/login` | `goldeouro-player/src/config/api.js` L14 |
| Registro | `POST /api/auth/register` | `api.js` L15 |
| Validação de sessão | `GET /api/user/profile` | `api.js` L17 |
| Forgot password | `POST /api/auth/forgot-password` | `api.js` L16 |
| Reset password | `POST /api/auth/reset-password` | `api.js` L18 |

Backend que implementa esses contratos (deploy): `server-fly.js` (L837 login, L677 register, L943 profile, L409 forgot-password, L510 reset-password).

---

## 3️⃣ Fluxo de login

**Arquivo analisado:** `goldeouro-player/src/pages/Login.jsx`

| Pergunta | Resposta com evidência |
|----------|------------------------|
| **1️⃣ Qual endpoint faz login?** | `API_ENDPOINTS.LOGIN` → `POST /api/auth/login` (config/api.js L14). Chamado em AuthContext L55-58: `apiClient.post(API_ENDPOINTS.LOGIN, { email, password })`. |
| **2️⃣ O que é salvo após login?** | Token em `localStorage` e usuário em estado React: `localStorage.setItem('authToken', token)` e `setUser(userData)` (AuthContext L61-63). `userData` = `response.data.user` (L60). |
| **3️⃣ Onde o token é armazenado?** | `localStorage` com chave `authToken` (AuthContext L61). Evidência: `localStorage.setItem('authToken', token)`. |
| **4️⃣ Qual rota após login?** | `/dashboard`. Login.jsx L34-36: `if (result.success) { navigate('/dashboard') }`. |
| **5️⃣ Como erros de login são tratados?** | AuthContext L65-68: `catch` pega `error.response?.data?.message` ou fallback `'Erro ao fazer login'`, chama `setError(errorMessage)` e retorna `{ success: false, error: errorMessage }`. Login.jsx L69-72 exibe `{error}` em div com classe `bg-red-500/20`. |

---

## 4️⃣ Validação de sessão

**Arquivo analisado:** `goldeouro-player/src/contexts/AuthContext.jsx`

| Pergunta | Resposta com evidência |
|----------|------------------------|
| **1️⃣ O que acontece quando o app inicia?** | `AuthProvider` monta; `useEffect` (L29-49) roda: lê `localStorage.getItem('authToken')`. Se houver token, chama `GET /api/user/profile`; senão, só `setLoading(false)`. |
| **2️⃣ Como o sistema detecta sessão existente?** | Pela presença de `authToken` em `localStorage` (L30). Em seguida a sessão é validada com uma chamada a `GET /api/user/profile` (L33). |
| **3️⃣ Qual endpoint valida a sessão?** | `GET /api/user/profile` (API_ENDPOINTS.PROFILE), AuthContext L33. Backend: server-fly.js L943 com `authenticateToken`. |
| **4️⃣ O que acontece se o token estiver inválido?** | `.catch` (L36-41): `localStorage.removeItem('authToken')`, `localStorage.removeItem('userData')`, `setUser(null)`. apiClient em 401 (L184-186) também remove `authToken` e `userData`. |
| **5️⃣ Qual estado é exibido enquanto verifica sessão?** | `loading === true`. ProtectedRoute.jsx L8-16: se `loading` então exibe tela "Verificando autenticação..." com spinner. |

**Divergência crítica (formato do profile na restauração de sessão):**  
Na restauração por token, AuthContext faz `setUser(response.data)` (L35). O backend em server-fly.js L966-979 retorna `res.json({ success: true, data: { id, email, username, ... } })`, então `response.data` = `{ success: true, data: {...} }`. Com isso, após refresh o `user` do contexto fica com estrutura `{ success: true, data: {...} }` e não `{ id, email, username, ... }` como após login. Ou seja: **quem usa `useAuth().user` esperando `user.email` / `user.id` após reload pode obter `undefined`**. Páginas que carregam perfil por conta própria (Dashboard, Profile) usam `response.data.data` e não dependem desse formato; a inconsistência afeta apenas consumidores do `user` do AuthContext após recarregar a página.

---

## 5️⃣ Proteção de rotas

**Arquivo analisado:** `goldeouro-player/src/components/ProtectedRoute.jsx`

| Pergunta | Resposta com evidência |
|----------|------------------------|
| **1️⃣ Como detecta usuário autenticado?** | Via `useAuth()`: `const { user, loading } = useAuth()`. Autenticado = `user` truthy após `loading === false` (L4-5, L21). |
| **2️⃣ Para onde redireciona se não autenticado?** | `<Navigate to="/" replace />` (L21). Rota `/` é a página de Login (App.jsx L34). |
| **3️⃣ Diferença local vs produção?** | Nenhuma evidência no código: mesmo componente, sem branch por ambiente. Comportamento depende apenas de `user`/`loading` e da rota `/` definida no mesmo App. |

Rotas protegidas (App.jsx L43-71): `/dashboard`, `/game`, `/gameshoot`, `/profile`, `/withdraw`, `/pagamentos` — todas com `<ProtectedRoute><...></ProtectedRoute>`.

---

## 6️⃣ Persistência de sessão

| Onde | Evidência |
|------|-----------|
| **Onde o token fica** | `localStorage` chave `authToken`. AuthContext L61, L30, L103; apiClient L37, L184. |
| **Como é enviado para a API** | apiClient.js L37-40: interceptor de request lê `localStorage.getItem('authToken')` e, se existir, define `config.headers.Authorization = \`Bearer ${token}\``. |
| **Como é removido** | AuthContext L103-104: `localStorage.removeItem('authToken')`. apiClient L184-185 em resposta 401. Navigation.jsx L72-73 e Dashboard L88-89 também removem `authToken` (e `user`) no logout. |

**sessionStorage:** Usado em `environments.js` para flags de ambiente (`env_hasLoggedOnce`, `env_isInitialized`, `backend_forced`), não para token.  
**Cookies:** Não utilizados para auth (apiClient withCredentials: false, L12).  
**Headers:** Token enviado apenas via `Authorization: Bearer <token>` (apiClient L39).

---

## 7️⃣ Redirecionamentos (tabela de fluxos)

| Fluxo | Comportamento | Evidência |
|-------|----------------|-----------|
| login → dashboard | Após login com sucesso, `navigate('/dashboard')` | Login.jsx L34-36 |
| login → game | Não é o redirect pós-login; usuário pode ir por menu. Redirect pós-login é só dashboard | Login.jsx L35 |
| acesso /game sem login | ProtectedRoute redireciona para `/` | ProtectedRoute.jsx L20-21 |
| acesso /dashboard sem login | ProtectedRoute redireciona para `/` | ProtectedRoute.jsx L20-21 |
| logout → ? | Navegação para `/` | Navigation.jsx L76; Dashboard L91; AuthContext.logout não redireciona (apenas limpa estado) |

**Inconsistência:** ForgotPassword.jsx L56-57 e L123 usa `to="/login"`. Em App.jsx não existe rota para `/login`; a rota de login é `/`. Portanto **"Voltar ao Login" em ForgotPassword leva a uma rota não definida** (comportamento indefinido no React Router).  
**Inconsistência:** config/api.js L83: `logout()` faz `window.location.href = '/login'`. Essa função não é usada pelo AuthContext (AuthContext.logout não a chama); quem faz logout são Navigation e Dashboard, e ambos usam `navigate('/')`. Ou seja, `/login` em api.js é morto no fluxo atual, mas reforça que o app trata login em `/` e não em `/login`.

---

## 8️⃣ Comparação local vs produção

Comparação feita **apenas com o código atual do repositório** (backend em server-fly.js, frontend em goldeouro-player). **Não foi feita inspeção de artefatos de deploy nem de commits ez1oc96t1 / FyKKeg6zb** neste audit; portanto baseline e produção “ao vivo” ficam como **NÃO CONFIRMADOS** no que diz respeito a diferenças de código.

| Item | Local (código atual) | Produção (código atual) | Baseline | Status |
|------|----------------------|--------------------------|----------|--------|
| login | POST /api/auth/login, token + user em localStorage/estado | Mesmo contrato em server-fly.js | NÃO CONFIRMADO | Código alinhado no repo |
| redirect pós-login | /dashboard | Idem | NÃO CONFIRMADO | Idem |
| persistência | localStorage authToken, Bearer no header | Idem | NÃO CONFIRMADO | Idem |
| validação de sessão | GET /api/user/profile ao iniciar se há token | Idem | NÃO CONFIRMADO | Idem |
| acesso /game sem login | Redirect para / | Idem | NÃO CONFIRMADO | Idem |
| acesso /dashboard sem login | Redirect para / | Idem | NÃO CONFIRMADO | Idem |

**Ambiente local (frontend):** environments.js development usa `API_BASE_URL: 'http://localhost:8080'`. api.js usa `import.meta.env.VITE_BACKEND_URL || 'https://goldeouro-backend-v2.fly.dev'`. apiClient usa `validateEnvironment()` de environments.js (apiClient importa de `../config/environments.js`), então em desenvolvimento o backend é localhost:8080; em produção (hostname goldeouro.lol etc.) é goldeouro-backend-v2.fly.dev.

---

## 9️⃣ Divergências encontradas

### Visual
- Nenhuma divergência de código auditada que altere apenas aparência entre auth local e produção. (Banners/versão não foram comparados com baseline.)

### Funcional
- **Formato do user na restauração de sessão:** AuthContext usa `setUser(response.data)` no profile (L35), mas o backend retorna `{ success: true, data: {...} }`. Após refresh, `user` fica com estrutura errada para quem espera `user.email` / `user.id`. Arquivo: AuthContext.jsx L35; server-fly.js L966-979.
- **Rota /login inexistente:** ForgotPassword usa `to="/login"` (L56, L123); App define login em `/`. Link "Voltar ao Login" pode não levar à tela de login. Arquivos: ForgotPassword.jsx L56, L123; App.jsx L34.
- **config/api.js logout redirect:** `window.location.href = '/login'` (L83) não é usado pelo fluxo atual de logout; fluxo real usa `navigate('/')`. Inconsistência de contrato de “para onde vai o logout”.

### Ambiente
- Local usa backend em `http://localhost:8080` (environments.js); produção usa `https://goldeouro-backend-v2.fly.dev`. Comportamento idêntico em termos de fluxo; diferença é apenas de URL.
- Token existente em localStorage é condição de estado; não é divergência de código.

### Não confirmado
- Comportamento real em produção (ez1oc96t1) e na baseline (FyKKeg6zb) não foi validado com deploy ou histórico Git neste audit.

---

## 🔟 Risco operacional

**Classificação: MÉDIO**

**Justificativa com base no código:**

- **Pontos sólidos:** Fluxo de login, registro, proteção de rotas e envio do token (Bearer no header) estão claros e alinhados entre frontend e backend no repositório. Persistência em localStorage e validação via GET /api/user/profile são consistentes. Rotas protegidas redirecionam para `/` quando não autenticado.
- **Riscos:**  
  - **Formato do user na restauração:** Qualquer componente que use `useAuth().user` (ex.: `user.email`) após um refresh pode quebrar, pois o user fica no formato `{ success, data }`. Impacto é limitado porque Dashboard e Profile não dependem desse user para exibir dados (carregam profile por API).  
  - **Link /login em ForgotPassword:** UX quebrada ao clicar em "Voltar ao Login" (rota não definida).  
- **Conclusão:** O bloco é utilizável como referência para desenvolvimento e para validar fluxos de usuário, mas com ressalva sobre o formato do user após refresh e o link de ForgotPassword. Por isso o risco é **médio**, não baixo.

---

## 1️⃣0️⃣ Decisão operacional final

**PODE USAR COM RESSALVAS**

**Justificativa técnica:**

- O sistema de autenticação local **reflete o mesmo desenho e contratos** do backend (server-fly.js) presentes no repositório: mesmos endpoints, mesmo uso de token em localStorage e Bearer, mesma validação de sessão via profile e mesma proteção de rotas com redirect para `/`.
- **Ressalvas:**  
  1. **Restauração de sessão:** Corrigir em AuthContext o uso do profile para `setUser(response.data.data)` quando a API retornar `{ success: true, data: {...} }`, de modo que o `user` do contexto tenha a mesma forma após login e após refresh.  
  2. **ForgotPassword:** Ajustar links "Voltar ao Login" para `to="/"` (ou criar rota `/login` que redirecione para `/`) para evitar rota inexistente.  
  3. **Comparação com produção/baseline:** Para afirmar que o local e a produção (ez1oc96t1 / FyKKeg6zb) são idênticos, é necessário comparar artefatos de deploy ou histórico Git; no escopo desta auditoria read-only isso ficou **NÃO CONFIRMADO**.

Com essas ressalvas documentadas e, idealmente, corrigidas, o Bloco C pode ser usado como **referência para desenvolvimento** e para **validar fluxos de usuário** (login, registro, acesso a rotas protegidas, logout e persistência de sessão).

---

*Relatório gerado em modo read-only. Nenhuma alteração foi feita em código, env, build ou deploy.*
