# VALIDAÇÃO AUTOMÁTICA DE CONSISTÊNCIA — BLOCO C — AUTENTICAÇÃO

**Projeto:** Gol de Ouro  
**Data:** 2026-03-09  
**Modo:** READ-ONLY (nenhuma alteração de código, env, build ou deploy)  
**Referência:** BLOCO-C-AUTENTICACAO-VALIDACAO-COMPLETA-2026-03-08.md, AUDITORIA-READONLY-BLOCO-C-AUTENTICACAO-2026-03-09.md

---

## 1. Resumo executivo

A validação automática de consistência entre frontend e backend do BLOCO C (autenticação) foi feita por leitura direta dos arquivos listados. O casamento real mostra: **rotas de API e de tela em grande parte alinhadas**; **contratos de login e cadastro compatíveis** (backend retorna `token` e `user`; frontend consome `response.data.token` e `response.data.user`); **forgot-password e reset-password** com payload e resposta alinhados. Foram encontradas **divergências reais**: (1) rota de tela **/login** referenciada em ForgotPassword (Link to="/login") e em api.js (logout com href='/login'), mas **inexistente** no App.jsx (login em "/"); (2) **Profile (sessão)**: backend retorna `{ success, data: {...} }`, AuthContext faz `setUser(response.data)` → após refresh `user` fica `{ success, data }`, quebrando consumidores de `user.email`/`user.id`; (3) **logout**: frontend chama POST `/auth/logout`, backend **não define** essa rota (404); Navigation/Dashboard não chamam `useAuth().logout()` e não limpam o estado `user` do contexto; (4) **sessão**: interceptor 401 remove `authToken` e `userData`; AuthContext e login/register só gravam `authToken` (não `userData`); logout em api.js remove `authToken` e `userData` e redireciona para `/login` (função não usada pelo fluxo principal). Conclusão: o bloco está **consistente com ressalvas**; as divergências podem gerar falhas no preview (link quebrado, formato de user pós-refresh, estado “meio logado” após logout) mas não impedem a execução da validação prática.

---

## 2. Arquivos auditados

| Arquivo | Lido |
|---------|------|
| server-fly.js (trechos de auth: login, register, forgot-password, reset-password, profile, authenticateToken, CORS) | Sim |
| goldeouro-player/src/App.jsx | Sim |
| goldeouro-player/src/pages/Login.jsx | Sim |
| goldeouro-player/src/pages/Register.jsx | Sim |
| goldeouro-player/src/pages/ForgotPassword.jsx | Sim |
| goldeouro-player/src/pages/ResetPassword.jsx | Sim |
| goldeouro-player/src/contexts/AuthContext.jsx | Sim |
| goldeouro-player/src/components/ProtectedRoute.jsx | Sim |
| goldeouro-player/src/config/api.js | Sim |
| goldeouro-player/src/config/environments.js | Sim |
| goldeouro-player/src/services/apiClient.js | Sim |
| goldeouro-player/src/components/Navigation.jsx | Sim |
| goldeouro-player/src/pages/Dashboard.jsx | Sim |
| goldeouro-player/src/pages/Profile.jsx | Sim (trecho de carregamento de perfil) |
| goldeouro-player/src/pages/GameFinal.jsx | Sim (trecho inicial; sem uso de auth) |

---

## 3. Matriz de consistência de rotas

