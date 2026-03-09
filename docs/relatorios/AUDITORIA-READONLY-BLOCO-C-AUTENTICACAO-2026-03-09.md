# AUDITORIA READ-ONLY — BLOCO C — AUTENTICAÇÃO

**Projeto:** Gol de Ouro  
**Data:** 2026-03-09  
**Modo:** READ-ONLY (nenhuma alteração de código, env, build ou deploy)  
**Referência:** docs/relatorios/BLOCO-C-AUTENTICACAO-VALIDACAO-COMPLETA-2026-03-08.md

---

## 1. Resumo executivo

O BLOCO C (autenticação) está **estruturalmente implementado** no backend (server-fly.js) e no frontend (goldeouro-player): login, cadastro, forgot/reset password, proteção de rota, sessão e logout possuem fluxo de código real e integração entre camadas. Foram confirmados: login inválido retornando **401** (nunca 500 nos ramos explícitos), sanitização de e-mail no login para logs, CORS permitindo origens `*.vercel.app`, e profile retornando `{ success, data }`.  

Dois **riscos reais** confirmados por leitura de código: (1) **ForgotPassword** usa `to="/login"` em dois pontos, mas a aplicação não define rota `/login` (login está em `/`), o que pode levar a tela em branco ou comportamento indefinido ao clicar em "Voltar ao Login"; (2) **AuthContext** faz `setUser(response.data)` na validação de sessão (GET profile), enquanto o backend retorna `{ success: true, data: { id, email, ... } }`, então após refresh o `user` do contexto fica no formato `{ success, data }` e não `{ id, email, ... }`, podendo quebrar qualquer consumidor que use `user.email` ou `user.id` diretamente.  

Além disso: **logout** em Navigation e Dashboard **não chama** `useAuth().logout()`; apenas removem token do localStorage e navegam para `/`, sem zerar o estado `user` do AuthContext, o que pode deixar o usuário "meio logado" (contexto ainda com `user` preenchido após sair). O backend **não expõe** rota POST `/auth/logout` nem `/api/auth/logout`; as chamadas atuais do frontend resultam em 404, mas a limpeza local e o redirect ocorrem mesmo assim.

Conclusão estrutural: o bloco está **apto para validação manual no preview**, com **ressalvas** documentadas (link /login, formato do user pós-refresh, logout sem limpeza do contexto). Nenhum bloqueador que impeça a execução do checklist manual foi encontrado; os riscos são mitigáveis na validação (testar "Voltar ao Login", persistência após F5, e logout seguido de acesso a rota protegida).

---

## 2. Arquivos reais auditados

| Arquivo | Motivo |
|---------|--------|
| **Backend** | |
| server-fly.js | Servidor em uso (Fly.io); contém rotas de auth, middleware de autenticação, CORS, handlers de login/register/forgot/reset/profile. |
| **Frontend** | |
| goldeouro-player/src/App.jsx | Rotas públicas e protegidas; definição de `/`, `/register`, `/forgot-password`, `/reset-password`, uso de ProtectedRoute em /game, /dashboard, etc. |
| goldeouro-player/src/pages/Login.jsx | Tela de login; uso de useAuth().login; redirect para /dashboard; link para /forgot-password. |
| goldeouro-player/src/pages/Register.jsx | Cadastro; useAuth().register; redirect para /dashboard em sucesso. |
| goldeouro-player/src/pages/ForgotPassword.jsx | Tela "Esqueceu a senha"; POST FORGOT_PASSWORD; links "Voltar ao Login" com to="/login". |
| goldeouro-player/src/pages/ResetPassword.jsx | Reset com token; POST RESET_PASSWORD; "Voltar ao Login" com navigate('/'). |
| goldeouro-player/src/contexts/AuthContext.jsx | Estado user/loading/error; login/register/logout; validação de sessão via GET profile; setUser(response.data) no profile. |
| goldeouro-player/src/components/ProtectedRoute.jsx | Uso de useAuth().user e loading; redirect para "/" se !user. |
| goldeouro-player/src/config/api.js | API_BASE_URL, API_ENDPOINTS (LOGIN, REGISTER, FORGOT_PASSWORD, RESET_PASSWORD, PROFILE); função logout com href='/login'. |
| goldeouro-player/src/config/environments.js | Detecção de ambiente; API_BASE_URL por hostname (localhost vs produção); preview usa produção. |
| goldeouro-player/src/services/apiClient.js | baseURL via validateEnvironment(); interceptor de request (Bearer token); interceptor de response (401 remove authToken/userData). |
| goldeouro-player/src/components/Navigation.jsx | handleLogout: POST /auth/logout, remove authToken/user, navigate('/'); não usa useAuth().logout. |
| goldeouro-player/src/pages/Dashboard.jsx | handleLogout: idem Navigation; não usa useAuth().logout. |
| goldeouro-player/src/pages/Profile.jsx | Carrega perfil via API (response.data.data); não depende de useAuth().user para exibir email/nome. |
| goldeouro-player/src/pages/GameFinal.jsx | Componente renderizado em /game; não contém lógica de auth; apenas uso de navigate. |

