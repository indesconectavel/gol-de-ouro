# AUDITORIA SUPREMA — CONTRATOS DE API

**Data:** 2026-03-08  
**Modo:** READ-ONLY ABSOLUTO — nenhuma alteração de código, patch, deploy ou banco.  
**Objetivo:** Varredura completa para detectar inconsistências de contrato entre frontend (goldeouro-player) e backend (server-fly.js).

---

## 1. Endpoints usados pelo frontend

### Autenticação

| Arquivo | Função | Método | Endpoint | Payload / esperado na resposta |
|---------|--------|--------|----------|--------------------------------|
| AuthContext.jsx | login | POST | API_ENDPOINTS.LOGIN → /api/auth/login | Body: { email, password }. Espera: response.data.token, response.data.user → setUser(userData). |
| AuthContext.jsx | register | POST | API_ENDPOINTS.REGISTER → /api/auth/register | Body: { username: name, email, password }. Espera: response.data.token, response.data.user. |
| AuthContext.jsx | useEffect (verificar token) | GET | API_ENDPOINTS.PROFILE → /api/user/profile | Espera: response.data (usa setUser(response.data) — **formato incorreto**; backend retorna { success, data }). |
| Dashboard.jsx, Navigation.jsx | handleLogout | POST | /auth/logout | Body: { token }. **Backend não implementa esta rota.** |
| ForgotPassword.jsx | submit | POST | API_ENDPOINTS.FORGOT_PASSWORD → /api/auth/forgot-password | Body: { email }. |
| ResetPassword.jsx | submit | POST | API_ENDPOINTS.RESET_PASSWORD → /api/auth/reset-password | Body: { token, newPassword } (confirmar no arquivo). |

### Perfil e usuário

| Arquivo | Função | Método | Endpoint | Payload / esperado |
|---------|--------|--------|----------|--------------------|
| Dashboard.jsx | loadUserData | GET | API_ENDPOINTS.PROFILE → /api/user/profile | Espera: response.data.success, response.data.data (setUser(data), setBalance(data.saldo)). |
| Profile.jsx | loadUserProfile | GET | API_ENDPOINTS.PROFILE | Espera: response.data.data (nome, email, saldo, total_apostas, total_ganhos, created_at, tipo). |
| Profile.jsx | handleSave | PUT | /api/user/profile | Body: { nome, email }. |
| gameService.js | loadUserData | GET | /api/user/profile | Espera: response.data.success, response.data.data.saldo. |
| Withdraw.jsx | loadUserData | GET | API_ENDPOINTS.PROFILE | Espera: response.data.data.saldo. |

### Pagamentos PIX

| Arquivo | Função | Método | Endpoint | Payload / esperado |
|---------|--------|--------|----------|--------------------|
| Pagamentos.jsx | carregarDados | GET | API_ENDPOINTS.PIX_USER → /api/payments/pix/usuario | Espera: response.data.data.payments. |
| Pagamentos.jsx | criarPagamentoPix | POST | /api/payments/pix/criar | Body: { amount, description }. Espera: response.data.success, response.data.data. |
| Dashboard.jsx | loadUserData | GET | API_ENDPOINTS.PIX_USER | Espera: response.data.data.**historico_pagamentos** — **backend retorna data.payments**. |
| paymentService.js | createPix | POST | this.config.pixEndpoint → /api/payments/pix/criar | Body: amount, pixKey, description, etc. Usado para **saque** em fluxo legado; depósito usa Pagamentos.jsx direto. |
| paymentService.js | checkPixStatus | GET | pixStatusEndpoint + /${transactionId} → /api/payments/pix/status/:id | **Backend não implementa GET /api/payments/pix/status/:id.** |
| paymentService.js | getUserPix | GET | pixUserEndpoint → /api/payments/pix/usuario | Retorna response.data inteiro; quem consome deve usar .data.payments. |
| dashboardTest.js | teste PIX | GET | API_ENDPOINTS.PIX_USER | Apenas verifica sucesso; não lê corpo. |

### Jogo

| Arquivo | Função | Método | Endpoint | Payload / esperado |
|---------|--------|--------|----------|--------------------|
| gameService.js | loadGlobalMetrics | GET | /api/metrics | Espera: response.data.data.**contador_chutes_global**, response.data.data.**ultimo_gol_de_ouro**. Backend retorna **totalChutes**, **ultimoGolDeOuro** (camelCase). |
| gameService.js | processShot | POST | /api/games/shoot | Body: { direction, amount }. Espera: response.data.data (novoSaldo, contadorGlobal, result, premio, premioGolDeOuro, isGolDeOuro, loteId, loteProgress, timestamp). |

### Saque

