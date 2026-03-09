# Revisão geral V1 — Financeiro e fluxo (Gol de Ouro)

**Data:** 2026-02-28  
**Modo:** 100% READ-ONLY / auditável. Nenhum código, commit, deploy, env, migração ou arquivo existente foi alterado.

---

## 1) Resumo executivo

| Item | Status |
|------|--------|
| **V1 (baseline FyKKeg6zb)** | Produção estável do player na Vercel; backend no Fly (release deployment-01KJB5K9MPDYQ49P82YF2P3J3D). |
| **Depósito PIX** | Implementado: player chama POST `/api/payments/pix/criar`; backend usa Mercado Pago; webhook credita saldo; idempotência e `pagamentos_pix` no Supabase. |
| **Saque PIX** | Implementado: player chama POST `/api/withdraw/request` e GET `/api/withdraw/history`; worker `processPendingWithdrawals` processa saques pendentes (flag `PAYOUT_PIX_ENABLED`). |
| **Risco de regressão** | HEAD local (7afa349) à frente de origin/main (fix CORS preview); baseline de produção é FyKKeg6zb — não alterar sem procedimento de release. |
| **O que falta para fechar V1** | Validar fluxo ponta a ponta (depósito + webhook + saldo; saque + worker); confirmar `PAYOUT_PIX_ENABLED` e MERCADOPAGO em produção; admin pode depender de endpoints `/api/admin/*` não expostos no server-fly.js (fallback mock). |

---

## 2) Baseline de produção e estado dos ambientes

### 2.1 Baseline de produção

- **Player (Vercel):** Deploy **FyKKeg6zb** documentado como “deploy considerado válido em produção” (pós-rollback). Build ~16 Jan 2026; assets `index-qIGutT6K.js`, `index-lDOJDUAS.css`. **Não alterar** sem promover explicitamente outro deployment.
- **Backend (Fly):** App `goldeouro-backend-v2`, hostname `goldeouro-backend-v2.fly.dev`, imagem atual `deployment-01KJB5K9MPDYQ49P82YF2P3J3D`, 3 máquinas (2× app, 1× payout_worker), todas started.
- **Evidência (comando + output):**
  - `flyctl status --app goldeouro-backend-v2` → Name = goldeouro-backend-v2, Image = goldeouro-backend-v2:deployment-01KJB5K9MPDYQ49P82YF2P3J3D, PROCESS app (×2) + payout_worker.
  - `curl -s -o NUL -w "%{http_code}" "https://goldeouro-backend-v2.fly.dev/health"` → **200**.

### 2.2 Git (raiz do repo)

| Comando | Resultado (evidência parcial) |
|---------|-------------------------------|
| `pwd` | `E:\Chute de Ouro\goldeouro-backend` (ou equivalente) |
| `git branch --show-current` | **main** |
| `git log -10 --oneline` | 7afa349 fix(cors): allow goldeouro-player vercel previews; 3ae3786 Merge pull request #29 …; d67f6b5 fix(security): CSP report-only …; … |
| `git status --short` | Vários arquivos untracked em docs/relatorios (relatórios de CORS e release); nenhuma alteração em código de app listada como modificada. |
| `git remote -v` | origin → https://github.com/indesconectavel/gol-de-ouro.git (fetch/push) |

- **HEAD local:** 7afa349 (fix CORS). Há commits à frente de origin/main (1 commit no status anterior).
- **Baseline de produção:** **FyKKeg6zb** (Vercel) — não alterar. Referência git usada em docs para “estável”: d8ceb3b (chore: checkpoint pre-v1 stable).

### 2.3 Estrutura do repositório (árvore resumida — 2 níveis)

```
goldeouro-backend/          (raiz do monorepo)
├── goldeouro-player/       (frontend player)
│   ├── src/
│   ├── public/
│   └── ...
├── goldeouro-admin/        (painel admin)
│   ├── src/
│   ├── public/
│   └── ...
├── server-fly.js            (entrypoint backend Fly)
├── routes/
├── services/
├── src/
├── docs/
└── ...
```

- Não existe pasta `goldeouro-backend/` como subpasta; o backend é a raiz (server-fly.js, routes, services, etc.).

---

## 3) Mapa do fluxo financeiro (Depósito PIX / Saque PIX)