---

## 3. Mapeamento do fluxo real

### Login

- **UI:** Login.jsx — formulário envia `formData.email` e `formData.password`; chama `login(formData.email, formData.password)` (useAuth).
- **AuthContext:** `login(email, password)` chama `apiClient.post(API_ENDPOINTS.LOGIN, { email, password })`; em sucesso: `localStorage.setItem('authToken', token)`, `setUser(userData)` com `userData = response.data.user`; retorna `{ success: true, user: userData }`.
- **apiClient:** baseURL vinda de `validateEnvironment()` (produção = goldeouro-backend-v2.fly.dev para não-localhost); interceptor adiciona `Authorization: Bearer ${token}` quando há authToken.
- **Backend:** POST /api/auth/login (server-fly.js L858). Lê `email`, `password`; `sanitizedEmailLogin` apenas para logs; se !dbConnected retorna 503; busca usuário por `email` e ativo; se userError ou !user → **401** com "Credenciais inválidas"; se senha inválida (bcrypt.compare) → **401**; sucesso → JWT 24h e res.json com token e user. Catch genérico → 500.
- **Retorno ao frontend:** Login.jsx em `result.success` faz `navigate('/dashboard')`. Erro: `setError(errorMessage)` com message do backend.

**Evidência:** Login inválido (usuário inexistente ou senha errada) retorna 401 no backend; não há ramo que retorne 500 para credenciais inválidas. O risco de 500 permanece apenas no catch (ex.: exceção inesperada ou bcrypt com input inválido).

### Cadastro

- **UI:** Register.jsx — envia name, email, password; chama `register(formData.name, formData.email, formData.password)`.
- **AuthContext:** `register(name, email, password)` envia `{ username: name, email, password }` para API_ENDPOINTS.REGISTER; sucesso: armazena token, setUser(userData), retorna success.
- **Backend:** POST /api/auth/register (L698). Sem express-validator: lê email, password, username direto do body. Se email já existe: tenta login automático (200 + token) ou retorna **400** "Email já cadastrado. Use a opção...". Inserção em `usuarios` com bcrypt hash; sucesso **201** com token e user. Erros de Supabase ou catch → 500.

**Evidência:** Cadastro com e-mail duplicado tende a 400 ou 200 (login automático). Cadastro novo retorna 201. Não há validação de formato de e-mail/senha no backend (depende do frontend ou pode gerar 500 em caso de dado malformado no insert).

### Forgot Password