| Arquivo | Função | Método | Endpoint | Payload / esperado |
|---------|--------|--------|----------|--------------------|
| withdrawService.js | requestWithdraw | POST | API_ENDPOINTS.WITHDRAW_REQUEST → /api/withdraw/request | Body: { valor, chave_pix, tipo_chave }. Espera: response.data.success, response.data.data. |
| withdrawService.js | getWithdrawHistory | GET | API_ENDPOINTS.WITHDRAW_HISTORY → /api/withdraw/history | Espera: response.data.data.saques (mapeia para amount, method, pixKey, date, status). |

### Outros (config / health / meta)

| Arquivo | Função | Método | Endpoint | Observação |
|---------|--------|--------|----------|------------|
| config/api.js | API_ENDPOINTS | — | META: /meta, HEALTH: /health, PIX_STATUS: /api/payments/pix/status | Apenas definição. |
| dashboardTest.js | testDashboardLoading | GET | API_ENDPOINTS.META → /meta | Verifica sucesso. |
| usePerformanceMonitor.jsx | — | HEAD / GET | url / endpoint | Fetch genérico. |
| useCachedAPI.jsx | — | fetch(url) | Variável | Genérico. |
| healthCheck.js | — | GET | baseUrl/health, baseUrl/readiness | **Backend não expõe /readiness.** |
| cdn.js | — | fetch | getCDNUrl('/health') | CDN. |

### Endpoints chamados pelo frontend que **não** existem no backend (código legado/opcional)

| Arquivo | Método | Endpoint | Uso |
|---------|--------|----------|-----|
| PremiumFeatures.jsx | GET | /api/user/premium-status | fetch. |
| PremiumFeatures.jsx | POST | /api/premium/activate, /api/premium/cancel | fetch. |
| useNotifications.js | GET | /api/user/notifications | apiClient. |
| useNotifications.js | PUT | /api/user/notifications/:id/read, /api/user/notifications/read-all | apiClient. |
| useNotifications.js | DELETE | /api/user/notifications/:id | apiClient. |
| useNotifications.js | POST | /api/user/notifications/subscribe | apiClient. |
| usePushNotifications.jsx | POST/GET | /api/push/subscribe, /api/push/unsubscribe, /api/push/test | fetch. |
| AdvancedReports.jsx | POST | /api/reports/generate | fetch. |
| ReferralSystem.jsx | GET/POST | /api/referrals/data, /api/referrals/generate | fetch. |
| useAdvancedGamification.js | GET | /api/user/gamification | apiClient. |
| useAdvancedGamification.js | POST | /api/user/xp, /api/user/achievements/check, /api/user/badges/check | apiClient. |
| useAdvancedGamification.js | GET | /api/ranking?period= | apiClient. |
| AvatarSystem.jsx | POST/PUT | /api/user/avatar | apiClient. |

---

## 2. Endpoints reais do backend (server-fly.js)

### Autenticação

| Método | Endpoint | Auth | Payload esperado | Resposta principal |
|--------|----------|------|------------------|--------------------|
| POST | /api/auth/register | Não | email, password, username | success, token, user (id, email, username, saldo, tipo, …) |
| POST | /api/auth/login | Não | email, password | success, token, user (id, email, username, saldo, …) |
| POST | /auth/login | Não | compatibilidade | idem login |
| POST | /api/auth/forgot-password | Não | email | success, message |
| POST | /api/auth/reset-password | Não | token, newPassword (etc.) | success, message |
| POST | /api/auth/verify-email | Não | token | success, message |
| PUT | /api/auth/change-password | Sim | oldPassword, newPassword | success, message |

### Perfil

| Método | Endpoint | Auth | Resposta principal |
|--------|----------|------|--------------------|
| GET | /api/user/profile | Sim | success, data: { id, email, username, nome, saldo, tipo, total_apostas, total_ganhos, created_at, updated_at } |
| PUT | /api/user/profile | Sim | success, data (perfil atualizado) |

### Jogo

| Método | Endpoint | Auth | Payload | Resposta principal |
|--------|----------|------|---------|--------------------|
| POST | /api/games/shoot | Sim | direction, amount | success, data: { loteId, result, premio, premioGolDeOuro, novoSaldo, contadorGlobal, loteProgress, isGolDeOuro, timestamp, … } |

### Saque

| Método | Endpoint | Auth | Payload | Resposta principal |
|--------|----------|------|---------|--------------------|
| POST | /api/withdraw/request | Sim | valor, chave_pix, tipo_chave | success, data: { id, amount, status, … } |
| GET | /api/withdraw/history | Sim | — | success, data: { saques: [...], total } |

### Pagamentos PIX

