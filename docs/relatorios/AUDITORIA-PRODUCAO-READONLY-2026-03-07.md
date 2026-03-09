# Auditoria de Produção — Gol de Ouro (READ-ONLY)

**Data:** 2026-03-07  
**Modo:** Somente leitura — nenhum arquivo, deploy ou configuração foi alterado.  
**Objetivo:** Identificar a versão em produção e verificar correspondência do código financeiro com o repositório local.

---

## 1. Backend ativo em produção (Fly.io)

### 1.1 Arquivos de deploy

| Arquivo | Conteúdo relevante |
|--------|---------------------|
| **fly.toml** | App: `goldeouro-backend-v2`, região `gru`, build via `Dockerfile`, processos: `app = "npm start"`, `payout_worker = "node src/workers/payout-worker.js"` |
| **Dockerfile** | Base `node:20-alpine`, `CMD ["node", "server-fly.js"]` — entrypoint explícito |
| **package.json** | `"main": "server-fly.js"`, `"start": "node server-fly.js"` |

### 1.2 Entrypoint e servidor ativo

- **Entrypoint em produção:** `server-fly.js` (via `npm start` → `node server-fly.js` no container).
- **router.js:** Não é usado como entrypoint no Fly. As rotas de saque, PIX e jogo estão inline em `server-fly.js`. Documentação e scripts antigos (deploy Render, backups) citam `router.js`; em produção Fly só sobe `server-fly.js`.

### 1.3 Domínio backend

- **Hostname Fly:** `goldeouro-backend-v2.fly.dev`
- **URL base usada no código e scripts:** `https://goldeouro-backend-v2.fly.dev`  
- Há referências antigas a `goldeouro-backend.fly.dev` em scripts/backups; o ativo em produção é o v2.

### 1.4 Variáveis de ambiente usadas no financeiro

| Variável | Onde é usada | Observação |
|----------|----------------|------------|
| **MERCADOPAGO_DEPOSIT_ACCESS_TOKEN** | server-fly.js (depósito PIX, webhook, reconciliação) | Obrigatória em produção (`required-env`) |
| **PAYOUT_PIX_ENABLED** | server-fly.js, processPendingWithdrawals, webhook MP, payout-worker.js | `'true'` para habilitar saque e worker |
| **SUPABASE_URL** | server-fly.js, supabase-unified-config, payout-worker.js | Obrigatória |
| **SUPABASE_SERVICE_ROLE_KEY** | Idem | Obrigatória |
| **MERCADOPAGO_PAYOUT_ACCESS_TOKEN** | services/pix-mercado-pago.js, payout-worker.js | Saque PIX (transfers); worker exige configurada |
| **BACKEND_URL** | server-fly.js (notification_url do PIX) | Fallback: `https://goldeouro-backend-v2.fly.dev` |
| **ENABLE_PIX_PAYOUT_WORKER** | src/workers/payout-worker.js | `'true'` para o worker não encerrar com exit(0) |

---

## 2. Frontend ativo em produção (Vercel)

### 2.1 Localização e build

- **Projeto:** `goldeouro-player/` (dentro do mesmo repositório do backend).
- **Build:** `npm run build` (Vite), output `dist`.
- **vercel.json:** `framework: vite`, `outputDirectory: dist`, rewrites SPA para `/index.html`, sem proxy explícito para `/api` no JSON (CSP/connect-src permitem `https:`).

### 2.2 URL do backend configurada

- **Arquivo:** `goldeouro-player/src/config/api.js`
- **Variável de build:** `VITE_BACKEND_URL` (não `VITE_API_URL` nem `REACT_APP_API_URL`).
- **Valor padrão:** `https://goldeouro-backend-v2.fly.dev`.
- **Uso:** `API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'https://goldeouro-backend-v2.fly.dev'`.

### 2.3 Endpoints financeiros e rotas principais

Do `api.js`:

- **PIX:** `PIX_CREATE: /api/payments/pix/criar`, `PIX_USER: /api/payments/pix/usuario`.
- **Saques:** `WITHDRAW_REQUEST: /api/withdraw/request`, `WITHDRAW_HISTORY: /api/withdraw/history`.
- **Auth:** `/api/auth/login`, `/api/auth/register`, `/api/user/profile`, etc.
- **Jogo:** `GAMES_SHOOT: /api/games/shoot`, `GAMES_METRICS: /api/metrics`.
- **Health/Meta:** `HEALTH: /health`, `META: /meta`.