- **UI:** ForgotPassword.jsx — handleSubmit valida e-mail no cliente; chama `apiClient.post(API_ENDPOINTS.FORGOT_PASSWORD, { email })`; em sucesso (response.data.success) seta isSent; exibe link "Voltar ao Login" com **to="/login"** (L56 e L123).
- **Backend:** POST /api/auth/forgot-password (L430) com `body('email').isEmail().normalizeEmail()` e validateData; 503 se !dbConnected; se e-mail não existe retorna **200** com mensagem genérica; se existe: gera token, insere em password_reset_tokens, envia e-mail, retorna **200** mesma mensagem.
- **Evidência:** Fluxo é real (POST é chamado). O link "Voltar ao Login" aponta para **/login**, rota não definida em App.jsx (login está em `/`), portanto risco de tela em branco ou comportamento indefinido.

### Reset Password

- **UI:** ResetPassword.jsx — lê token da query; envia `token` e `newPassword` para API_ENDPOINTS.RESET_PASSWORD; sucesso → navigate('/') após 3s; "Voltar ao Login" usa **navigate('/')** (correto).
- **Backend:** POST /api/auth/reset-password (L531) com validação de token e newPassword (min 6); consulta password_reset_tokens; atualiza senha e marca token como usado; 200 em sucesso.

**Evidência:** Integração real; ResetPassword não usa /login.

### Sessão / Refresh

- **AuthContext:** useEffect ao montar: se existe authToken, chama `apiClient.get(API_ENDPOINTS.PROFILE)`. No .then: **setUser(response.data)** (L35).
- **Backend:** GET /api/user/profile com authenticateToken; retorna **res.json({ success: true, data: { id, email, username, nome, saldo, ... } })** (L987-1001).
- **Consequência:** `response.data` = `{ success: true, data: { ... } }`, então o estado `user` no contexto fica **{ success: true, data: {...} }**. Quem usa `user.email` ou `user.id` passa a obter undefined. ProtectedRoute só faz `if (!user)` → continua truthy; páginas como Profile carregam dados próprios via GET profile e usam response.data.data, então não dependem do formato do user do contexto. O risco é para qualquer componente que leia useAuth().user.email/id diretamente.

### Logout

- **AuthContext.logout():** apenas `localStorage.removeItem('authToken')`, `setUser(null)`, `setError(null)`. Não redireciona.
- **Navigation e Dashboard:** handleLogout faz `apiClient.post('/auth/logout', { token })` (backend **não possui** essa rota → 404), depois `localStorage.removeItem('authToken')`, `localStorage.removeItem('user')`, `navigate('/')`. **Não chamam** useAuth().logout(), então o estado `user` do AuthContext não é limpo. Após clicar em Logout, o usuário vai para "/" com token removido mas context.user ainda preenchido → isAuthenticated continua true; se acessar /game (ex.: por link ou back), ProtectedRoute deixa passar.

**Evidência:** Logout local (token removido + redirect) funciona; limpeza do contexto não ocorre nos fluxos atuais de Navigation/Dashboard.

### Proteção de rota

- **App.jsx:** /game renderiza `<ProtectedRoute><GameFinal /></ProtectedRoute>` (L48-52). Demais rotas protegidas idem.
- **ProtectedRoute:** usa `const { user, loading } = useAuth()`. Se loading mostra "Verificando autenticação..."; se !user retorna `<Navigate to="/" replace />`; caso contrário renderiza children.
- **Backend:** POST /api/games/shoot e demais rotas protegidas usam middleware `authenticateToken`: sem token → 401 "Token de acesso requerido"; token inválido → 403 "Token inválido".

**Evidência:** Acesso direto a /game sem login leva ao redirect para "/" pelo ProtectedRoute. Com login, token é enviado e backend valida; sem token ou com token inválido a API retorna 401/403.

---

## 4. Evidências técnicas