| Rota / chamada | Onde é usada | Onde existe | Status |
|----------------|--------------|-------------|--------|
| **Frontend (React Router)** | | | |
| / | Login.jsx (tela), ProtectedRoute (redirect), Register/Dashboard/Navigation (navigate) | App.jsx path="/" → Login | OK |
| /register | Login (navigate), Register (tela) | App.jsx path="/register" → Register | OK |
| /forgot-password | Login (href), ForgotPassword (tela) | App.jsx path="/forgot-password" → ForgotPassword | OK |
| /reset-password | ResetPassword (tela + query ?token=) | App.jsx path="/reset-password" → ResetPassword | OK |
| /login | ForgotPassword (Link to="/login" L56, L123), api.js logout (href='/login') | Não definida em App.jsx | **DIVERGENTE** |
| /dashboard | Login, Register (navigate após sucesso), Navigation, Dashboard | App.jsx path="/dashboard" com ProtectedRoute | OK |
| /game | Navigation, Dashboard (navigate) | App.jsx path="/game" com ProtectedRoute → GameFinal | OK |
| /profile | Navigation, Dashboard | App.jsx path="/profile" com ProtectedRoute | OK |
| **Backend (API)** | | | |
| POST /api/auth/login | AuthContext (API_ENDPOINTS.LOGIN) | server-fly.js L858 | OK |
| POST /api/auth/register | AuthContext (API_ENDPOINTS.REGISTER) | server-fly.js L698 | OK |
| POST /api/auth/forgot-password | ForgotPassword (API_ENDPOINTS.FORGOT_PASSWORD) | server-fly.js L430 | OK |
| POST /api/auth/reset-password | ResetPassword (API_ENDPOINTS.RESET_PASSWORD) | server-fly.js L531 | OK |
| GET /api/user/profile | AuthContext (sessão), Dashboard, Profile (API_ENDPOINTS.PROFILE) | server-fly.js L963 | OK |
| POST /auth/logout | Navigation (apiClient.post('/auth/logout')), Dashboard (idem) | Não existe no backend | **INEXISTENTE** |
| POST /api/auth/logout | Não usado no frontend | Não existe no backend | N/A |

---

## 4. Matriz de consistência de contratos

| Fluxo | Frontend envia | Backend espera | Backend retorna | Frontend consome | Status |
|-------|----------------|----------------|-----------------|------------------|--------|
| **Login** | POST body: email, password | req.body.email, req.body.password | 200: { success, message, token, user: { id, email, username, saldo, tipo, total_apostas, total_ganhos } } | const { token, user: userData } = response.data; setUser(userData) | OK |
| **Cadastro** | POST body: username, email, password | req.body.email, password, username | 201: { success, message, token, user: { id, email, username, saldo, tipo } }; ou 200 (auto-login) com mesmo shape de user | Idem: token e user de response.data | OK |
| **Profile (sessão)** | GET; header Authorization: Bearer &lt;token&gt; | authenticateToken; req.user.userId | 200: { success: true, data: { id, email, username, nome, saldo, tipo, ... } } | setUser(response.data) → user = { success, data } | **DIVERGENTE** |
| **Forgot Password** | POST body: { email } | body('email').isEmail().normalizeEmail() | 200: { success, message } (sempre mesma mensagem) | if (response.data.success) setIsSent(true) | OK |
| **Reset Password** | POST body: { token, newPassword } | body('token').notEmpty(), body('newPassword').isLength({ min: 6 }) | 200: { success, message } | if (response.data.success) setIsSuccess(true); navigate('/') | OK |
| **Login erro** | — | — | 401: { success: false, message: 'Credenciais inválidas' } | catch: error.response?.data?.message; setError(...) | OK |
| **Cadastro email duplicado** | — | — | 400 ou 200 (auto-login) | catch ou result.success | OK |

---

## 5. Matriz de consistência de sessão