Build Vercel identificado: Vite 5.x, React 18, versão declarada 1.2.0 no player; backend usa versão 1.2.1 no server-fly.js e health/meta.

---

## 3. Sistema financeiro em uso (mapeamento)

### 3.1 Depósito PIX

| Etapa | Implementação |
|-------|----------------|
| Criação do PIX | `server-fly.js`: POST `/api/payments/pix/criar` → axios para `api.mercadopago.com/v1/payments` com `MERCADOPAGO_DEPOSIT_ACCESS_TOKEN`; grava em `pagamentos_pix`; `notification_url` usa `BACKEND_URL` ou fallback `goldeouro-backend-v2.fly.dev`. |
| Webhook de confirmação | POST `/api/payments/webhook`: validação opcional por `MERCADOPAGO_WEBHOOK_SECRET`; tipo `payment`; consulta MP; claim atômico em `pagamentos_pix`; credita saldo em `usuarios`. |
| Atualização de saldo | No webhook e no reconciler: update `usuarios.saldo` após claim em `pagamentos_pix` (status `approved`). |
| Reconciliação | `reconcilePendingPayments()` em server-fly.js; intervalo por `MP_RECONCILE_INTERVAL_MS` (default 60s); consulta MP para pendentes antigos e aplica mesmo fluxo de crédito. |

### 3.2 Saque

| Etapa | Implementação |
|-------|----------------|
| Request de saque | POST `/api/withdraw/request` em server-fly.js: validação (PixValidator), idempotência por `correlation_id`, bloqueio de duplicata pendente, débito de saldo, insert em `saques`, **createLedgerEntry** (`withdraw_request`, valor negativo). Em falha do ledger: rollback do saque. |
| Worker de payout | Process group Fly `payout_worker`: `node src/workers/payout-worker.js`. Usa `processPendingWithdrawals` de `src/domain/payout/processPendingWithdrawals.js` e `createPixWithdraw` de `services/pix-mercado-pago.js` (MP `/v1/transfers`, `MERCADOPAGO_PAYOUT_ACCESS_TOKEN`). Condições: `PAYOUT_PIX_ENABLED=true`, `ENABLE_PIX_PAYOUT_WORKER=true`. |
| Webhook de payout | POST `/webhooks/mercadopago`: status approved/credited → `createLedgerEntry(payout_confirmado)`, update saque `concluido`; rejeitado/cancelled → `rollbackWithdraw` + ledger `falha_payout`. |
| Rollback | `rollbackWithdraw` em `processPendingWithdrawals.js`: restitui saldo em `usuarios`, registra ledger `rollback`, atualiza saque para status rejeitado. |

### 3.3 Arquivos centrais do financeiro

- **server-fly.js:** rotas de withdraw, PIX criar/listar, webhooks depósito e payout, reconciliação, validação env (required-env).
- **src/domain/payout/processPendingWithdrawals.js:** createLedgerEntry, rollbackWithdraw, processPendingWithdrawals (ledger com fallback user_id/usuario_id).
- **src/workers/payout-worker.js:** loop do worker, usa Supabase e pix-mercado-pago.
- **services/pix-mercado-pago.js:** createPixWithdraw (transfers), config com MERCADOPAGO_PAYOUT_ACCESS_TOKEN e PIX_WEBHOOK_URL.

---

## 4. Arquitetura duplicada (server-fly vs router)