| Tema | Arquivo / Local | Evidência |
|------|------------------|-----------|
| Login 401 | server-fly.js L881-885, L892-897 | userError ou !user → res.status(401).json({ message: 'Credenciais inválidas' }); senha inválida → mesmo 401. |
| Sanitização e-mail login | server-fly.js L862 | sanitizedEmailLogin definido para logs; query Supabase usa `email` do body (não normalizado no backend). |
| Profile retorna data | server-fly.js L987-1001 | res.json({ success: true, data: { id, email, username, ... } }). |
| setUser(response.data) | AuthContext.jsx L35 | setUser(response.data) → user vira { success, data }. |
| ForgotPassword to="/login" | ForgotPassword.jsx L56, L123 | <Link to="/login"> Voltar ao Login. |
| Rota / não definida como /login | App.jsx L35 | <Route path="/" element={<Login />} />; não existe path="/login". |
| CORS .vercel.app | server-fly.js L232-237 | if (origin.startsWith('https://') && origin.endsWith('.vercel.app')) callback(null, true). |
| authenticateToken | server-fly.js L336-358 | Sem token → 401; token inválido (jwt.verify err) → 403. |
| Logout sem rota no backend | server-fly.js | Grep por logout / /auth/logout: nenhuma rota. |
| Logout Navigation/Dashboard | Navigation.jsx L64-86, Dashboard L77-100 | removeItem authToken e user; navigate('/'); não chamam useAuth().logout. |
| api.js logout | api.js L80-84 | logout() faz window.location.href = '/login'; não é usado pelo AuthContext nem por Navigation/Dashboard. |
| environments preview | environments.js L75-90 | Não-localhost (incluindo *.vercel.app) usa environments.production → API_BASE_URL goldeouro-backend-v2.fly.dev. |
| ResetPassword navegação | ResetPassword.jsx L63, L89, L204 | navigate('/') e onClick={() => navigate('/')}; correto. |

---

## 5. Riscos encontrados

1. **ForgotPassword "Voltar ao Login" aponta para /login** — ForgotPassword.jsx L56 e L123 usam `to="/login"`. Em App.jsx não existe rota para /login (login está em /). Navegação para /login pode resultar em tela em branco ou comportamento indefinido do React Router.
2. **Formato do user após refresh** — AuthContext na validação de sessão faz setUser(response.data); o backend retorna { success, data }. Assim, user fica { success, data }; user.email e user.id ficam undefined para consumidores do contexto. ProtectedRoute não quebra (usa !!user); Profile e Dashboard usam dados próprios da API; risco para qualquer componente que use useAuth().user.email ou user.id diretamente.
3. **Logout não limpa AuthContext** — Navigation e Dashboard no handleLogout removem token e navegam para "/" mas não chamam useAuth().logout(). O estado user no AuthContext permanece preenchido; isAuthenticated continua true; usuário pode acessar rota protegida após "logout" até dar refresh ou até alguma chamada API retornar 401 e o interceptor limpar token (o interceptor não chama setUser(null)).
4. **POST /auth/logout inexistente** — Frontend chama apiClient.post('/auth/logout', { token }); backend não define essa rota (404). Não impede logout local; apenas gera erro no console/Network.
5. **Cadastro sem validação de entrada no backend** — POST /api/auth/register não usa express-validator; aceita body bruto. E-mail ou senha malformados podem gerar erro no Supabase ou em bcrypt e resultar em 500; depende de validação no frontend.

---

## 6. Riscos descartados

