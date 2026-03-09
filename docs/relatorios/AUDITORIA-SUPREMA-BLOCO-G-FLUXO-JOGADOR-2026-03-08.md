# AUDITORIA SUPREMA — BLOCO G (FLUXO DO JOGADOR)

**Data:** 2026-03-08  
**Modo:** READ-ONLY ABSOLUTO — nenhuma alteração de código, banco ou deploy.  
**Objetivo:** Validar o fluxo completo do jogador no sistema Gol de Ouro V1 e a consistência entre frontend, backend, banco e integrações.

---

## 1. Visão geral do fluxo do jogador

### Mapa técnico (PLAYER → FRONTEND → API → BACKEND → DATABASE → RESPONSE)

| Etapa | Player | Frontend (goldeouro-player) | API Call | Backend (server-fly.js) | Database / Integração | Response |
|-------|--------|-----------------------------|----------|--------------------------|------------------------|----------|
| 1. Cadastro | Preenche registro | Register.jsx → useAuth().register(name, email, password) | POST /api/auth/register | app.post('/api/auth/register') | usuarios INSERT (email, username, senha_hash, saldo inicial, tipo, total_apostas, total_ganhos) | token + user |
| 2. Login | Preenche login | Login.jsx → useAuth().login(email, password) | POST /api/auth/login | app.post('/api/auth/login') | usuarios SELECT; bcrypt.compare; opcional UPDATE saldo inicial; jwt.sign | token + user |
| 3. Autenticação | — | apiClient interceptor: Authorization Bearer (localStorage authToken) | Todas as rotas protegidas | authenticateToken: jwt.verify(req) | — | 401/403 se inválido |
| 4. Consulta saldo | Abre dashboard/perfil | Dashboard.jsx loadUserData → apiClient.get(PROFILE); gameService.loadUserData → GET /api/user/profile | GET /api/user/profile | app.get('/api/user/profile', authenticateToken) | usuarios SELECT (id, saldo, total_apostas, total_ganhos, ...) | success, data.saldo |
| 5. Depósito PIX | Cria PIX na tela Pagamentos | Pagamentos.jsx → apiClient.post('/api/payments/pix/criar', { amount }) | POST /api/payments/pix/criar | app.post(..., authenticateToken) | Mercado Pago POST payment; pagamentos_pix INSERT (pending) | qr_code, status pending |
| 5b. Aprovação PIX | MP aprova pagamento | (sem chamada direta; frontend pode polling ou recarregar) | — | POST /api/payments/webhook (MP) | pagamentos_pix UPDATE approved; usuarios UPDATE saldo; createLedgerEntry deposito_aprovado | — |
| 6. Entrar no jogo | Acessa tela do jogo | Game page carrega; gameService.loadUserData() (saldo); ao chutar → processShot | GET /api/user/profile (saldo) | Validação de saldo no shoot | usuarios SELECT saldo | — |
| 7. Chute | Executa chute | gameService.processShot(direction, amount) → POST /api/games/shoot | POST /api/games/shoot | app.post(..., authenticateToken); valida amount===1; SELECT saldo; getOrCreateLoteByValue; INSERT chutes; UPDATE usuarios (saldo, total_apostas, total_ganhos); createLedgerEntry chute_miss/chute_aposta/chute_premio | chutes INSERT; usuarios UPDATE; ledger_financeiro INSERT | result, novoSaldo, premio, premioGolDeOuro |
| 8. Resultado | Vê miss/goal | Frontend usa response.data.result, novoSaldo | — | Lógica no shoot: isGoal = shotIndex === winnerIndex; premio 5 ou +100 gol de ouro; UPDATE saldo já na etapa 7 | — | Consistente com saldo e ledger |
| 9. Saque | Solicita saque | Withdraw.jsx → withdrawService.requestWithdraw(amount, pixKey, pixType) | POST /api/withdraw/request | app.post(..., authenticateToken); UPDATE usuarios saldo; INSERT saques; createLedgerEntry withdraw_request | usuarios UPDATE; saques INSERT; ledger_financeiro INSERT | success, data (id, amount, status) |
| 10. Histórico saque | Consulta histórico | GET /api/withdraw/history | app.get(..., authenticateToken) | saques SELECT | lista saques |

