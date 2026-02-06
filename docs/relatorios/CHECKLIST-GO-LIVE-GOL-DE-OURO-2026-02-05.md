# Checklist Técnico Final – GO LIVE Gol de Ouro

**Data:** 05/02/2026  
**Modo:** Somente leitura (nenhuma alteração aplicada).  
**Objetivo:** Validar se o jogo está pronto para produção real e listar bloqueios.

---

## 1) Autenticação

| Item | Status | Observação |
|------|--------|------------|
| Login sem 500 | **PASS** | Correção documentada em `RELATORIO-LOGIN-500-CORRECAO-COMPARATIVA-2026-02-03.md`: `sanitizedEmailLogin` definido no início do handler; 401 para credenciais inválidas, 200 com token para sucesso. |
| Registro consistente | **PASS** | `POST /api/auth/register` em `server-fly.js`; insere em `usuarios` com hash bcrypt; pode retornar token se email já existir ou após criar; validação com `express-validator` em fluxos de senha. |
| JWT válido | **PASS** | Token gerado com `jwt.sign(..., process.env.JWT_SECRET)`; `authenticateToken` usa `jwt.verify(token, process.env.JWT_SECRET)`; `req.user.userId` usado nas rotas protegidas. `JWT_SECRET` obrigatório em `required-env.js`. |
| Proteção de rotas | **PASS** | Rotas sensíveis usam `authenticateToken`: `/api/user/profile`, `/api/games/shoot`, `/api/withdraw/request`, `/api/payments/pix/criar`, `/api/payments/pix/usuario`, `/api/withdraw/history`. Rate limit em `/api/auth/` e `/auth/`. |

**Resumo 1:** Autenticação **PASS**.

---

## 2) Financeiro

| Item | Status | Observação |
|------|--------|------------|
| Depósito PIX validado | **PASS** | Relatório `RELATORIO-VALIDACAO-FLUXO-DEPOSITO-PIX-2026-02-05`: criação em `server-fly.js` (`POST /api/payments/pix/criar`), webhook em `/api/payments/webhook`, atualização de `pagamentos_pix` e `usuarios.saldo`; idempotência por status; assinatura em produção se `MERCADOPAGO_WEBHOOK_SECRET`. |
| Saque PIX validado | **PASS** | Relatório `RELATORIO-VALIDACAO-FLUXO-SAQUE-PIX-WORKER-2026-02-05`: solicitação em `POST /api/withdraw/request`, débito com lock otimista, ledger (saque + taxa), worker e webhook `/webhooks/mercadopago` com confirmação/rollback. |
| Ledger consistente | **PASS** (com ressalva) | Saque: ledger com `saque`, `taxa`, `payout_confirmado`/`falha_payout`, `rollback`; deduplicação por `(correlation_id, tipo, referencia)`. Depósito não grava em `ledger_financeiro` (apenas saldo e `pagamentos_pix`). |
| Saldo nunca negativo | **PASS** (app) | **Aplicação:** (1) Saque: checagem `saldo < valor` e update com `.eq('saldo', usuario.saldo)`. (2) Chute: `if (user.saldo < amount)` retorna 400. **Schema:** `usuarios.saldo` sem `CHECK (saldo >= 0)`; garantia apenas em código. |

**Resumo 2:** Financeiro **PASS** no backend; depósito não preenche `transacoes` (extrato incompleto para depósitos).

---

## 3) Infraestrutura

| Item | Status | Observação |
|------|--------|------------|
| App Fly ativo correto | **PASS** | `fly.toml`: `app = "goldeouro-backend-v2"`, `primary_region = "gru"`. Serviço na porta 8080, processos `["app"]` para HTTP/TLS. |
| Worker configurado | **PASS** (config) | Processo `payout_worker = "node src/workers/payout-worker.js"` definido. **Operacional:** depende de `ENABLE_PIX_PAYOUT_WORKER=true` e `PAYOUT_PIX_ENABLED=true` em produção (não validável só por código). |
| Health check funcional | **PASS** | `GET /health` retorna `status`, `database`, `mercadoPago`, `contadorChutes`, etc.; tenta reconectar Supabase e ping leve. Fly `http_checks`: path `/health`, interval 30s, timeout 10s. |

**Resumo 3:** Infra **PASS**; worker depende de env em produção.

---

## 4) Frontend

| Item | Status | Observação |
|------|--------|------------|
| Domínio correto | **PASS** | `goldeouro-player/src/config/api.js`: `API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'https://goldeouro-backend-v2.fly.dev'`. `paymentService` considera produção em `goldeouro.lol` / `app.goldeouro.lol`. |
| Comunicação com backend | **FAIL** (saque) | **Saque:** Página `Withdraw.jsx` chama `paymentService.createPix(amount, pixKey, description)`, que faz `POST /api/payments/pix/criar` (endpoint de **depósito** PIX). O backend de saque é `POST /api/withdraw/request` com `{ valor, chave_pix, tipo_chave }`. Fluxo de saque no frontend usa endpoint errado. |
| Fluxo de jogo funcional | **PASS** | `gameService.js` chama `apiClient.post('/api/games/shoot', { amount, direction })`; backend `POST /api/games/shoot` com `authenticateToken`, valida saldo e processa chute. |

