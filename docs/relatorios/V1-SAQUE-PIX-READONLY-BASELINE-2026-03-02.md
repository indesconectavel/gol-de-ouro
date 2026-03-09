# V1 Saque PIX — Baseline READ-ONLY (o que é necessário para funcionar em produção)

**Data:** 2026-03-02  
**Modo:** READ-ONLY absoluto (nenhum arquivo alterado, sem formatters, install, commit ou deploy).  
**Objetivo:** Fechar com evidência (caminhos + linhas) o que será necessário para V1 de Saque PIX funcionar em produção sem mexer em Depósito PIX e sem quebrar /game.

---

## A) PRODUÇÃO ATUAL (Fly) — estado real

### A.1 App, release, imagem e processos

| Item | Valor |
|------|--------|
| **App Fly** | `goldeouro-backend-v2` |
| **Release atual** | v305 (complete, Feb 25 2026 19:50) |
| **Imagem atual** | `goldeouro-backend-v2:deployment-01KJB5K9MPDYQ49P82YF2P3J3D` |
| **Processos** | **app** (comando: `npm start`), **payout_worker** (comando: `node src/workers/payout-worker.js`) |

**Evidência fly.toml (linhas 1–14):**
```toml
app = "goldeouro-backend-v2"
primary_region = "gru"
[processes]
app = "npm start"
payout_worker = "node src/workers/payout-worker.js"
```

**Evidência flyctl status / machines:** 2 máquinas `app` (VERSION 305, STATE started, 1/1 checks passing), 1 máquina `payout_worker` (VERSION 305, STATE started), todas com a mesma IMAGE acima.

### A.2 Payout_worker está rodando?

**Sim.**  
- **fly.toml:** processo `payout_worker` definido com comando `node src/workers/payout-worker.js` (linha 14).  
- **Logs:** máquina `e82794da791108` (process group payout_worker) emite ciclos regulares, por exemplo:  
  `[PAYOUT][WORKER] Início do ciclo`, `Nenhum saque pendente`, `Resumo { payouts_sucesso: 0, payouts_falha: 1 }`, `Fim do ciclo`.

### A.3 Entrypoint real do processo app

- **fly.toml:** processo `app` = `npm start` (linha 13).  
- **package.json:** `"start": "node server-fly.js"` (linha 7).  
- **Dockerfile:** `CMD ["node", "server-fly.js"]` (linha 16).  

No Fly, o processo `app` usa `npm start`, que executa `node server-fly.js`. O entrypoint real do servidor HTTP é **server-fly.js**.

---

## B) DEPÓSITO PIX — provar que NÃO SERÁ TOCADO

### B.4 Endpoints de depósito em produção e onde estão definidos

Todos em **server-fly.js**:

| Endpoint | Arquivo | Linha |
|----------|---------|--------|
| POST /api/payments/pix/criar | server-fly.js | 1729 |
| POST /api/payments/webhook (depósito) | server-fly.js | 1992 |
| GET /api/payments/pix/usuario | server-fly.js | 1894 |

**Evidência (grep):**
```
server-fly.js  1729:app.post('/api/payments/pix/criar', authenticateToken, async (req, res) => {
server-fly.js  1894:app.get('/api/payments/pix/usuario', authenticateToken, async (req, res) => {
server-fly.js  1992:app.post('/api/payments/webhook', async (req, res, next) => {
```

### B.5 Status gravado no INSERT da tabela pagamentos_pix (rota /pix/criar)

**Valor gravado:** string **`'pending'`**.

**Evidência server-fly.js (linhas 1829–1841):**
```javascript
.from('pagamentos_pix')
.insert({
  usuario_id: req.user.userId,
  external_id: String(payment.id),
  payment_id: String(payment.id),
  amount: parseFloat(amount),
  valor: parseFloat(amount),
  status: 'pending',
  qr_code: ...
})
```

A resposta JSON do mesmo handler também usa `status: 'pending'` (linha 1862).

### B.6 Reconciler de pagamentos pendentes (depósito) e filtro de status

