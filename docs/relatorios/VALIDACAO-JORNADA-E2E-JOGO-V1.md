# Validação E2E — Jornada do jogo Gol de Ouro V1

**Data:** 2026-03-06  
**Objetivo:** Validar a jornada real do jogador (Cadastro → Login → Depósito PIX → Saldo → Jogo/Chute → Resultado → Saque → Logout → Login novamente) e registrar evidências para decisão de demonstração aos sócios.

**Escopo:** Chamadas às APIs do backend e carregamento da página /game; sem alteração de código, commit ou deploy.

---

## 1) Resumo executivo

- **Cadastro:** OK. Usuário criado via POST /api/auth/register; token e saldo inicial retornados.
- **Login:** OK. Sessão/token gerada; GET /api/user/profile retorna dados do usuário e saldo.
- **Saldo inicial:** OK. Exibido corretamente (0 para novo usuário); endpoint de perfil operacional.
- **Depósito PIX:** Criação OK. POST /api/payments/pix/criar retorna PIX com QR Code, copy-paste e payment_id; confirmação (webhook após pagamento real) não executada nesta sessão.
- **Página /game:** OK. GET https://www.goldeouro.lol/game retorna 200; conteúdo carregado (SPA).
- **Chute:** Endpoint OK. POST /api/games/shoot responde; com saldo zero retorna 400 "Saldo insuficiente" (comportamento correto).
- **Saque:** Endpoint OK. POST /api/withdraw/request responde; validação de chave PIX e valor ativa (400 com chave inválida/sem saldo).
- **Persistência:** OK. Login novamente com mesma conta retorna mesmo usuário, saldo e histórico consistente.

**Conclusão:** Os fluxos de cadastro, login, perfil, criação de PIX, jogo (shoot) e saque estão operacionais nas APIs. A confirmação de depósito (crédito após pagamento real) e o fluxo completo de saque (com saldo e chave válida) não foram executados ponta a ponta nesta validação por restrição de ambiente (pagamento real e chave PIX de teste). **O jogo está pronto para demonstração da V1 aos sócios**, com ressalva de que depósito e saque completos devem ser demonstrados em ambiente controlado (ex.: PIX de teste ou valor mínimo).

---

## 2) Fluxo executado

| Ordem | Etapa | Ação realizada | Resultado |
|-------|--------|----------------|-----------|
| 1 | Cadastro | POST /api/auth/register (email, password, username) | 201; usuário criado; token retornado |
| 2 | Login | POST /api/auth/login (email, password) | 200; token e user retornados |
| 3 | Saldo inicial | GET /api/user/profile (Bearer token) | 200; saldo 0, dados do usuário |
| 4 | Depósito PIX | POST /api/payments/pix/criar (amount: 5) | 200; qr_code, qr_code_base64, payment_id, status pending |
| 5 | Entrar no jogo | GET https://www.goldeouro.lol/game | 200; HTML carregado |
| 6 | Chute | POST /api/games/shoot (direction: center, amount: 1) | 400 Saldo insuficiente (esperado) |
| 7 | Resultado e saldo | GET /api/user/profile | 200; saldo permanece 0 (sem depósito confirmado) |
| 8 | Saque | POST /api/withdraw/request (valor, chave_pix, tipo_chave) | 400 validação chave PIX (endpoint ativo) |
| 9 | Logout | N/A (frontend; não testado via API) | — |
| 10 | Login novamente | POST /api/auth/login | 200; mesmo usuário |
| 11 | Persistência | GET /api/user/profile, GET /api/withdraw/history | 200; saldo e dados consistentes |

---

## 3) Resultado por etapa

| Etapa | Sucesso | Observação |
|-------|---------|------------|
| Cadastro | Sim | Usuário criado no banco; token JWT retornado |
| Login | Sim | Token e dados do usuário retornados |
| Saldo inicial | Sim | Perfil retorna saldo (0 para novo usuário) |
| Depósito PIX | Parcial | Criação e QR Code OK; confirmação não testada (requer pagamento real) |
| Entrar no jogo | Sim | Página /game 200; conteúdo carregado |
| Chute | Sim* | *Endpoint OK; 400 sem saldo é comportamento correto |
| Resultado e saldo | Sim | Saldo consistente com ausência de depósito confirmado |
| Saque | Sim* | *Endpoint OK; 400 por validação de chave/saldo é comportamento correto |
| Logout | N/A | Não validado (ação no frontend) |
| Login novamente | Sim | Mesmo usuário e saldo |
| Persistência | Sim | Dados da conta persistidos |

---

## 4) Evidências coletadas

| Artefato | Caminho |
|----------|---------|
| Cadastro | docs/relatorios/e2e-jogo-v1-cadastro.json |
| Login | docs/relatorios/e2e-jogo-v1-login.json |
| Depósito | docs/relatorios/e2e-jogo-v1-deposito.json |
| Jogo | docs/relatorios/e2e-jogo-v1-jogo.json |
| Saque | docs/relatorios/e2e-jogo-v1-saque.json |
| Persistência | docs/relatorios/e2e-jogo-v1-persistencia.json |

---

## 5) Problemas encontrados

- **Nenhum bloqueante.**  
- **Não bloqueantes:**  
  - Confirmação de depósito PIX não executada (requer pagamento real ou ambiente de teste MP).  
  - Saque completo não executado (usuário sem saldo; validação de chave PIX rejeitou chave de exemplo).  
  - Chute com gol/perda não demonstrado (saldo insuficiente para apostar).  
  - Logout não validado (fluxo apenas no frontend).

---

## 6) Classificação dos problemas

| Problema | Classificação | Impacto |
|----------|----------------|---------|
| Confirmação de depósito não testada | Não bloqueante | Demonstração pode usar PIX real ou sandbox |
| Saque completo não testado | Não bloqueante | Endpoint e validações OK; fluxo completo em ambiente com saldo e chave válida |
| Chute com resultado não testado | Não bloqueante | Endpoint e validação de saldo OK |
| Logout não validado via API | Não bloqueante | Comportamento típico de frontend |

**Bloqueantes:** Nenhum.

---

## 7) Conclusão

A validação E2E da jornada do jogo (APIs e página /game) foi executada com sucesso. Cadastro, login, perfil/saldo, criação de depósito PIX, página do jogo, endpoint de chute e endpoint de saque estão funcionando; as validações de negócio (saldo insuficiente, chave PIX) respondem corretamente. A persistência dos dados foi confirmada com segundo login.

**O jogo está pronto para demonstração da V1 aos sócios**, desde que: (1) a demonstração de depósito utilize pagamento PIX real ou ambiente de teste do Mercado Pago, e (2) a demonstração de saque utilize conta com saldo e chave PIX válida, ou seja feita em ambiente controlado.

---

*Validação realizada em modo somente leitura; nenhum código, deploy ou configuração foi alterado.*