### 3.1 Player — Depósito PIX

| Onde | O quê | Evidência (arquivo + linha) |
|------|--------|------------------------------|
| Saldo atual | GET `/api/user/profile` → `response.data.balance` ou `data.saldo` | `goldeouro-player/src/pages/Pagamentos.jsx` 36–38: `apiClient.get(API_ENDPOINTS.PROFILE)`; `setSaldo(response.data.balance \|\| 0)`. |
| Criar PIX | POST `/api/payments/pix/criar` com `amount`, `description` | `Pagamentos.jsx` 57–59: `apiClient.post('/api/payments/pix/criar', { amount: valorRecarga, description: ... })`. |
| Histórico pagamentos | GET `/api/payments/pix/usuario` | `Pagamentos.jsx` 41: `apiClient.get(API_ENDPOINTS.PIX_USER)`; `config/api.js` 23: `PIX_USER: '/api/payments/pix/usuario'`. |
| Config API | `VITE_BACKEND_URL` ou default `https://goldeouro-backend-v2.fly.dev` | `goldeouro-player/src/config/api.js` 9; `environments.js` 17. |

### 3.2 Player — Saque PIX

| Onde | O quê | Evidência (arquivo + linha) |
|------|--------|------------------------------|
| Saldo | GET `/api/user/profile` → `data.saldo` | `goldeouro-player/src/pages/Withdraw.jsx` 43–44: `apiClient.get(API_ENDPOINTS.PROFILE)`, `setBalance(response.data.data.saldo \|\| 0)`. |
| Solicitar saque | POST (endpoint de saque no backend) | Backend: `server-fly.js` 1394: `app.post('/api/withdraw/request', ...)`. Player: `paymentService` / apiClient; `api.js` 35: `WITHDRAW: '/api/withdraw'`. |
| Histórico saques | Backend GET `/api/withdraw/history` | `server-fly.js` 1667: `app.get('/api/withdraw/history', authenticateToken, ...)`. Withdraw.jsx usa `paymentService.getUserPix()` para histórico (contexto PIX usuário); histórico de saques pode usar endpoint dedicado. |

### 3.3 Backend — Depósito PIX

| Feature | Onde | Endpoint / função | Pronto (SIM/NÃO) |
|---------|------|-------------------|-------------------|
| Criar cobrança PIX | server-fly.js | POST `/api/payments/pix/criar` (Mercado Pago, idempotencyKey, notification_url) | SIM |
| Listar PIX do usuário | server-fly.js | GET `/api/payments/pix/usuario` | SIM |
| Webhook confirmação | server-fly.js | POST `/api/payments/webhook` (validação MERCADOPAGO_WEBHOOK_SECRET opcional); atualiza `pagamentos_pix` e saldo em `usuarios` | SIM |
| Tabelas | Supabase | `pagamentos_pix`, `usuarios` (saldo) | SIM |

### 3.4 Backend — Saque PIX

| Feature | Onde | Endpoint / função | Pronto (SIM/NÃO) |
|---------|------|-------------------|-------------------|
| Solicitar saque | server-fly.js | POST `/api/withdraw/request` (validação PixValidator, idempotência por correlation_id, débito saldo, ledger, tabela `saques`) | SIM |
| Histórico saques usuário | server-fly.js | GET `/api/withdraw/history` | SIM |
| Worker payout | src/domain/payout/processPendingWithdrawals.js | Ciclo: seleciona saques `pendente`/`pending`, lock `processando`, chama `createPixWithdraw` (pix-mercado-pago), atualiza status `aguardando_confirmacao`/rollback | SIM (código) |
| Flag worker | server-fly.js | `PAYOUT_PIX_ENABLED` (env) → `true` para ativar | Documentado; valor em produção não verificado (não ler secrets). |
| Webhook payout MP | server-fly.js | POST `/webhooks/mercadopago` (atualiza saque processado/falhou, ledger) | SIM |

### 3.5 Admin — Saques e relatórios

