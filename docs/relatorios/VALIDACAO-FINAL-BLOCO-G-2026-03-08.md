# VALIDAÇÃO FINAL — BLOCO G (FLUXO DO JOGADOR)

**Data:** 2026-03-08  
**Modo:** READ-ONLY — nenhuma alteração de código, banco ou deploy.  
**Escopo:** Frontend (goldeouro-player), Backend (server-fly.js), consistência com banco (Supabase).

---

## Fluxo do jogador

### 1. Cadastro

| Camada | Implementação |
|--------|----------------|
| **Frontend** | Página `Register.jsx`: formulário (name, email, password, confirmPassword). Chama `useAuth().register(name, email, password)` → `AuthContext` → `apiClient.post(API_ENDPOINTS.REGISTER, { username: name, email, password })`. Em sucesso: token e user salvos no contexto e em `localStorage.authToken`, redirect para `/dashboard`. |
| **Backend** | `POST /api/auth/register` (server-fly.js ~703): validação, insert em `usuarios` (Supabase), geração de JWT (`expiresIn: '24h'`), retorno `{ token, user }`. |
| **Consistência** | Endpoint e payload alinhados. Frontend usa `username`; backend espera e persiste em `usuarios`. **OK.** |

### 2. Login

| Camada | Implementação |
|--------|----------------|
| **Frontend** | Página `Login.jsx`: `useAuth().login(email, password)` → `apiClient.post(API_ENDPOINTS.LOGIN, { email, password })`. Resposta: `localStorage.setItem('authToken', token)`, `setUser(userData)`, `navigate('/dashboard')`. |
| **Backend** | `POST /api/auth/login` (~866): consulta `usuarios` por email, verificação de senha, JWT retornado com payload (userId, email, username). |
| **Consistência** | Contrato de request/response alinhado. **OK.** |

### 3. Autenticação JWT

| Camada | Implementação |
|--------|----------------|
| **Frontend** | `apiClient`: interceptor de request lê `localStorage.getItem('authToken')` e envia `Authorization: Bearer ${token}`. Em 401: remove token e userData. Rotas protegidas via `ProtectedRoute`: exige `useAuth().user`; sem user redireciona para `/`. |
| **Backend** | Middleware `authenticateToken`: extrai Bearer do header, `jwt.verify(token, JWT_SECRET)`; sem token → 401, token inválido/expirado → 403. Todas as rotas de perfil, PIX, jogo e saque usam `authenticateToken`. |
| **Consistência** | Token único no header; backend valida em todas as rotas protegidas. **OK.** |

### 4. Consulta de saldo

| Camada | Implementação |
|--------|----------------|
| **Frontend** | Dashboard, GameShoot, Withdraw, Profile: `apiClient.get(API_ENDPOINTS.PROFILE)` → esperam `response.data.data.saldo`. GameShoot ainda usa `gameService.initialize()` que chama `/api/user/profile` e usa `response.data.data.saldo`. |
| **Backend** | `GET /api/user/profile` (authenticateToken) (~1013): lê `usuarios` por `req.user.userId`, retorna `{ success, data: { id, email, username, nome, saldo, ... } }`. Campo `saldo` vem do banco. |
| **Consistência** | Contrato e origem do saldo (Supabase `usuarios.saldo`) alinhados. **OK.** |

### 5. Depósito PIX

| Camada | Implementação |
|--------|----------------|
| **Frontend** | Página `Pagamentos.jsx`: valor + `apiClient.post('/api/payments/pix/criar', { amount: valorRecarga, description })`. Em sucesso: `setPagamentoAtual(response.data.data)`, exibe QR/código PIX. Listagem: `apiClient.get(API_ENDPOINTS.PIX_USER)` → `data.data.payments`. |
| **Backend** | `POST /api/payments/pix/criar` (authenticateToken) (~1735): valida valor (1–1000), integra Mercado Pago, insere em `pagamentos_pix`, retorna dados do pagamento (qr_code, pix_copy_paste, etc.). `GET /api/payments/pix/usuario` (~1900): lista pagamentos do usuário em `pagamentos_pix`, retorna `{ data: { payments, total } }`. Webhook atualiza status e saldo (reconciliação). |
| **Consistência** | Criar e listar PIX alinhados. **Ressalva:** Dashboard usa `pixResponse.data.data.historico_pagamentos`; o backend retorna `data.payments`. O bloco “últimos pagamentos” no Dashboard pode ficar vazio (chave incorreta). Pagamentos.jsx usa `data.payments` corretamente. |

### 6. Jogar / 7. Chute / 8. Resultado

| Camada | Implementação |
|--------|----------------|
| **Frontend** | `GameShoot.jsx`: inicialização via `gameService.initialize()` (profile + contador). Chute: `gameService.shoot(direction, amount)` com `amount = 1` (V1). `gameService` chama `apiClient.post('/api/games/shoot', { direction, amount })`. Resposta esperada: `result.result` (goal/miss), `result.novoSaldo`, `result.premio`, `result.isGolDeOuro`, etc. UI exibe gol/defesa, prêmio e Gol de Ouro quando aplicável. |
| **Backend** | `POST /api/games/shoot` (authenticateToken) (~1158): valida `direction` e `amount` (V1: apenas 1); verifica saldo em `usuarios`; sistema de lotes (gol a cada N chutes); debita aposta; em gol credita prêmio (+ Gol de Ouro quando for o caso); atualiza `usuarios.saldo`, `total_apostas`, `total_ganhos`; insere em `chutes` e ledger; retorna `{ success, data: shootResult }` com `result`, `premio`, `premioGolDeOuro`, `novoSaldo`, `loteProgress`, etc. |
| **Consistência** | Payload (direction, amount) e formato de resposta alinhados. Saldo atualizado no banco e refletido em `novoSaldo`. **OK.** |