**Frontend base URL:** `API_BASE_URL` (env VITE_BACKEND_URL ou default goldeouro-backend-v2.fly.dev). **Endpoints:** definidos em `goldeouro-player/src/config/api.js` (LOGIN, REGISTER, PROFILE, PIX_CREATE, PIX_USER, GAMES_SHOOT, WITHDRAW_REQUEST, WITHDRAW_HISTORY) e usados por AuthContext, gameService, paymentService, withdrawService, páginas.

---

## 2. Cadastro

**Status:** Consistente.

- **Endpoint:** POST /api/auth/register (server-fly.js ~703).
- **Campos obrigatórios:** email, password, username (req.body). Validação: verifica email já existe (SELECT usuarios por email); se existir e senha bater, login automático; senão 400 "Email já cadastrado".
- **Criação de usuário:** INSERT em usuarios com email, username, senha_hash (bcrypt), saldo: calculateInitialBalance('regular'), tipo: 'jogador', ativo: true, email_verificado: false, total_apostas: 0, total_ganhos: 0.
- **Segurança:** Senha hasheada com bcrypt (saltRounds 10); não retorna senha_hash na resposta.
- **Frontend:** AuthContext register() envia POST API_ENDPOINTS.REGISTER com username, email, password; salva token e user no estado e localStorage. Register.jsx usa useAuth().register.

**Evidência:** Backend INSERT em usuarios (linhas 799–814); frontend API_ENDPOINTS.REGISTER = '/api/auth/register'; AuthContext linha 79.

---

## 3. Login

**Status:** Consistente.

- **Endpoint:** POST /api/auth/login (server-fly.js ~866).
- **Validação:** email e password obrigatórios (string); SELECT usuarios por email e ativo=true; bcrypt.compare(password, user.senha_hash); se saldo 0 ou null, UPDATE saldo inicial (calculateInitialBalance).
- **JWT:** jwt.sign({ userId, email, username }, JWT_SECRET, { expiresIn: '24h' }).
- **Resposta:** { success: true, token, user: { id, email, username, saldo, tipo, total_apostas, total_ganhos } }.
- **Frontend:** AuthContext login() POST API_ENDPOINTS.LOGIN com email, password; extrai response.data.token e response.data.user; localStorage.setItem('authToken', token); setUser(userData). Login.jsx chama login() e navega para /dashboard em sucesso.

**Evidência:** Backend linhas 896–996; frontend AuthContext linhas 55–59; API_ENDPOINTS.LOGIN = '/api/auth/login'.

---

## 4. Consulta de saldo

**Status:** Consistente.

- **Endpoint:** GET /api/user/profile (authenticateToken). SELECT * de usuarios por id = req.user.userId; retorna data com id, email, username, saldo, tipo, total_apostas, total_ganhos, etc.
- **Fonte do saldo:** usuarios.saldo (única fonte na resposta de perfil).
- **Frontend:** Dashboard loadUserData() chama apiClient.get(API_ENDPOINTS.PROFILE) e setBalance(profileResponse.data.data.saldo). GameService loadUserData() GET /api/user/profile e this.userBalance = response.data.data.saldo. Withdraw.jsx também usa PROFILE para saldo.

**Evidência:** Backend 1022–1049; frontend Dashboard 42–46, gameService 34–36, API_ENDPOINTS.PROFILE = '/api/user/profile'.

---

## 5. Depósito PIX

**Status:** Consistente.

- **Criação:** POST /api/payments/pix/criar (authenticateToken). Body: amount. Backend chama Mercado Pago (POST payment), depois INSERT em pagamentos_pix (usuario_id, external_id, payment_id, amount, valor, status: 'pending', qr_code, etc.). Resposta: qr_code, pix_copy_paste, status pending.
- **Webhook:** POST /api/payments/webhook (sem JWT; chamado pelo MP). Claim atômico em pagamentos_pix (UPDATE status 'approved'); UPDATE usuarios.saldo (+ valor); createLedgerEntry(tipo: 'deposito_aprovado', referencia: id pagamento).
- **Frontend:** Pagamentos.jsx POST /api/payments/pix/criar com amount; paymentService usa config.pixEndpoint = '/api/payments/pix/criar'. Histórico: GET /api/payments/pix/usuario (backend SELECT pagamentos_pix do usuario).
- **Consistência:** pagamentos_pix registra o PIX; webhook/reconcile atualizam saldo e ledger; frontend usa os mesmos endpoints.