- **Função:** `reconcilePendingPayments` (server-fly.js, linha 2344).  
- **Filtro de status:** `.in('status', ['pending', 'pendente'])` (linha 2360).  
- **Agendamento:** `setInterval(reconcilePendingPayments, ...)` (linha 2445).

**Evidência (linhas 2357–2362):**
```javascript
const { data: pendings, error: listError } = await supabase
  .from('pagamentos_pix')
  .select('id, usuario_id, external_id, payment_id, status, amount, valor, created_at')
  .in('status', ['pending', 'pendente'])
  .lt('created_at', sinceIso)
```

### B.7 Alerta de regressão (status em pagamentos_pix)

- **Estado atual no repo:** no handler POST /api/payments/pix/criar, o INSERT em `pagamentos_pix` usa **`status: 'pending'`** (linha 1837). O reconciler usa **`.in('status', ['pending', 'pendente'])`** (linha 2360). Consistente.  
- **BLOQUEADOR:** Se em algum diff/branch o insert de **pagamentos_pix** em **server-fly.js** passar a usar `PENDING` (constante de saques = `'pendente'`) ou a string `'pendente'` em vez de `'pending'`, o reconciler de depósito deixaria de encontrar novos registros (ele já aceita `'pendente'` por segurança, mas novos devem ser gravados como `'pending'`). Qualquer alteração que troque **`status: 'pending'`** por **`status: PENDING`** ou **`status: 'pendente'`** no insert de **pagamentos_pix** (server-fly.js, em torno da linha 1837) deve ser considerada **BLOQUEADOR** de deploy até revertida ou ajustada.

---

## C) /GAME — provar que NÃO SERÁ QUEBRADO

### C.8 Rotas usadas pelo player (/game) e localização no backend

| Rota | Arquivo | Linha |
|------|---------|--------|
| GET /api/user/profile | server-fly.js | 1023 |
| POST /api/games/shoot | server-fly.js | 1168 |
| GET /api/fila/entrar (compatibilidade) | server-fly.js | 3139 |

**Evidência (grep):**
```
server-fly.js  1023:app.get('/api/user/profile', authenticateToken, async (req, res) => {
server-fly.js  1168:app.post('/api/games/shoot', authenticateToken, async (req, res) => {
server-fly.js  3139:app.get('/api/fila/entrar', authenticateToken, async (req, res) => {
```

### C.9 Essas rotas foram alteradas no patch de saque?

**Não alteradas.** O patch de saque (worker + reconciler + patch V1) modifica **server-fly.js** em trechos relacionados a: requires (withdrawalStatus, authMiddleware), CORS, **withdraw** (request/history), **webhook** de saque (webhooks/mercadopago), **reconcilePendingPayments** (filtro .in), e **GET /api/admin/saques-presos**. As definições dos handlers de **/api/user/profile** (1023), **/api/games/shoot** (1168) e **/api/fila/entrar** (3139) não estão nesses blocos; nenhuma linha de corpo desses handlers foi alterada pelo patch. **Evidência:** diff do patch não contém alterações nas linhas 1023, 1168 ou 3139.

---

## D) SAQUE PIX — o que precisa estar em produção para funcionar

### D.10 Onde é feito o INSERT em saques

**Arquivo:** server-fly.js.  
**Linhas:** 1548–1567 (handler POST /api/withdraw/request).

**Campos gravados no insert (trecho 1550–1565):**
- usuario_id, valor, amount, fee, net_amount, correlation_id  
- pix_key, pix_type, chave_pix, tipo_chave  
- **status: PENDING** (constante = 'pendente')  
- created_at  

```javascript
.from('saques')
.insert({
  usuario_id: userId,
  valor: requestedAmount,
  amount: requestedAmount,
  fee: taxa,
  net_amount: valorLiquido,
  correlation_id: correlationId,
  pix_key: validation.data.pixKey,
  pix_type: validation.data.pixType,
  chave_pix: validation.data.pixKey,
  tipo_chave: validation.data.pixType,
  status: PENDING,
  created_at: new Date().toISOString()
})
```

### D.11 Quem muda status para PROCESSING / COMPLETED / REJECTED (todos os lugares)

