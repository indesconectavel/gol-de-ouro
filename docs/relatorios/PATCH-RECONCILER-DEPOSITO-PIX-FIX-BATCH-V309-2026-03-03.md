# PATCH — Reconciler de depósito PIX (fix batch + IDs inválidos) — V309

**Data:** 2026-03-03  
**Objetivo:** Fazer o reconciler processar depósitos aprovados no MP mesmo com backlog antigo e IDs inválidos, e provar que o pagamento 148697499270 (87ee8545...) vira approved e credita +10 no saldo.

**Alvos:** Fly app `goldeouro-backend-v2`; pagamento `pagamentos_pix.id` = 87ee8545-e56d-4978-85d0-d0bd22240eeb | payment_id = 148697499270 | usuario_id = 4ddf8330-ae94-4e92-a010-bdc7fa254ad5.

---

## A) Snapshot infra

### flyctl status -a goldeouro-backend-v2 (antes do patch)

```
App
  Name     = goldeouro-backend-v2
  Hostname = goldeouro-backend-v2.fly.dev
  Image    = goldeouro-backend-v2:deployment-01KJT40SH9FD11MABFHT8A7ZNH

Machines
PROCESS      	ID            	VERSION	REGION	STATE  	CHECKS            	LAST UPDATED
app          	2874551a105768	309    	gru   	started	1 total, 1 passing	2026-03-03T23:28:19Z
app          	e82d445ae76178	309    	gru   	stopped	1 total, 1 warning	2026-03-03T23:28:18Z
payout_worker	e82794da791108	309    	gru   	started	                  	2026-03-03T23:28:19Z
```

### flyctl machines list

- 2874551a105768 (app, started, 1/1)
- e82d445ae76178 (app, stopped)
- e82794da791108 (payout_worker, started)

### flyctl releases (amostra)

- v309 failed, v308 failed, v307 failed, v306 failed, v305 complete (Feb 25 2026), …

---

## B) DB_BEFORE (READ-ONLY)

Script via STDIN → `/app/db.js` no container (APP_HEALTHY_ID 2874551a105768).

- **ENV_SUPABASE_URL_PRESENT** true, LEN 40  
- **ENV_SUPABASE_SERVICE_ROLE_KEY_PRESENT** true, LEN 219  

### pagamentos_pix id = 87ee8545-e56d-4978-85d0-d0bd22240eeb

```json
{
  "id": "87ee8545-e56d-4978-85d0-d0bd22240eeb",
  "status": "pending",
  "amount": 10,
  "payment_id": "148697499270",
  "external_id": "148697499270",
  "created_at": "2026-03-03T20:32:29.162628+00:00",
  "updated_at": "2026-03-03T20:32:29.162628+00:00",
  "usuario_id": "4ddf8330-ae94-4e92-a010-bdc7fa254ad5"
}
```

### usuarios id = 4ddf8330-ae94-4e92-a010-bdc7fa254ad5

```json
{
  "id": "4ddf8330-ae94-4e92-a010-bdc7fa254ad5",
  "saldo": 79,
  "updated_at": "2026-03-02T21:22:08.544164+00:00"
}
```

---

## C) Evidência do bug (limit 10 antigos + IDs inválidos)

- **Limit 10:** O reconciler buscava `.limit(10)` e processava em ordem `created_at ASC`, então só os 10 pendentes **mais antigos** entravam no ciclo. O pagamento alvo (created_at 2026-03-03) é mais recente e nunca entrava no lote.
- **IDs inválidos:** Um registro com `external_id` no formato `deposito_<uuid>_<timestamp>` (não numérico) ocupava uma “vaga” dos 10: o código validava com `/^\d+$/` e fazia `continue`, mas como o total era 10, esse inválido impedia que um 11º candidato válido (ex.: o alvo) fosse considerado no mesmo ciclo.
- **Logs pré-patch (hotfix ENV):** `[RECON] ID de pagamento inválido (não é número): deposito_4ddf8330-ae94-4e92-a010-bdc7fa254ad5_1765383727057` a cada ~30s; nenhum “[RECON] approved” para 87ee8545.

---

## D) Mudança de código (diff + explicação)

**Arquivo:** `server-fly.js`, função `reconcilePendingPayments`.

**Resumo das alterações:**

1. **Buscar mais candidatos:** `limit(10)` → `limit(fetchLimit)` com `fetchLimit = parseInt(process.env.MP_RECONCILE_FETCH_LIMIT || '200', 10)`.
2. **Processar até N válidos:** `maxToProcess = parseInt(process.env.MP_RECONCILE_LIMIT || '10', 10)`; após filtrar só IDs numéricos, processar apenas `validCandidates.slice(0, maxToProcess)`.
3. **Filtrar só numéricos antes de processar:** Construir `validCandidates` com `mpId = String(external_id || payment_id || '').trim()` e incluir só se `/^\d+$/.test(mpId)`; inválidos são contados e ignorados sem consumir slot.
4. **Log por ciclo (sem dados sensíveis):**  
   `console.log('[RECON] ciclo: candidatos=${total} validos=${validos} invalidos=${invalidos} max=${maxToProcess}')`.
5. **Log ao ignorar inválido:**  
   `console.log('[RECON] ignorado: mpId invalido (nao numerico)', prefix)` com `prefix = mpId.slice(0,12)+'...'` se len>12.
6. **Log ao aprovar:**  
   `console.log('[RECON] approved aplicado', 'pix_id=' + pixRecord.id, 'amount=' + credit)` (sem token).
