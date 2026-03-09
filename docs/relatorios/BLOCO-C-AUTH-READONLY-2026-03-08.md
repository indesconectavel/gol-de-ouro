# BLOCO C — AUTENTICAÇÃO / ACESSO

**Data:** 2026-03-08  
**Modo:** READ-ONLY ABSOLUTO  
**Referências:** Baseline FyKKeg6zb | Produção atual ez1oc96t1 | Código local

---

## 1. Escopo auditado

| Tipo | Itens |
|------|--------|
| **Backend** | server-fly.js (app.post /api/auth/register, /api/auth/login, /api/auth/forgot-password, /api/auth/reset-password, /api/auth/verify-email, authenticateToken, app.get /api/user/profile, app.put /api/user/profile) |
| **Frontend** | goldeouro-player/src/contexts/AuthContext.jsx, goldeouro-player/src/components/ProtectedRoute.jsx, goldeouro-player/src/pages/Login.jsx, Register.jsx, ForgotPassword.jsx, ResetPassword.jsx, goldeouro-player/src/config/api.js (LOGIN, REGISTER, FORGOT_PASSWORD, RESET_PASSWORD, PROFILE), goldeouro-player/src/App.jsx (rotas públicas e protegidas) |
| **Serviços** | apiClient (interceptor Bearer), getAuthToken, getAuthHeaders, isAuthenticated em api.js |
| **Rotas** | /, /register, /forgot-password, /reset-password; protegidas: /dashboard, /game, /gameshoot, /profile, /withdraw, /pagamentos |

---

## 2. Fonte de verdade do bloco

- **Backend:** server-fly.js é o entrypoint em produção; auth está inline (não usa middlewares/auth.js montado em router). Rotas /api/auth/* e authenticateToken definidas em server-fly.js.
- **Frontend:** AuthContext + ProtectedRoute + api.js (API_ENDPOINTS) são a fonte de verdade local. Baseline validada (FyKKeg6zb) não documenta qual versão exata do AuthContext/ProtectedRoute estava no bundle index-qIGutT6K.js.
- **Conclusão:** O **código local** (backend + frontend) é a referência auditável; **produção atual** (ez1oc96t1) serve build desse código (ou main); **baseline validada** não tem documento que descreva linha a linha o fluxo de auth no bundle.

---

## 3. Evidências concretas

| Evidência | Local |
|-----------|--------|
| Login backend | server-fly.js ~837: POST /api/auth/login; bcrypt.compare; jwt.sign 24h; retorno token + user |
| Register backend | server-fly.js ~677: POST /api/auth/register; INSERT usuarios; token + user |
| Perfil backend | server-fly.js ~943: GET /api/user/profile, authenticateToken; SELECT usuarios |
| AuthContext login | AuthContext.jsx 50–72: apiClient.post(API_ENDPOINTS.LOGIN); localStorage authToken; setUser(userData) |
| AuthContext register | AuthContext.jsx 74–99: API_ENDPOINTS.REGISTER; token + user; login automático |
| ProtectedRoute | ProtectedRoute.jsx: useAuth(); se !user && !loading → redirect /; senão children |
| Rotas protegidas | App.jsx 42–71: Dashboard, /game, /gameshoot, Profile, Withdraw, Pagamentos dentro de ProtectedRoute |
| API base | api.js: VITE_BACKEND_URL ou https://goldeouro-backend-v2.fly.dev |
| Documentação fluxo | AUDITORIA-SUPREMA-BLOCO-G-FLUXO-JOGADOR-2026-03-08.md (cadastro, login, autenticação) |

---

## 4. Alinhamento com baseline validada

**Resposta:** **parcial**

- A baseline FyKKeg6zb (bundle index-qIGutT6K.js) foi validada para rotas /, /game, /dashboard e login em produção (BASELINE-FRONTEND-FYKKeg6zb-OFICIAL, baseline-frontend-routes.json). Não há registro de qual componente de login (Login.jsx) ou qual fluxo exato de AuthContext estava no bundle.
- O backend em produção (goldeouro-backend-v2.fly.dev) é o mesmo para baseline e produção atual; as rotas /api/auth/* não mudam por deployment do frontend. Logo, **auth backend** está alinhado à baseline na medida em que o mesmo servidor atende ambos.
- **Frontend auth:** não confirmado — não foi possível inspecionar o conteúdo do bundle index-qIGutT6K.js para comparar AuthContext/ProtectedRoute.

---

## 5. Alinhamento com produção atual

**Resposta:** **sim**

- Produção atual (ez1oc96t1) é o build do main/código atual. O frontend local (AuthContext, ProtectedRoute, Login, Register, api.js) gera esse build. Endpoints e fluxo (LOGIN, REGISTER, PROFILE, token em localStorage, redirect pós-login para /dashboard) estão definidos no código que gera o deployment ez1oc96t1.
- Backend é único (goldeouro-backend-v2.fly.dev); auth não depende do deployment do frontend.

---

## 6. Diferenças encontradas

| Tipo | Descrição |
|------|------------|
| **Visual** | VersionWarning e PwaSwUpdater no App.jsx local podem exibir barra/banner em produção atual que não existia ou era diferente na baseline (compare-preview-vs-baseline-risk.json). Não altera fluxo de login/logout. |
| **Ambiente** | Local pode usar VITE_BACKEND_URL diferente (ex.: localhost); produção usa goldeouro-backend-v2.fly.dev. Impacto apenas em qual servidor recebe login. |
| **Legado** | api.js contém logout que redireciona para '/login'; Login está em '/'. Pequena inconsistência de path se alguém chamar logout() de api.js em vez de AuthContext. |
| **Não deployado** | Nenhum bloco de auth “não deployado” identificado; o auth local é o que está no build atual. |

---

## 7. Risco operacional

**Classificação:** **baixo**

- Fluxo de login/register/logout e guarda de rotas estão implementados e documentados (AUDITORIA-SUPREMA-BLOCO-G). Risco de testar localmente algo não deployado no auth é baixo; o backend de auth é compartilhado e o frontend local gera o build da produção atual.

---

## 8. Pode usar o local como referência para este bloco?

**Resposta:** **sim**

- O bloco de autenticação local reflete a produção atual (ez1oc96t1) e o backend é comum. Para validar login, logout, register, rotas protegidas e perfil, o ambiente local é confiável. Ressalva: se a comparação for “igual à baseline FyKKeg6zb”, não há evidência documental do fluxo exato de auth na baseline (apenas que / e /dashboard respondem e bundle carrega).

---

## 9. Exceções que precisam ser registradas

1. **Baseline FyKKeg6zb:** Não está documentado qual versão do AuthContext/ProtectedRoute ou resposta do backend (estrutura token/user) estava no bundle. Qualquer afirmação “auth local = auth baseline” é **não confirmada**.
2. **Redirect pós-logout:** api.js logout() redireciona para '/login'; a rota de login é '/'. Registrar para evitar confusão em testes.
3. **Forgot/Reset password:** Backend expõe /api/auth/forgot-password e /api/auth/reset-password; frontend tem páginas ForgotPassword e ResetPassword. Não foi validado contra produção/baseline se o fluxo completo está ativo e igual.

---

## 10. Classificação final do bloco

**BLOCO ALINHADO COM RESSALVAS**

- Alinhado com **produção atual** (sim). Alinhado com **baseline validada** (parcial — backend sim; frontend não confirmado). Local pode ser usado como referência para auth com a ressalva de que a baseline não define o comportamento exato do auth no bundle.

---

*Auditoria READ-ONLY. Nenhum arquivo ou deploy foi alterado.*