- **Login inválido retornando 500 no fluxo principal** — Descartado. Os ramos de usuário não encontrado e senha incorreta retornam 401 de forma explícita. 500 só no catch genérico (falha inesperada).
- **Esqueceu a senha só visual** — Descartado. ForgotPassword.jsx chama apiClient.post(API_ENDPOINTS.FORGOT_PASSWORD, { email }) e trata response.data.success; fluxo real.
- **Reset sem integração** — Descartado. ResetPassword chama API_ENDPOINTS.RESET_PASSWORD com token e newPassword; contrato alinhado ao backend.
- **/game sem proteção** — Descartado. /game está envolvido por ProtectedRoute; sem user há Navigate to="/".
- **Preview com backend errado por configuração** — Descartado para o código atual. environments.js para hostname diferente de localhost usa production com goldeouro-backend-v2.fly.dev; preview *.vercel.app usa esse backend. (Build real do preview depende de variável de ambiente no Vercel; isso fica para validação manual.)
- **Regressão estrutural em GameFinal/banner/áudio por código de auth** — Descartado. Nenhuma alteração em GameFinal, VersionBanner ou musicManager foi identificada como parte do fluxo de autenticação; /game continua renderizando GameFinal dentro de ProtectedRoute.

---

## 7. Pontos que ainda dependem de validação manual no preview

- Comportamento exato ao clicar em "Voltar ao Login" em ForgotPassword (tela em branco, redirect, ou 404) no preview.
- Persistência da sessão após F5 na prática (token válido, GET profile 200, e se algum componente quebra por user no formato { success, data }).
- Após logout pela sidebar/Dashboard: tentar acessar /game sem novo login (se ainda entra por causa do user no contexto).
- Confirmação de que as requisições do preview saem para goldeouro-backend-v2.fly.dev (aba Network).
- Ausência de CORS bloqueando no preview (*.vercel.app).
- Mensagens exibidas ao usuário (ex.: "Credenciais inválidas") alinhadas às respostas do backend.
- Cadastro com e-mail inválido ou senha vazia (comportamento do backend e mensagem no frontend).
- Envio real de e-mail no forgot-password ou exibição de link de recuperação (conforme config do emailService no backend).

---

## 8. Diagnóstico final do BLOCO C

**Classificação: APTO COM RESSALVAS**

O código está estruturalmente pronto para a etapa de validação manual no preview: fluxos de login, cadastro, forgot/reset, proteção de rota e uso do token estão implementados e conectados. As ressalvas (link /login em ForgotPassword, formato do user pós-refresh, logout sem limpeza do contexto) não impedem a execução do checklist do documento oficial, mas devem ser verificadas no preview e, se confirmadas, tratadas antes do fechamento oficial do bloco.

---

## 9. Top 5 bloqueadores reais

1. **"Voltar ao Login" em ForgotPassword indo para /login** — Pode quebrar a experiência no preview (tela em branco ou rota inexistente); documento oficial exige que o link leve à tela de login (/).
2. **User no contexto com formato { success, data } após refresh** — Componentes que dependem de user.email/user.id podem quebrar após F5; o documento exige formato consistente para persistência de sessão.
3. **Logout sem limpeza do estado no AuthContext** — Usuário "meio logado": ainda pode acessar rotas protegidas após clicar em Logout até refresh ou 401; critério de reprovação do documento inclui "após logout ainda é possível acessar rota protegida".
4. **Preview usando build ou backend diferente** — Sem inspeção no preview não se garante que a URL do backend e o bundle são os esperados; critério de consistência do documento.
5. **Cadastro com dados malformados gerando 500** — Backend sem validação de entrada pode retornar 500 para e-mail/senha inválidos; documento cita validação e mensagens coerentes.

---

## 10. Conclusão objetiva

O BLOCO C está **estruturalmente pronto** para a validação prática no preview: os fluxos de autenticação existem em código, o login inválido retorna 401 no backend, CORS permite previews Vercel, e a proteção de /game e a integração de forgot/reset estão implementadas. Os riscos identificados (link /login, formato do user após refresh, logout sem limpeza do contexto) são reais e devem ser cobertos pela validação manual e, se confirmados, corrigidos antes de marcar o bloco como validado. Nenhum bloqueador impossibilita a execução do roteiro de teste; o diagnóstico é **APTO COM RESSALVAS**.

---

Nenhuma alteração foi realizada. Nenhum deploy foi executado. Esta análise foi conduzida em modo estritamente READ-ONLY.