| Método | Endpoint | Auth | Payload / resposta |
|--------|----------|------|--------------------|
| POST | /api/payments/pix/criar | Sim | amount (opcional: description, cpf) | success, data: { qr_code, pix_copy_paste, … } |
| GET | /api/payments/pix/usuario | Sim | — | success, data: { **payments**: [...], total } |
| POST | /api/payments/webhook | Não | body Mercado Pago | 200. |
| POST | /webhooks/mercadopago | Não | idem | 200. |

**Não existe no backend:** GET /api/payments/pix/status, GET /api/payments/pix/status/:id.

### Métricas, health, meta

| Método | Endpoint | Auth | Resposta principal |
|--------|----------|------|--------------------|
| GET | /api/metrics | Não | success, data: { **totalChutes**, **ultimoGolDeOuro**, totalUsuarios, sistemaOnline, timestamp } |
| GET | /meta | Não | JSON (compatibilidade) |
| GET | /health | Não | status, uptime, etc. |

**Não existe:** GET /readiness.

### Admin e outros

| Método | Endpoint | Auth | Observação |
|--------|----------|------|------------|
| POST | /api/admin/bootstrap | Sim | — |
| POST | /api/admin/reconcile-ledger | Sim | — |
| POST | /api/admin/check-ledger-balance | Sim | — |
| GET | /api/production-status | Não | — |
| GET | /api/debug/token | Não | — |
| GET | /usuario/perfil | Sim | compatibilidade perfil |
| GET | /api/fila/entrar | Sim | fila/lotes |

---

## 3. Inconsistências encontradas

| # | Tipo | Frontend | Backend | Detalhe |
|---|------|----------|---------|---------|
| 1 | Endpoint inexistente | POST /auth/logout (Dashboard, Navigation) | Rota não existe | Retorno 404; frontend faz logout local no catch. |
| 2 | Campo resposta | Dashboard: response.data.data.**historico_pagamentos** | GET /api/payments/pix/usuario retorna data.**payments** | Lista “Apostas Recentes” sempre vazia. |
| 3 | Endpoint inexistente | paymentService: GET /api/payments/pix/status/:id | Rota não existe | checkPixStatus falha se usado. |
| 4 | Estrutura resposta | AuthContext: setUser(**response.data**) após GET profile | GET /api/user/profile retorna { success, **data**: { id, email, … } } | Após refresh, user = { success, data }; user.id/user.email undefined. Login/register setam user = objeto interno. |
| 5 | Nomes de campos | gameService: response.data.data.**contador_chutes_global**, **ultimo_gol_de_ouro** | GET /api/metrics retorna data.**totalChutes**, **ultimoGolDeOuro** | Fallback || 0 mascara; contador global/Gol de Ouro podem ficar 0 na UI. |
| 6 | Endpoint inexistente | healthCheck: GET **/readiness** | Só existe /health | Falha se frontend depender de /readiness. |
| 7 | Endpoints inexistentes | Premium, Notifications, Push, Reports, Referrals, Gamification, XP, Achievements, Badges, Ranking, Avatar | Nenhuma rota em server-fly.js | 404 em chamadas reais; features opcionais ou legado. |

---

## 4. Classificação por impacto

| # | Inconsistência | Classificação |
|---|----------------|---------------|
| 1 | POST /auth/logout inexistente | **IMPACTO VISUAL** — requisição falha no console; logout local funciona. |
| 2 | historico_pagamentos vs payments (Dashboard) | **IMPACTO VISUAL** — bloco “Apostas Recentes” sempre vazio. |
| 3 | GET /api/payments/pix/status/:id inexistente | **IMPACTO FUNCIONAL** se polling de status PIX for usado; Pagamentos.jsx não depende disso para criar PIX. |
| 4 | AuthContext setUser(response.data) no profile | **IMPACTO FUNCIONAL** — após refresh, user tem formato errado; exibição de nome/email pode quebrar onde usa user.id/user.email. |
| 5 | totalChutes/ultimoGolDeOuro vs contador_chutes_global/ultimo_gol_de_ouro | **IMPACTO VISUAL** — contador global e “próximo Gol de Ouro” podem ficar 0. |
| 6 | GET /readiness inexistente | **IMPACTO FUNCIONAL** apenas se healthCheck for usado para decisão crítica; senão marginal. |
| 7 | Premium, Notifications, Push, Reports, Referrals, Gamification, Avatar, etc. | **CÓDIGO LEGADO / OPCIONAL** — componentes podem falhar ou ficar vazios; fluxo principal não depende. |

---

## 5. O que quebra a demo