**Detalhe crítico – Saque no frontend:**

- **Histórico de saques:** `loadWithdrawalHistory()` usa `paymentService.getUserPix()` → `GET /api/payments/pix/usuario`, que retorna **depósitos** PIX (`pagamentos_pix`), não saques. A tela de saque exibe lista de depósitos como se fosse histórico de saques.
- **Solicitar saque:** `handleSubmit` chama `createPix`, criando um PIX de **depósito** (QR para pagar), não um saque (envio de valor para a chave do usuário).

**Resumo 4:** Frontend **FAIL** no fluxo de saque (endpoint e histórico incorretos). Demais itens **PASS**.

---

## 5) Riscos restantes

### Itens bloqueantes (impedem GO LIVE)

| # | Item | Onde |
|---|------|------|
| 1 | **Saque no frontend usa endpoint de depósito** | `goldeouro-player`: Withdraw.jsx chama `paymentService.createPix()` (POST `/api/payments/pix/criar`) em vez de POST `/api/withdraw/request` com `{ valor, chave_pix, tipo_chave }`. Usuário que “solicita saque” na verdade gera um PIX de depósito. |
| 2 | **Histórico de saques exibe depósitos** | Withdraw.jsx usa `getUserPix()` (lista de `pagamentos_pix`) como histórico de saques. Deveria usar algo como GET `/api/withdraw/history`. |

### Itens aceitáveis pós–GO LIVE

| # | Item | Observação |
|---|------|------------|
| 1 | Depósitos PIX não registrados em `transacoes` | Extrato/relatórios baseados só em `transacoes` ficam sem depósitos; pode ser tratado em melhoria contábil. |
| 2 | Webhook de payout sem validação de assinatura | `/webhooks/mercadopago` não valida assinatura; mitigar com controle de acesso/URL secreta ou assinatura quando o MP suportar. |
| 3 | Worker de payout depende de env | Garantir `ENABLE_PIX_PAYOUT_WORKER=true` e `PAYOUT_PIX_ENABLED=true` no Fly (e token de payout); monitorar que o processo está rodando. |
| 4 | Uma transação de saque por ciclo no worker | Fila pode crescer em picos; aceitável para GO LIVE; aumentar paralelismo ou intervalo depois se necessário. |
| 5 | Saldo sem constraint no banco | Garantia apenas em aplicação; considerar `CHECK (saldo >= 0)` em mudança futura de schema. |

---

## 6) Saída obrigatória

### Checklist resumido

| Área | Resultado |
|------|-----------|
| 1) Autenticação | **PASS** |
| 2) Financeiro | **PASS** (backend) |
| 3) Infraestrutura | **PASS** |
| 4) Frontend | **FAIL** (fluxo de saque) |
| 5) Riscos | Bloqueantes identificados |

### O que impede o GO LIVE

1. **Frontend – Solicitação de saque:** a tela de saque chama o endpoint de **criação de PIX (depósito)** em vez do endpoint de **solicitação de saque** (`POST /api/withdraw/request`). Corrigir para chamar o backend de saque com `{ valor, chave_pix, tipo_chave }` (e, se existir, `tipo_chave` no body).
2. **Frontend – Histórico de saques:** a lista exibida na tela de saque vem de **depósitos** PIX (`/api/payments/pix/usuario`). Corrigir para consumir o histórico de saques (ex.: `GET /api/withdraw/history`) e mapear campos (valor, status, data, chave) para o formato da UI.

### Confirmação para produção real

**O jogo não pode ir para produção real com o fluxo de saque atual.**  

- **Pode ir para produção** do ponto de vista de: autenticação, depósito PIX, infra, health check e fluxo de jogo (chute).
- **Não pode ir para produção** sem corrigir o fluxo de saque no frontend: hoje o “saque” gera um depósito PIX e o histórico de saques mostra depósitos, o que invalida a funcionalidade de saque para o usuário final.

**Recomendação:** Corrigir os dois pontos do frontend (endpoint de solicitação de saque e endpoint de histórico de saques) e validar em homologação antes do GO LIVE. Após a correção, o checklist técnico autoriza o GO LIVE do jogo Gol de Ouro para produção real, mantendo os itens “aceitáveis pós–GO LIVE” como melhorias conhecidas.

---

*Checklist gerado em modo somente leitura. Referências: RELATORIO-VALIDACAO-FLUXO-DEPOSITO-PIX-2026-02-05, RELATORIO-VALIDACAO-FLUXO-SAQUE-PIX-WORKER-2026-02-05, RELATORIO-LOGIN-500-CORRECAO-COMPARATIVA-2026-02-03, server-fly.js, fly.toml, goldeouro-player (api.js, paymentService.js, Withdraw.jsx, gameService.js).*