**Evidência:** Backend PIX criar 1735–1896, webhook 1998–2141, reconcile + ledger em auditorias anteriores; frontend Pagamentos.jsx 50, paymentService 27–28, 74–76 (createPix usa pixEndpoint).

---

## 6. Entrada no jogo

**Status:** Consistente.

- Não existe endpoint separado "entrar no tabuleiro" na V1. O jogador acessa a página do jogo; o frontend carrega saldo (GET /api/user/profile) e, ao chutar, envia POST /api/games/shoot. A validação de saldo mínimo (e débito da aposta) ocorre no próprio shoot.
- **Validação de saldo:** No shoot, backend SELECT saldo do usuario; se user.saldo < amount retorna 400 "Saldo insuficiente". O débito (miss) ou débito+crédito (goal) é feito no mesmo handler após INSERT em chutes.
- **Participação:** O registro de participação é o INSERT em chutes e a inclusão do chute no lote em memória (getOrCreateLoteByValue). Não há tabela separada "participação" além de chutes.

**Evidência:** Backend shoot 1186–1205 (select saldo, validação saldo < amount); gameService loadUserData + processShot (84–88); frontend não chama endpoint "entrar" separado.

---

## 7. Chute

**Status:** Consistente.

- **Endpoint:** POST /api/games/shoot (authenticateToken). Body: direction, amount. Validação: amount === 1 (V1); saldo >= amount; lote integridade (LoteIntegrityValidator). INSERT chutes (usuario_id, lote_id, valor_aposta, resultado, premio, premio_gol_de_ouro, ...) com .select('id').single(); UPDATE usuarios (saldo, total_apostas, total_ganhos); createLedgerEntry chute_miss ou chute_aposta + chute_premio.
- **Frontend:** gameService.processShot(direction, amount) valida direction em goalZones e amount === 1; POST /api/games/shoot com { direction, amount }; atualiza this.userBalance = result.novoSaldo.
- **Registro em chutes:** Sim (backend INSERT). **Registro no ledger:** Sim (createLedgerEntry para chute_miss ou chute_aposta e chute_premio).

**Evidência:** Backend 1295–1373 (insert chutes, update saldo, ledger); frontend gameService 68–88; API_ENDPOINTS.GAMES_SHOOT = '/api/games/shoot'.

---

## 8. Resultado

**Status:** Consistente.

- **Lógica miss/goal:** isGoal = (shotIndex === lote.winnerIndex); lote.winnerIndex = config.size - 1 (10º chute). result = isGoal ? 'goal' : 'miss'. Premio: goal 5; gol de ouro +100.
- **Atualização de saldo:** No mesmo handler do chute: MISS → saldo - amount; GOAL → saldo - amount + premio + premioGolDeOuro.
- **Ledger:** chute_miss (valor -1); goal: chute_aposta (-1) e chute_premio (premio + premioGolDeOuro). Consistência: saldo e ledger refletem o mesmo evento; fórmula saldo_final = saldo_anterior - aposta + premio (em goal) está implementada.

**Evidência:** Backend 1232–1240 (isGoal, result), 1242–1254 (premios), 1346–1400 (update saldo e ledger); relatórios de reconciliação e validação do Bloco D.

---

## 9. Saque

**Status:** Consistente.

- **Endpoint:** POST /api/withdraw/request (authenticateToken). Body: valor, chave_pix, tipo_chave. Validação PixValidator; valor mínimo 10; idempotência por correlation_id (x-idempotency-key ou x-correlation-id); bloqueio de saque pendente duplicado. UPDATE usuarios (saldo - valor, lock otimista); INSERT saques; createLedgerEntry(withdraw_request); em falha do ledger, rollbackWithdraw.
- **Worker payout:** processPendingWithdrawals (chamado por setInterval ou job); webhook Mercado Pago para payout: payout_confirmado ou falha_payout + rollbackWithdraw. Ledger: withdraw_request, payout_confirmado, falha_payout, rollback.
- **Frontend:** withdrawService.requestWithdraw(amount, pixKey, pixType) → POST API_ENDPOINTS.WITHDRAW_REQUEST com valor, chave_pix, tipo_chave. getWithdrawHistory → GET WITHDRAW_HISTORY.
- **Saldo:** Reduzido no request (UPDATE usuarios). **Ledger:** withdraw_request no request; payout_confirmado ou rollback no webhook/worker. Consistente.