| Tela / recurso | Endpoint chamado | Evidência | Status |
|----------------|------------------|-----------|--------|
| Saques (lista) | postData('/admin/saques') | `goldeouro-admin/src/pages/Saques.jsx` 25 | UI existe; backend server-fly.js não expõe GET/POST `/api/admin/saques` (apenas `/api/admin/bootstrap`). dataService usa `/api/admin/withdrawals` com fallback mock. |
| Saques pendentes | postData('/admin/saques/pendentes') | `SaquesPendentes.jsx` 9 | UI existe; endpoint admin pode não existir em server-fly. |
| Relatório saques | api.post('/admin/relatorio-saques'), exportar saques-csv | `RelatorioSaques.jsx`, `SaqueUsuarios.jsx` | UI existe; exportação depende de backend admin. |

- **Conclusão:** O **server-fly.js** (produção Fly) implementa fluxo financeiro direto (PIX criar, usuario, webhook, withdraw/request, withdraw/history, worker, webhook mercadopago). As telas do admin que chamam `/api/admin/withdrawals`, `/admin/saques`, etc. podem estar apontando para outro backend ou usar mock quando o endpoint falha (dataService: `mockWithdrawals` em erro).

---

## 4) Checklist DONE / TODO para fechar V1

### 4.1 DONE (com evidência)

- Depósito PIX: criação de cobrança, listagem por usuário, webhook e crédito de saldo (server-fly.js; Pagamentos.jsx).
- Saque PIX: solicitação com validação, idempotência, débito de saldo, ledger e worker de processamento (server-fly.js; processPendingWithdrawals.js; Withdraw.jsx no player).
- Player: telas /pagamentos e saque; saldo via GET profile; integração com backend v2 (API_BASE_URL).
- Backend: CORS para produção e previews Vercel (regex goldeouro-player); health 200.
- Fly: app e payout_worker em execução; release deployment-01KJB5K9MPDYQ49P82YF2P3J3D.

### 4.2 TODO (somente itens concretos e acionáveis)