7. **Priorizar recentes:**  
   `.order('created_at', { ascending: false })` para que os primeiros `maxToProcess` válidos sejam os **mais recentes**, garantindo que o pagamento alvo de hoje entre no primeiro ciclo.

**Trecho relevante (estrutura atual):**

```javascript
// PATCH V309: busca mais candidatos (200), filtra só IDs numéricos, processa até MP_RECONCILE_LIMIT válidos por ciclo
const fetchLimit = parseInt(process.env.MP_RECONCILE_FETCH_LIMIT || '200', 10);
const maxToProcess = Math.max(1, parseInt(process.env.MP_RECONCILE_LIMIT || '10', 10));
// ...
.order('created_at', { ascending: false })
.limit(fetchLimit);
// ...
const validCandidates = []; let invalidos = 0;
for (const p of pendings) {
  const mpId = String(p.external_id || p.payment_id || '').trim();
  if (!/^\d+$/.test(mpId)) { invalidos++; console.log('[RECON] ignorado: mpId invalido (nao numerico)', prefix); continue; }
  validCandidates.push({ ...p, mpId, paymentId: parseInt(mpId, 10) });
}
console.log(`[RECON] ciclo: candidatos=${total} validos=${validos} invalidos=${invalidos} max=${maxToProcess}`);
const toProcess = validCandidates.slice(0, maxToProcess);
// ... processar toProcess ...
console.log('[RECON] approved aplicado', 'pix_id=' + pixRecord.id, 'amount=' + credit);
```

**Abordagem de ordenação:** Foi usada ordenação **DESC** (mais recentes primeiro) para dar chance ao pagamento alvo no primeiro ciclo; o fetch de 200 candidatos evita backlog infinito ao trazer um conjunto amplo por ciclo.

---

## E) Deploy (comandos e saída)

- **Comando:**  
  `flyctl deploy -a goldeouro-backend-v2 --remote-only --no-cache`
- **Build:** Imagem `registry.fly.io/goldeouro-backend-v2:deployment-01KJV1D49KR0EJEQ56WCQK2QN3` (primeiro deploy, com fetch 200 + filtro válidos + ASC). Em seguida alteração para **DESC** e segundo deploy: imagem `deployment-01KJV1YH1Y3CATDV6VQA5Z3K3J`.
- **Rollout:** Rolling update; máquinas 2874551a105768 (app) e e82794da791108 (payout_worker) em good state; app em V310 (primeiro deploy) e depois V311 (deploy com DESC).

---

## F) Confirmação pós-deploy

- **flyctl status:** app 2874551a105768 em VERSION **311**, state **started**, checks **1 total, 1 passing**.
- **Health:**  
  `Invoke-WebRequest https://goldeouro-backend-v2.fly.dev/health -UseBasicParsing` → 200, body com `"status":"ok"`, `"database":"connected"`, `"mercadoPago":"connected"`.

---

## G) Logs pós-deploy (reconciler)

Trechos com contagem e approved:

```
[RECON] ignorado: mpId invalido (nao numerico) deposito_4dd...
[RECON] ciclo: candidatos=40 validos=39 invalidos=1 max=10
```

(a cada ciclo ~30s)

Após deploy com **DESC** (V311):

```
[RECON] approved aplicado pix_id=87ee8545-e56d-4978-85d0-d0bd22240eeb amount=10
```

Nenhum 401/403/timeout relevante nos logs consultados.

---

## H) DB_AFTER (READ-ONLY)

Mesma consulta do DB_BEFORE, após ciclos do reconciler com código em V311 (order DESC).

### pagamentos_pix id = 87ee8545-e56d-4978-85d0-d0bd22240eeb

```json
{
  "id": "87ee8545-e56d-4978-85d0-d0bd22240eeb",
  "status": "approved",
  "amount": 10,
  "payment_id": "148697499270",
  "external_id": "148697499270",
  "created_at": "2026-03-03T20:32:29.162628+00:00",
  "updated_at": "2026-03-03T23:54:56.81632+00:00",
  "usuario_id": "4ddf8330-ae94-4e92-a010-bdc7fa254ad5"
}
```

### usuarios id = 4ddf8330-ae94-4e92-a010-bdc7fa254ad5

```json
{
  "id": "4ddf8330-ae94-4e92-a010-bdc7fa254ad5",
  "saldo": 89,
  "updated_at": "2026-03-03T23:54:56.996803+00:00"
}
```

---

## Veredito: **GO**

| Critério | Esperado | Observado |
|----------|----------|-----------|
| pagamentos_pix 87ee... status | approved | **approved** |
| updated_at > created_at | sim | **2026-03-03T23:54:56.81632+00:00** > created_at |
| saldo usuario | 79 + 10 = 89 | **89** |

O reconciler com patch (fetch 200, filtrar válidos, processar até 10 por ciclo, ordenação DESC e logs mínimos) aprovou o pagamento alvo e creditou +10 no saldo. Log `[RECON] approved aplicado pix_id=87ee8545-e56d-4978-85d0-d0bd22240eeb amount=10` confirma o evento.

---

## Declaração final

Incluiu alteração mínima no reconciler de depósitos PIX em `server-fly.js` e deploy. Não houve manipulação direta do DB. Alterações focadas em correção de lote (fetch 200, filtro de IDs numéricos, processar até `MP_RECONCILE_LIMIT` válidos, ordenação por `created_at` DESC) e observabilidade (logs de ciclo e approved sem dados sensíveis).