| Item | Origem | Uso | Limpeza | Risco |
|------|--------|-----|---------|-------|
| authToken | AuthContext login/register: setItem('authToken', token) | apiClient interceptor: getItem('authToken'); Authorization header; AuthContext useEffect: getItem para decidir GET profile | AuthContext logout: removeItem('authToken'); interceptor 401: removeItem('authToken'); Navigation/Dashboard handleLogout: removeItem('authToken') | OK para token; ver risco “meio logado” |
| userData | api.js saveUserData/getUserData; nunca chamado por AuthContext no login/register | api.js getUserData; interceptor 401 remove 'userData' | api.js logout (não usado): removeItem('userData'); interceptor 401: removeItem('userData') | AuthContext não grava userData; possível inconsistência se outro código depender de userData |
| user (estado React) | AuthContext: setUser(userData) no login/register; setUser(response.data) no profile (refresh) | ProtectedRoute: !!user; Dashboard/Profile: estado local próprio (profileResponse.data.data), não useAuth().user para exibição | AuthContext.logout: setUser(null). Navigation/Dashboard handleLogout: não chamam useAuth().logout() → não setUser(null) | **Risco:** após logout pela sidebar, user no contexto continua truthy; acesso a /game ainda permitido até refresh ou 401 |
| Formato user pós-refresh | Backend profile retorna { success, data }; AuthContext setUser(response.data) | user = { success, data }; user.email / user.id undefined | — | **Risco:** qualquer componente que use useAuth().user.email ou user.id após F5 quebra |
| Limpeza no 401 | apiClient interceptor | removeItem('authToken'), removeItem('userData'); não chama setUser(null) | AuthContext não é atualizado no 401 | Possível “meio logado”: token removido mas user no contexto ainda preenchido até próxima navegação que dependa de user |
| Navigation/Dashboard removeItem('user') | handleLogout | localStorage chave 'user' | AuthContext nunca grava 'user' no localStorage | Sem impacto no AuthContext; apenas limpeza de chave não usada pelo contexto |

---

## 6. Divergências reais encontradas

1. **Rota /login inexistente** — ForgotPassword.jsx usa `<Link to="/login">` em dois pontos (L56, L123). App.jsx não define path="/login"; a tela de login é path="/". Navegação para /login pode resultar em tela em branco ou comportamento indefinido.
2. **api.js logout() redireciona para /login** — api.js L80-84: `logout()` faz `window.location.href = '/login'`. Essa função não é usada pelo AuthContext nem por Navigation/Dashboard (que usam navigate('/')). Contrato de “para onde vai o logout” diverge da rota real (/).
3. **Contrato Profile vs AuthContext** — Backend GET /api/user/profile retorna `{ success: true, data: { id, email, ... } }`. AuthContext no useEffect de sessão faz `setUser(response.data)`, portanto `user` = `{ success, data }`. Frontend espera, após login/register, `user` = objeto plano com id, email, etc. Após refresh, consumidores de `user.email` ou `user.id` recebem undefined.
4. **POST /auth/logout chamado mas inexistente** — Navigation e Dashboard chamam `apiClient.post('/auth/logout', { token })`. Backend não define POST /auth/logout nem POST /api/auth/logout. Resposta 404; limpeza local e navigate('/') ocorrem mesmo assim.
5. **Logout não limpa estado do AuthContext** — Navigation e Dashboard em handleLogout removem authToken e navegam para "/" mas não chamam `useAuth().logout()`. O estado `user` no AuthContext permanece preenchido; isAuthenticated continua true; usuário pode acessar rota protegida após “Sair” até dar refresh ou receber 401.
6. **Interceptor 401 não atualiza AuthContext** — Em 401, apiClient remove authToken e userData do localStorage mas não invoca setUser(null). Quem depende de useAuth().user pode continuar vendo usuário logado até o próximo uso que force revalidação.

---

## 7. Divergências investigadas e descartadas