### 9. Saque

| Camada | Implementação |
|--------|----------------|
| **Frontend** | `Withdraw.jsx`: saldo via `API_ENDPOINTS.PROFILE`; envio via `requestWithdraw(amount, pixKey, pixType)` em `withdrawService.js` → `apiClient.post(API_ENDPOINTS.WITHDRAW_REQUEST, { valor: amount, chave_pix: pixKey, tipo_chave: pixType })`. Histórico: `getWithdrawHistory()` → `GET /api/withdraw/history`, normalização para lista (amount, method, pixKey, date, status). |
| **Backend** | `POST /api/withdraw/request` (authenticateToken) (~1426): valida valor (mín. 10), chave PIX, idempotência, sem saque pendente duplicado; debita saldo e insere em `saques`; ledger. `GET /api/withdraw/history` (~1674): lista `saques` do usuário. |
| **Consistência** | Nomes de parâmetros (valor, chave_pix, tipo_chave) e fluxo de saldo/ledger alinhados. **OK.** |

### 10. Logout

| Camada | Implementação |
|--------|----------------|
| **Frontend** | Navigation e Dashboard: `handleLogout` tenta `POST /auth/logout` (backend não existe → 404), depois `localStorage.removeItem('authToken')` e `user`, `navigate('/')`. Logout efetivo é local; usuário deixa de acessar rotas protegidas. |
| **Backend** | Não há rota de logout; JWT válido até expirar (24h). |
| **Consistência** | Para V1, logout local é suficiente (ver AUDITORIA-LOGOUT-SISTEMA-2026-03-08.md). **OK.** |

---

## Integração frontend–backend

| Item | Status |
|------|--------|
| Base URL e CORS | Frontend usa `VITE_BACKEND_URL` / fallback; rotas relativas (`/api/...`). Backend expõe rotas sob `/api/auth`, `/api/user`, `/api/payments/pix`, `/api/games`, `/api/withdraw`. |
| Contrato de auth | Login/register: request (email/password ou username) e response (token + user) consistentes. |
| Rotas protegidas | Todas as rotas de perfil, PIX, shoot e withdraw usam `authenticateToken`; frontend envia Bearer em todas as chamadas autenticadas. |
| Perfil e saldo | GET /api/user/profile retorna `data.saldo`; frontend usa em Dashboard, GameShoot, Withdraw, Profile. |
| PIX | Criar e listar alinhados. Dashboard usa chave `historico_pagamentos` em vez de `payments` para lista PIX → ressalva. |
| Jogo | POST /api/games/shoot com direction + amount; resposta com result, premio, novoSaldo; gameService e GameShoot consomem corretamente. |
| Saque | POST /api/withdraw/request e GET /api/withdraw/history com payload e resposta compatíveis com withdrawService e Withdraw.jsx. |

---

## Segurança básica

- **JWT:** Expiração 24h; validação em todas as rotas protegidas; sem blacklist (aceitável para V1).
- **Rotas públicas:** Apenas login, register, forgot/reset password, termos, privacidade, download. Demais rotas do player protegidas por `ProtectedRoute` e por `authenticateToken` no backend.
- **Logout:** Token removido no cliente; sem token não há acesso às rotas protegidas.
- **Saldo e transações:** Débitos/créditos (chute, PIX, saque) feitos no backend com base em `req.user.userId` e dados no banco; frontend não altera saldo diretamente.

---

## Riscos e ressalvas

1. **Dashboard × lista PIX:** Uso de `data.historico_pagamentos` com backend retornando `data.payments` → bloco “últimos pagamentos/recent bets” no Dashboard pode ficar vazio. Não impede cadastro, login, depósito, jogo, saque ou logout.
2. **POST /auth/logout:** Frontend chama endpoint inexistente (404); logout local e redirect funcionam. Apenas ruído no console.
3. **Depósito PIX:** Depende de Mercado Pago e webhook para creditar saldo; fluxo de criar PIX e listar está integrado; confirmação de pagamento é assíncrona (comportamento esperado).

---

## Classificação final

**VALIDADO COM RESSALVAS**

- **Cadastro:** OK — criar conta e ir para o dashboard.
- **Login:** OK — autenticação e acesso às rotas protegidas.
- **Autenticação JWT:** OK — token enviado e validado; rotas protegidas cobertas.
- **Saldo:** OK — consulta alinhada ao banco.
- **Depósito PIX:** OK — criar PIX e listar pagamentos; ressalva apenas no Dashboard (chave `historico_pagamentos` vs `payments`).
- **Jogar / Chute / Resultado:** OK — shoot com valor fixo R$ 1,00, resultado (gol/defesa), prêmio e atualização de saldo consistentes.
- **Saque:** OK — solicitação e histórico integrados ao backend e ao banco.
- **Logout:** OK para V1 — logout local e redirect; sem inconsistência que impeça o fluxo.

O Bloco G atende ao critério de validação para a demo V1: o jogador consegue criar conta, fazer login, depositar (PIX), jogar, ver resultado, sacar e fazer logout, sem inconsistência crítica entre frontend e backend. A única ressalva relevante é a chave incorreta no Dashboard para a lista de PIX, com impacto apenas no bloco de “últimos pagamentos” na tela inicial, não no fluxo principal.