**Evidência:** Backend 1426–1640 (request), 2152–2274 (webhook payout), processPendingWithdrawals; frontend withdrawService 45–60, 68–74; API_ENDPOINTS.WITHDRAW_REQUEST e WITHDRAW_HISTORY.

---

## 10. Integração frontend-backend

**Status:** Consistente, com uma ressalva.

- **Chamadas API:** Login (POST /api/auth/login), Register (POST /api/auth/register), Profile (GET /api/user/profile), PIX criar (POST /api/payments/pix/criar), PIX usuario (GET /api/payments/pix/usuario), Shoot (POST /api/games/shoot), Withdraw request (POST /api/withdraw/request), Withdraw history (GET /api/withdraw/history). Todos os endpoints existem no backend e estão protegidos por authenticateToken, exceto register, login e webhook.
- **Token:** apiClient interceptor adiciona Authorization: Bearer (localStorage authToken). Backend authenticateToken valida JWT e preenche req.user (userId, email, username).
- **Tratamento de erro:** apiClient em 401 remove authToken e userData; AuthContext em login/register trata response e retorna success/error. Páginas usam toast/estado para feedback.
- **Ressalva:** O frontend chama POST /auth/logout (Dashboard.jsx 85, Navigation.jsx 68) com { token }. O backend **não** expõe rota /auth/logout (não encontrada em server-fly.js). A chamada falha (404 ou equivalente), mas o frontend faz logout local mesmo assim ("Mesmo com erro, fazer logout local"), então o fluxo de sair da aplicação funciona; apenas a chamada ao backend é inexistente.

**Evidência:** api.js API_ENDPOINTS; apiClient interceptor; AuthContext; Páginas que usam apiClient/API_ENDPOINTS; server-fly.js lista de rotas (sem /auth/logout).

---

## 11. Riscos identificados

1. **Logout sem endpoint:** Frontend chama POST /auth/logout; backend não implementa. Efeito: request falha; logout local ocorre normalmente. Risco baixo para a demo V1.
2. **Dependência de ambiente:** Token MP, Supabase, JWT_SECRET e BACKEND_URL devem estar configurados; sem eles, depósito ou login podem retornar 503 ou erro. Não é inconsistência de fluxo, e sim pré-requisito de ambiente.
3. **Webhook PIX:** Depende de o MP conseguir alcançar a URL do backend (BACKEND_URL/api/payments/webhook). Se não houver, o saldo só é creditado via reconcilePendingPayments quando o backend consultar o MP. Fluxo ainda consistente; apenas atraso possível.

Nenhum risco que impeça o fluxo cadastro → login → depositar → jogar → resultado → sacar para a demo V1, desde que ambiente e integrações estejam configurados.

---

## 12. Classificação final

**VALIDADO COM RESSALVAS**

- **Cadastro:** Implementado; criação de usuário e saldo inicial em usuarios; frontend usa /api/auth/register.
- **Login:** Implementado; JWT gerado e retornado; frontend usa /api/auth/login e armazena token; rotas protegidas usam authenticateToken.
- **Consulta de saldo:** GET /api/user/profile retorna usuarios.saldo; Dashboard e game usam esse endpoint para exibir saldo.
- **Depósito PIX:** Criação via /api/payments/pix/criar (MP + pagamentos_pix); webhook/reconcile atualizam status, saldo e ledger deposito_aprovado; frontend usa os endpoints corretos.
- **Entrada no jogo:** Sem endpoint dedicado; validação de saldo e débito no shoot; consistente para V1.
- **Chute:** POST /api/games/shoot com validação de saldo, INSERT chutes, UPDATE saldo e totalizadores, ledger chute_miss/chute_aposta/chute_premio; frontend envia direction e amount corretos.
- **Resultado:** miss/goal e premios definidos no backend; saldo e ledger atualizados no mesmo fluxo do chute; consistente.
- **Saque:** POST /api/withdraw/request com débito de saldo, INSERT saques, ledger withdraw_request; webhook/worker para payout e rollback; frontend usa WITHDRAW_REQUEST e WITHDRAW_HISTORY.

**Ressalvas:** (1) Endpoint de logout inexistente no backend; logout funciona no frontend por limpeza local. (2) Fluxo depende de configuração de ambiente (MP, Supabase, JWT, URL do backend).

O BLOCO G atende ao critério de validação: o jogador pode se cadastrar, fazer login, depositar, jogar, receber resultado e sacar, sem inconsistência lógica entre frontend, backend e banco para a demo V1.