- **AuthContext setUser(response.data)** no GET profile: após recarregar a página com token, o objeto `user` fica no formato { success, data } em vez do objeto de perfil. Qualquer uso de `user.id`, `user.email` ou `user.nome` (ex.: header, Profile) pode quebrar ou exibir vazio. **Pode impactar demo** se o usuário recarregar na área logada.
- **GET /api/payments/pix/status/:id**: se em algum fluxo o frontend fizer polling de status do PIX por essa rota, a requisição falha. **Não quebra** o fluxo atual de depósito (criar PIX e listar em Pagamentos/Dashboard), pois não há uso ativo desse endpoint no fluxo principal.

Demais itens (logout 404, historico_pagamentos, métricas em camelCase, /readiness, endpoints opcionais) **não impedem** o fluxo principal: cadastro → login → saldo → depósito PIX → jogar → resultado → saque → logout.

---

## 6. O que não quebra a demo

- **POST /auth/logout**: frontend trata erro e faz logout local + redirect.
- **historico_pagamentos**: apenas lista vazia no Dashboard; depósito e lista em Pagamentos funcionam.
- **totalChutes / ultimoGolDeOuro**: gameService usa fallback 0; jogo e chute funcionam.
- **Endpoints opcionais** (premium, notifications, push, reports, referrals, gamification, avatar): não fazem parte do fluxo mínimo da demo; falham em 404 ou ficam inativos.
- **GET /readiness**: só impacta se houver uso explícito para health check crítico.

---

## 7. Código legado ou morto

- **Chamadas a endpoints não implementados:** PremiumFeatures, useNotifications, usePushNotifications, AdvancedReports, ReferralSystem, useAdvancedGamification (gamification, xp, achievements, badges, ranking), AvatarSystem — todas apontam para rotas que não existem em server-fly.js. Tratam-se de features não entregues ou legado; o player atual funciona sem elas.
- **paymentService.createPix** com pixKey/description: usado em contexto de saque em versões antigas; fluxo atual de saque usa withdrawService (POST /api/withdraw/request). Depósito usa Pagamentos.jsx com POST /api/payments/pix/criar (amount, description).
- **API_ENDPOINTS** PIX_STATUS, GAMES_QUEUE_ENTRAR, GAMES_STATUS: definidos no config; backend não expõe GET /api/payments/pix/status; GET /api/games/join-lote e GET /api/games/status podem existir ou não (não listados nas rotas verificadas para o fluxo principal).

---

## 8. Conclusão final

### Contratos de API estão consistentes para a demo?

**Em grande parte, sim.** Os fluxos essenciais (cadastro, login, perfil, saldo, depósito PIX, jogo/chute, saque, logout local) usam endpoints existentes e payloads/respostas alinhados, com exceções pontuais:

- **Dashboard PIX:** frontend espera `historico_pagamentos`; backend envia `payments` → impacto apenas visual (lista vazia).
- **AuthContext ao carregar perfil:** usa `response.data` em vez de `response.data.data` → risco funcional após refresh.
- **Métricas:** nomes diferentes (totalChutes/ultimoGolDeOuro vs contador_chutes_global/ultimo_gol_de_ouro) → impacto visual (contadores em 0).
- **POST /auth/logout** e **GET /api/payments/pix/status/:id** inexistentes → não bloqueiam o fluxo principal.

### Existe algo que ainda bloqueia a apresentação?

- **Possível bloqueio:** formato errado de `user` no AuthContext após refresh (setUser(response.data)). Se a demo incluir “recarregar a página estando logado” e a UI depender de `user.id` ou `user.email`, pode quebrar. Se a navegação for sempre após login sem refresh, não bloqueia.
- Nenhum outro ponto listado impede a sequência: criar conta → login → ver saldo → depositar (PIX) → jogar → ver resultado → sacar → sair.

### Quais inconsistências restantes são apenas cosméticas?

- Lista “Apostas Recentes” vazia (historico_pagamentos).
- Requisição 404 no logout (sem impacto no comportamento).
- Contador global e “próximo Gol de Ouro” zerados (nomes de campos em /api/metrics).
- Falhas em componentes que chamam premium, notifications, push, reports, referrals, gamification, avatar (features não implementadas no backend).

---

**CLASSIFICAÇÃO FINAL: VALIDADO COM RESSALVAS**

- Fluxo principal da demo (cadastro, login, saldo, depósito, jogo, saque, logout) está coberto por contratos existentes e compatíveis.
- Ressalvas: (1) AuthContext profile setUser(response.data) — risco após refresh; (2) Dashboard historico_pagamentos → lista vazia; (3) métricas com nomes diferentes; (4) endpoints opcionais/legado inexistentes.
- Nenhuma alteração de código foi feita; apenas diagnóstico técnico.