| Arquivo | Linhas | Ação |
|---------|--------|------|
| server-fly.js | 2242–2245 | Webhook MP: update saques → **COMPLETED** + processed_at |
| server-fly.js | 2264 | Webhook MP: update saques → **PROCESSING** (in_process) |
| src/domain/payout/processPendingWithdrawals.js | 50–92 (updateSaqueStatus) | Atualiza status (PROCESSING, COMPLETED, REJECTED, PENDING no rollback) |
| src/domain/payout/processPendingWithdrawals.js | 106, 292, 324 | Chamadas a updateSaqueStatus (lock PROCESSING, REJECTED, COMPLETED) |
| src/domain/payout/reconcileProcessingWithdrawals.js | 98, 136, 167, 186, 206, 223, 253 | Chamadas a updateSaqueStatus (REJECTED/COMPLETED no reconciler) |

**Evidência processPendingWithdrawals.js:** função `updateSaqueStatus` (linha 50), export (linha 422); uso em rollback (86–88: revert to PENDING), lock (292), conclusão (324).

### D.12 reconcileProcessingWithdrawals no repo e integração no payout-worker

- **Existe no repo:** `src/domain/payout/reconcileProcessingWithdrawals.js` (função `reconcileProcessingWithdrawals`, linhas 40, 293).  
- **Integração no payout-worker:** `src/workers/payout-worker.js` — require linha 5: `const { reconcileProcessingWithdrawals } = require('../domain/payout/reconcileProcessingWithdrawals');`; chamada nas linhas 110–116 dentro de `runReconcileCycle()`; agendamento linhas 127–128: `runReconcileCycle(); setInterval(runReconcileCycle, reconcileIntervalMs);`.

### D.13 updateSaqueStatus existe e está sendo usado

- **Definição:** `src/domain/payout/processPendingWithdrawals.js` linha 50 (`const updateSaqueStatus = async (...)`).  
- **Export:** mesma pasta, linha 422 (`updateSaqueStatus`).  
- **Uso:**  
  - Em **processPendingWithdrawals.js:** linhas 106, 292, 324 (lock, rollback, conclusão).  
  - Em **reconcileProcessingWithdrawals.js:** require linha 11; chamadas linhas 98, 136, 167, 186, 206, 223, 253.

### D.14 ENV necessárias para boot e payout

**Boot (server-fly.js):**  
- **config/required-env.js** (server-fly.js linhas 53–57):  
  - Obrigatórias sempre: **JWT_SECRET**, **SUPABASE_URL**, **SUPABASE_SERVICE_ROLE_KEY**.  
  - Só em produção: **MERCADOPAGO_DEPOSIT_ACCESS_TOKEN**.  
- **config/env.js** (carregado via authMiddleware): envalid exige **DATABASE_URL**, **JWT_SECRET**, **ADMIN_TOKEN**, **MERCADOPAGO_ACCESS_TOKEN**, **MERCADOPAGO_WEBHOOK_SECRET** (sem default); PORT e CORS_ORIGINS têm default; NODE_ENV tem default.

**Payout worker (payout-worker.js):**  
- Linhas 26–29: **SUPABASE_URL**, **SUPABASE_SERVICE_ROLE_KEY** (exit 1 se ausentes).  
- Linhas 31–35: **MERCADOPAGO_PAYOUT_ACCESS_TOKEN** (exit 1 se ausente).  
- Linhas 7, 68, 108: **ENABLE_PIX_PAYOUT_WORKER** (true para rodar), **PAYOUT_PIX_ENABLED** (true para processar), **PAYOUT_WORKER_INTERVAL_MS**, **PAYOUT_RECONCILE_INTERVAL_MS** (opcionais, com defaults).

**Lista nominal (boot + payout):**  
JWT_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_TOKEN, MERCADOPAGO_ACCESS_TOKEN, MERCADOPAGO_WEBHOOK_SECRET, DATABASE_URL; (produção) MERCADOPAGO_DEPOSIT_ACCESS_TOKEN; (worker) ENABLE_PIX_PAYOUT_WORKER, MERCADOPAGO_PAYOUT_ACCESS_TOKEN, PAYOUT_PIX_ENABLED; opcionais: PAYOUT_WORKER_INTERVAL_MS, PAYOUT_RECONCILE_INTERVAL_MS.