- **Produção Fly:** apenas **server-fly.js**. Não há montagem de `router.js` em server-fly.js (não há `require('router')` nem `app.use(router)`).
- **router.js:** presente em documentação e em scripts de deploy/backup (Render, cópias para produção). Esses fluxos não são os usados pelo Fly; no Fly o app é monolítico em server-fly.js.
- **Conclusão:** Em produção não há “dois sistemas” rodando; o sistema financeiro em uso é o de **server-fly.js** + **src/domain/payout/** + **services/pix-mercado-pago.js** + **payout-worker.js**.

---

## 5. Auditoria de versionamento

- **Branch atual:** `hotfix/financeiro-v1-stabilize`
- **Commit atual:** `b0448dc9a7270c5b3c30e15fe2be02fb62baeef9`
- **Remoto:** `origin` → `https://github.com/indesconectavel/gol-de-ouro.git`
- **Branch no remoto:** Não existe `remotes/origin/hotfix/financeiro-v1-stabilize` na lista de branches remotas. Ou seja, a branch atual **pode não estar publicada** no origin (ou foi criada apenas localmente). Outras branches como `release/frontend-player-demo-2026-03-06` e `release-v1.0.0` existem no remoto.

**Versões declaradas no código:**

- **fly.toml:** comentário "v1.2.0".
- **server-fly.js:** "v1.2.1-deploy-functional", `/` e `/health` e `/meta` retornam `version: '1.2.1'`.
- **package.json (backend):** `"version": "1.2.0"`.
- **goldeouro-player:** package.json e api.js falam em 1.2.0; vite.config build version padrão v1.2.0.

---

## 6. Possíveis divergências entre código local e produção

1. **Branch não rastreada no remoto:** `hotfix/financeiro-v1-stabilize` não aparece como `origin/hotfix/financeiro-v1-stabilize`. O que está no Fly pode ter sido deployado a partir de outra branch ou commit (ex.: main, release, ou build do GitHub Actions a partir de outro ref).
2. **Versão package.json vs runtime:** Backend package.json 1.2.0; server-fly.js e endpoints expõem 1.2.1 — pequena inconsistência de número de versão.
3. **URLs legadas:** Vários scripts e backups ainda referem `goldeouro-backend.fly.dev`; produção usa `goldeouro-backend-v2.fly.dev`. Impacto apenas em scripts/backups, não no app em produção se o build usar o api.js atual.
4. **Worker:** Em produção o worker só processa se `PAYOUT_PIX_ENABLED=true` e `ENABLE_PIX_PAYOUT_WORKER=true`; sem essas env, saques podem ficar pendentes.

---

## 7. Riscos detectados

| Risco | Gravidade | Descrição |
|-------|-----------|-----------|
| Branch local não no remoto | Média | Commit atual pode não estar no origin; deploy pode ser de outro ref; difícil garantir que “código local = produção” sem saber o ref exato do último deploy. |
| Variáveis do worker | Média | Se `ENABLE_PIX_PAYOUT_WORKER` ou `PAYOUT_PIX_ENABLED` não estiverem `true` no Fly, o worker não processa saques. |
| Dois tokens MP | Baixa | Depósito usa `MERCADOPAGO_DEPOSIT_ACCESS_TOKEN`, saque usa `MERCADOPAGO_PAYOUT_ACCESS_TOKEN`; ausência de um deles afeta só o fluxo correspondente. |
| Ledger user_id vs usuario_id | Mitigado | processPendingWithdrawals usa fallback (user_id depois usuario_id) no insert do ledger; documentado em auditorias anteriores. |
| Versão 1.2.0 vs 1.2.1 | Baixa | Inconsistência de comunicação de versão; não indica necessariamente build diferente. |

---

## 8. Resumo executivo

| Item | Resultado |
|------|-----------|
| **Backend ativo em produção** | **server-fly.js** em `goldeouro-backend-v2.fly.dev` (Fly.io), com process group **payout_worker** (`src/workers/payout-worker.js`). |
| **Frontend ativo em produção** | Build Vite do **goldeouro-player**, configurado para `https://goldeouro-backend-v2.fly.dev` via **VITE_BACKEND_URL**. |
| **Build Vercel** | Vite, `dist`, versão 1.2.0 no player; backend expõe 1.2.1. |
| **Sistema financeiro em uso** | Depósito: server-fly (MP payments + webhook + reconciliação). Saque: server-fly (withdraw/request + ledger), payout-worker (processPendingWithdrawals + pix-mercado-pago transfers), webhook Mercado Pago em server-fly; Supabase e ledger em `src/domain/payout/`. |
| **Divergências** | Branch atual possivelmente não no remoto; pequena diferença de versão package 1.2.0 vs runtime 1.2.1; referências antigas a `goldeouro-backend.fly.dev`. |
| **Riscos** | Principal: confirmar ref exato do deploy (branch/commit) e env do payout worker para garantir paridade código local/produção. |

---

*Relatório gerado em modo READ-ONLY. Nenhuma alteração foi feita em arquivos, deploy ou configurações.*