- **Login/Register retorno token/user** — Backend envia token e user com os campos usados pelo frontend; AuthContext desestrutura corretamente. Descartado.
- **Forgot/Reset payload e resposta** — Frontend envia email ou token + newPassword; backend valida e retorna success/message. Frontend usa response.data.success. Descartado.
- **API_ENDPOINTS vs backend** — Todos os paths em api.js (LOGIN, REGISTER, FORGOT_PASSWORD, RESET_PASSWORD, PROFILE) existem no server-fly.js. Descartado.
- **ProtectedRoute e rota /** — ProtectedRoute redireciona para to="/"; App define "/" como Login. Descartado.
- **Dashboard/Profile e formato do perfil** — Dashboard e Profile usam profileResponse.data.data para estado local; não dependem de useAuth().user para exibir nome/email. Descartado.
- **baseURL do apiClient** — apiClient usa validateEnvironment() de environments.js; não usa api.js para baseURL. Endpoints relativos são concatenados corretamente. Descartado.
- **Regressão estrutural em GameFinal** — GameFinal não importa AuthContext nem useAuth; apenas é filho de ProtectedRoute. Nenhum acoplamento de auth dentro do componente que pudesse regredir jogo, música ou banner. Descartado.

---

## 8. Top 7 riscos de consistência

| # | Risco | Severidade | Motivo |
|---|-------|------------|--------|
| 1 | Link "Voltar ao Login" em ForgotPassword aponta para /login (rota inexistente) | **CRÍTICO** | Pode reprovar o BLOCO C no checklist oficial (link quebrado); UX quebrada no preview. |
| 2 | User no contexto com formato { success, data } após refresh; user.email/user.id undefined | **CRÍTICO** | Critério de reprovação do documento oficial: “sessão não persiste” ou “formato quebra a UI”; qualquer componente que use user.email/user.id após F5 quebra. |
| 3 | Logout (Navigation/Dashboard) não limpa AuthContext; usuário pode acessar /game após “Sair” | **ALTO** | Critério de reprovação: “após logout ainda é possível acessar rota protegida”. |
| 4 | POST /auth/logout inexistente no backend; frontend chama e recebe 404 | **ALTO** | Fluxo parcial; erro no console/rede; não impede logout local mas indica endpoint fantasma. |
| 5 | api.js logout() redireciona para /login; rota não existe; função não usada pelo fluxo principal | **MÉDIO** | Inconsistência de contrato; se algum código passar a usar api.logout(), quebra. |
| 6 | Interceptor 401 remove token/userData mas não setUser(null); possível estado “meio logado” | **MÉDIO** | Token removido; contexto pode continuar com user; próxima chamada protegida falha com 401. |
| 7 | AuthContext não grava userData no localStorage; interceptor e api.js referenciam userData | **BAIXO** | Detalhe de consistência; impacto limitado pois login/register não usam userData no fluxo atual. |

---

## 9. Diagnóstico final

**Classificação: CONSISTENTE COM RESSALVAS**

Os contratos de login, cadastro, forgot-password e reset-password estão alinhados entre frontend e backend. As rotas de API usadas pelo frontend existem no backend, exceto POST /auth/logout. As divergências confirmadas (rota /login inexistente, formato do user pós-refresh, logout sem limpeza do contexto, endpoint logout fantasma) são ressalvas que podem causar falhas no preview ou reprovação conforme critérios do documento oficial, mas não tornam o bloco estruturalmente inconsistente a ponto de impedir a validação prática. Nenhuma divergência de contrato de payload (campos enviados/retornados) que quebre login ou cadastro foi encontrada.

---

## 10. Conclusão objetiva

O BLOCO C está **pronto para a validação prática final no preview**, desde que o executor do checklist confira explicitamente: (1) o comportamento do link “Voltar ao Login” em ForgotPassword (se leva a / ou a tela quebrada); (2) a persistência de sessão após F5 e o uso de user em componentes (se algum usa user.email/user.id do contexto); (3) o fluxo de logout (Sair) seguido de tentativa de acesso a /game. As inconsistências listadas devem ser tratadas antes de marcar o bloco como VALIDADO sem ressalvas; até lá, o resultado esperado é **VALIDADO COM RESSALVAS** ou **REPROVADO** se algum critério de reprovação for atingido no preview.

---

Nenhuma alteração foi realizada. Nenhum deploy foi executado. Esta validação foi conduzida em modo estritamente READ-ONLY.