- **TODO-01:** Confirmar em produção (sem expor valores) se `PAYOUT_PIX_ENABLED` está `true` quando se deseja saques automáticos, e se tokens/credenciais Mercado Pago (depósito e payout) estão configurados no Fly.
- **TODO-02:** Validar fluxo depósito PIX ponta a ponta: criar PIX no player → pagar → webhook recebido → saldo atualizado e visível no player (e, se aplicável, consulta GET `/api/payments/pix/usuario`).
- **TODO-03:** Validar fluxo saque PIX ponta a ponta: solicitar saque no player → registro em `saques` com status pendente → worker processa → webhook Mercado Pago atualiza status → usuário vê histórico em GET `/api/withdraw/history`.
- **TODO-04:** Admin: confirmar se as telas de saques (Saques, SaquesPendentes, RelatorioSaques) consomem um backend que implementa `/api/admin/withdrawals` (ou equivalente). Se o backend em produção for apenas server-fly.js, implementar ou expor esses endpoints ou documentar uso de proxy/outro serviço.
- **TODO-05:** Documentar/validar assinatura do webhook Mercado Pago (MERCADOPAGO_WEBHOOK_SECRET) em produção para evitar processamento de payloads não autênticos.
- **TODO-06:** (Opcional) Player: exibir “Saldo atual” na página /pagamentos (foi removido no PR #29); manter ou recolocar conforme UX desejada para V1.

---

## 5) Próximos passos recomendados (ordem; mínimo risco)

1. **Fechar fluxo financeiro ponta a ponta:** Validar depósito (criar PIX → webhook → saldo) e saque (request → worker → webhook) em ambiente controlado/produção, sem alterar código (testes manuais ou com dados de teste).
2. **Configuração e flags:** Confirmar `PAYOUT_PIX_ENABLED` e credenciais Mercado Pago no Fly (checklist/env); não expor valores no relatório.
3. **Admin:** Decidir se listagem de saques vem do server-fly (e, se sim, expor `/api/admin/withdrawals` ou equivalente) ou de outro backend; ajustar admin ou docs conforme decisão.
4. **Observabilidade e logs:** Garantir logs suficientes para webhook e worker (já existentes em server-fly e processPendingWithdrawals); revisar se há alertas para falhas de payout.
5. **Backups e hardening:** Políticas de backup Supabase; validação obrigatória de assinatura do webhook em produção.

---

## 6) Apêndice de evidências

### Comandos executados (read-only)

```text
pwd
# E:\Chute de Ouro\goldeouro-backend (ou goldeouro-player conforme shell)

Get-ChildItem E:\Chute de Ouro\goldeouro-backend -Directory | Select-Object Name
# .cursor, .github, goldeouro-player, goldeouro-admin, server-fly.js na raiz, routes, services, docs, ...

git status --short
git branch --show-current
git log -10 --oneline
git remote -v
# main, 7afa349, origin github.com/indesconectavel/gol-de-ouro

node -c server-fly.js
# exit 0 (sintaxe OK)

curl.exe -s -o NUL -w "%{http_code}" "https://goldeouro-backend-v2.fly.dev/health"
# 200

flyctl status --app goldeouro-backend-v2
# Name = goldeouro-backend-v2, Image = ...deployment-01KJB5K9MPDYQ49P82YF2P3J3D, 3 machines (app×2, payout_worker)

vercel whoami
# Error: No existing credentials found. (não alterado)
```

### Trechos de código (referência; sem alteração)

- **CORS (server-fly.js):** linhas 236–258 — `parseCorsOrigins()`, `vercelPreviewOriginRegex`, `cors({ origin: function, credentials: true, ... })`.
- **Depósito PIX (server-fly.js):** ~1728–1796 (POST criar, Mercado Pago, notification_url), ~1893–1972 (GET usuario), ~1991–2128 (webhook).
- **Saque (server-fly.js):** ~1394–1658 (POST /api/withdraw/request), ~1667–1715 (GET /api/withdraw/history).
- **Worker (processPendingWithdrawals.js):** ~101–218 — `PAYOUT_PIX_ENABLED`, seleção de saques pendentes, lock, `createPixWithdraw`, atualização de status.
- **Player saldo/pagamentos:** `goldeouro-player/src/config/api.js` (API_BASE_URL, PIX_CREATE, PIX_USER, PROFILE); `Pagamentos.jsx` (PROFILE, PIX_USER, POST pix/criar); `Withdraw.jsx` (PROFILE, paymentService, formulário saque).
- **Admin API:** `goldeouro-admin/src/config/env.js` — getApiUrl() retorna `/api` em PROD; `dataService.js` — getWithdrawals → `/api/admin/withdrawals` com fallback mock.

### Tabelas Supabase referenciadas (sem expor dados)

- **usuarios:** saldo, updated_at.
- **pagamentos_pix:** usuario_id, amount/valor, status, pix_copy_paste, etc.
- **saques:** id, usuario_id, amount, valor, fee, net_amount, pix_key, chave_pix, tipo_chave, status, correlation_id, created_at.
- **ledger_financeiro:** tipo, usuario_id, valor, referencia, correlation_id.

---

## 7) Resumo em 10 bullets (DONE / TODO principais)

1. **DONE** — Depósito PIX: POST `/api/payments/pix/criar` e GET `/api/payments/pix/usuario` no backend; player Pagamentos.jsx integrado.
2. **DONE** — Webhook PIX: POST `/api/payments/webhook` credita saldo em `usuarios` e atualiza `pagamentos_pix`.
3. **DONE** — Saque PIX: POST `/api/withdraw/request` e GET `/api/withdraw/history` no backend; player Withdraw.jsx com formulário e saldo.
4. **DONE** — Worker payout: `processPendingWithdrawals` em `src/domain/payout/processPendingWithdrawals.js`; ativado por `PAYOUT_PIX_ENABLED`.
5. **DONE** — Backend Fly: health 200; release deployment-01KJB5K9MPDYQ49P82YF2P3J3D; 3 máquinas (app + payout_worker).
6. **TODO** — Confirmar `PAYOUT_PIX_ENABLED` e credenciais Mercado Pago em produção (sem expor valores).
7. **TODO** — Validar fluxo depósito ponta a ponta (criar PIX → webhook → saldo visível).
8. **TODO** — Validar fluxo saque ponta a ponta (request → worker → webhook MP → histórico).
9. **TODO** — Admin: endpoints `/api/admin/withdrawals` (e saques) não expostos em server-fly.js; definir origem dos dados ou implementar/expor rotas.
10. **TODO** — Webhook: validar assinatura (MERCADOPAGO_WEBHOOK_SECRET) em produção.

---

**Fim do relatório.** Nenhum arquivo existente foi modificado; apenas criado `docs/relatorios/REVISAO-GERAL-V1-FINANCEIRO-E-FLUXO-2026-02-28.md`.