---

## E) “PATCH MÍNIMO GO” — lista final cirúrgica

### E.15 Arquivos que precisam mudar (e somente esses) para:

- manter depósito com status **'pending'**;  
- habilitar saque (worker + reconciler + patch V1);  
- manter /game intacto.

| # | Arquivo | O que deve estar garantido |
|---|---------|----------------------------|
| 1 | **server-fly.js** | Depósito: insert e resposta em /api/payments/pix/criar com **status: 'pending'**; reconcilePendingPayments com **.in('status', ['pending', 'pendente'])**; sem uso de PENDING em pagamentos_pix. Saque: requires (withdrawalStatus, authMiddleware), normalização em withdraw e webhook de saque, GET /api/admin/saques-presos. Sem alteração nos handlers de /api/user/profile, /api/games/shoot, /api/fila/entrar. |
| 2 | **src/domain/payout/processPendingWithdrawals.js** | updateSaqueStatus, uso de withdrawalStatus (PENDING, PROCESSING, COMPLETED, REJECTED), rollback e fluxo de processamento usando updateSaqueStatus. |
| 3 | **src/domain/payout/reconcileProcessingWithdrawals.js** | Arquivo presente; require de updateSaqueStatus; lógica de reconciliação de saques em PROCESSING. |
| 4 | **src/domain/payout/withdrawalStatus.js** | Constantes e normalizeWithdrawStatus (já existente). |
| 5 | **src/workers/payout-worker.js** | Require e chamada a reconcileProcessingWithdrawals; runReconcileCycle; setInterval para reconciliação. |
| 6 | **services/pix-mercado-pago.js** | createPixWithdraw usado pelo app e pelo worker (sem alterar contrato de depósito). |
| 7 | **middlewares/authMiddleware.js** | authAdminToken para GET /api/admin/saques-presos (já usa config/env). |
| 8 | **config/required-env.js** | assertRequiredEnv com JWT_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, onlyInProduction MERCADOPAGO_DEPOSIT_ACCESS_TOKEN. |
| 9 | **package.json** | envalid em dependencies; script start = "node server-fly.js". |

Nenhum outro arquivo precisa ser alterado para esse objetivo. **Não tocar:** handlers de /game, lógica de POST /api/payments/webhook (depósito), insert/resposta de pagamentos_pix (exceto garantir 'pending' e .in(['pending','pendente'])).

### E.16 Veredito final: GO / NO-GO

**GO para deploy do patch V1 de Saque PIX**, desde que:

1. O repositório deployado mantenha em **server-fly.js** o insert e a resposta de **pagamentos_pix** com **status: 'pending'** (e não PENDING/'pendente') e o **reconcilePendingPayments** com **.in('status', ['pending', 'pendente'])**.  
2. A imagem de produção inclua os arquivos **reconcileProcessingWithdrawals.js**, **processPendingWithdrawals.js** (com updateSaqueStatus), **payout-worker.js** (com reconcile integrado) e a dependência **envalid**.  
3. As ENV de boot e do payout estejam configuradas no Fly (JWT_SECRET, SUPABASE_*, ADMIN_TOKEN, MERCADOPAGO_*, ENABLE_PIX_PAYOUT_WORKER, MERCADOPAGO_PAYOUT_ACCESS_TOKEN, PAYOUT_PIX_ENABLED, etc.).  

**Justificativa:** O estado atual do código (após o patch mínimo de status de depósito) separa corretamente depósito PIX (tabela pagamentos_pix, status 'pending' e reconciler tolerante) do saque PIX (tabela saques, constantes do withdrawalStatus, worker e reconciler de saques). As rotas de /game não são alteradas pelo patch. Com a lista cirúrgica de arquivos acima e os cuidados de ENV e imagem, o deploy do patch V1 de Saque PIX pode ser considerado **GO** sem regressão em Depósito PIX e sem quebrar /game.

---

*Relatório gerado em modo READ-ONLY. Nenhum arquivo foi alterado; nenhum formatter, install, commit ou deploy foi executado.*
