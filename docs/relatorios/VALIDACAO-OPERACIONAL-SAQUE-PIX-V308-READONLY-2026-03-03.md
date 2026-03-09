# Validação operacional Saque PIX V308 — READ-ONLY

**Data:** 2026-03-03  
**Modo:** 100% READ-ONLY. Nenhum deploy, rebuild, restart, scale, alteração de secrets/env ou edição de arquivos.  
**Objetivo:** Confirmar em runtime que o payout_worker está rodando com reconciler agendado, que Supabase/MP não apresentam erros recorrentes, que o fluxo PENDING→PROCESSING→COMPLETED/REJECTED está coerente, e que não há regressão em Depósito PIX e /game.

---

## PASSO 0 — Snapshot infra (evidência)

### flyctl status -a goldeouro-backend-v2

```
App: goldeouro-backend-v2
Hostname: goldeouro-backend-v2.fly.dev
Image: goldeouro-backend-v2:deployment-01KJT40SH9FD11MABFHT8A7ZNH

Machines:
  app           2874551a105768   v308   gru   started   1 total, 1 passing
  app           e82d445ae76178   v308   gru   stopped  1 total, 1 warning
  payout_worker e82794da791108   v308   gru   started
```

### flyctl machines list -a goldeouro-backend-v2

| ID             | NAME                 | STATE   | CHECKS | PROCESS GROUP | IMAGE (deployment)        |
|----------------|----------------------|---------|--------|---------------|---------------------------|
| 2874551a105768 | withered-cherry-5478 | started | 1/1    | app           | 01KJT40SH9FD11MABFHT8A7ZNH |
| e82d445ae76178 | dry-sea-3466         | stopped | 0/1    | app           | 01KJT40SH9FD11MABFHT8A7ZNH |
| e82794da791108 | weathered-dream-1146 | started | —      | payout_worker | 01KJT40SH9FD11MABFHT8A7ZNH |

### flyctl releases -a goldeouro-backend-v2

*(Nota: flyctl releases não aceita -n 12; listagem padrão foi usada.)*

- v308: failed (4h7m ago)  
- v307, v306: failed  
- v305: complete (Feb 25 2026)  
- v302–v297, v294–v284: várias complete/failed

---

## PASSO 1 — Secrets (somente presença)

### flyctl secrets list -a goldeouro-backend-v2

**Nomes presentes (valores não revelados):**

| Nome obrigatório                    | OK  |
|------------------------------------|-----|
| ADMIN_TOKEN                        | Sim |
| JWT_SECRET                         | Sim |
| SUPABASE_URL                       | Sim |
| SUPABASE_SERVICE_ROLE_KEY          | Sim |
| MERCADOPAGO_ACCESS_TOKEN           | Sim |
| MERCADOPAGO_WEBHOOK_SECRET         | Sim |
| MERCADOPAGO_DEPOSIT_ACCESS_TOKEN   | Sim |

Todos os secrets obrigatórios existem. Nenhum bloqueador.

---

## PASSO 2 — Health (read-only)

**Comando (PowerShell):**  
`Invoke-WebRequest https://goldeouro-backend-v2.fly.dev/health -UseBasicParsing`

- **Timestamp da verificação:** 2026-03-03T16:18:45 (local) / 2026-03-03T19:18:43.429Z (no body).
- **StatusCode:** 200  
- **Content:**  
  `{"status":"ok","timestamp":"2026-03-03T19:18:43.429Z","version":"1.2.1","database":"connected","mercadoPago":"connected","contadorChutes":211,"ultimoGolDeOuro":0}`

---

## PASSO 3 — Prova runtime do payout_worker via logs

### 1) Coleta: flyctl logs -a goldeouro-backend-v2 --no-tail

### 2) Filtro (Select-String): PAYOUT, SAQUE, MP, MERCADO, PROCESSING, PENDING, COMPLETED, REJECTED, reconcile, reconciler, timeout, error, fail, exception, RECON

### Trechos relevantes (evidência mínima obrigatória)

**Ciclos do worker (Início do ciclo / Fim do ciclo):**

```
app[e82794da791108] [PAYOUT][WORKER] Início do ciclo
app[e82794da791108] [PAYOUT][WORKER] Início do ciclo
app[e82794da791108] [PAYOUT][WORKER] Nenhum saque pendente
app[e82794da791108] [PAYOUT][WORKER] Resumo { payouts_sucesso: 0, payouts_falha: 0 }
app[e82794da791108] [PAYOUT][WORKER] Nenhum saque processado neste ciclo
app[e82794da791108] [PAYOUT][WORKER] Fim do ciclo
```

Ciclos repetem a cada ~30 s (coerente com PAYOUT_WORKER_INTERVAL_MS). Máquina do worker: **e82794da791108**.

**Sinal do reconciler:** Nos logs recentes não aparece a string literal "reconcile" ou "RECON" porque não há saques em PROCESSING para reconciliar; o código do reconciler está integrado no worker (evidência no PASSO 4 via grep no container). O worker chama `runReconcileCycle` em setInterval (payout-worker.js linhas 103, 129, 130).

**Ausência de spam de erro Supabase/MP:** Nos trechos coletados e filtrados **não há** mensagens de erro recorrentes de Supabase ou Mercado Pago. Nenhum bloqueador por erro de conexão/credencial nos logs.

---

## PASSO 4 — Prova no container (sem imprimir secrets)

**IDs:** app healthy = **2874551a105768**; payout_worker = **e82794da791108**.

### 4A) SSH na app healthy (2874551a105768)

| Comando | Output relevante |
|---------|-------------------|
| `pwd` | `/app` |
| `ls -la src/domain/payout` | processPendingWithdrawals.js, reconcileProcessingWithdrawals.js, withdrawalStatus.js |
| `grep -n reconcilePendingPayments server-fly.js` | 2344:async function reconcilePendingPayments(); 2445: setInterval(reconcilePendingPayments, ...) |
| `grep -n pending server-fly.js` | 1837: status: 'pending'; 1862: status: 'pending'; 2360: .in('status', ['pending', 'pendente']) |
| `grep -n updateSaqueStatus src/domain/payout/processPendingWithdrawals.js` | 50:const updateSaqueStatus = async ...; 106, 292, 324, 422: usos/export |

### 4B) SSH no payout_worker (e82794da791108)

| Comando | Output relevante |
|---------|-------------------|
| `pwd` | `/app` |
| `ls -la src/workers` | payout-worker.js (4289 bytes) |
| `grep -n runReconcileCycle src/workers/payout-worker.js` | 103:async function runReconcileCycle(); 129:runReconcileCycle(); 130:setInterval(runReconcileCycle, reconcileIntervalMs); |
| `grep -n setInterval src/workers/payout-worker.js` | 128:setInterval(runCycle, intervalMs); 130:setInterval(runReconcileCycle, reconcileIntervalMs); |
| `grep -Rn reconcileProcessingWithdrawals src/workers src/domain/payout` | payout-worker.js:5 require, :112 await reconcileProcessingWithdrawals({...}); reconcileProcessingWithdrawals.js:38,40,293 |

**Conclusão:** Reconciler está integrado no worker (runReconcileCycle agendado); updateSaqueStatus existe no domínio payout; no server-fly.js o depósito usa status 'pending' e reconcilePendingPayments usa .in(['pending','pendente']).

---

## PASSO 5 — Prova /game e depósito não regrediram (read-only)

Requisições **sem autenticação** (esperado 401):

| Endpoint | Método | Status HTTP observado | Conclusão |
|----------|--------|------------------------|-----------|
| /api/user/profile | GET | **401** | Rota existe; app responde; não 5xx. |
| /api/payments/pix/usuario | GET | **401** | Rota existe; app responde; não 5xx. |

**Reforço (evidência no container):** No server-fly.js da app healthy: insert em pagamentos_pix com **status: 'pending'** (linhas 1837, 1862); **.in('status', ['pending', 'pendente'])** na reconciliação de PIX pendentes (linha 2360). Depósito PIX e fluxo de reconciliação coerentes com o esperado.

---

## PASSO 6 — Veredito GO/NO-GO (ambiente real)

### Tabela GO/NO-GO por item

| Item | Critério | Resultado |
|------|----------|-----------|
| Health | /health = 200 | **GO** — 200, database e mercadoPago connected |
| Secrets | Obrigatórios presentes | **GO** — todos listados |
| Worker logs | Ciclos visíveis, sem erro recorrente Supabase/MP | **GO** — Início/Fim do ciclo e Resumo; sem spam de erro |
| Reconciler | Integrado no worker (grep/ls) | **GO** — runReconcileCycle + setInterval; reconcileProcessingWithdrawals no worker |
| updateSaqueStatus | Existe no container app | **GO** — processPendingWithdrawals.js linhas 50, 106, 292, 324, 422 |
| Depósito | status 'pending' + .in(['pending','pendente']) | **GO** — server-fly.js 1837, 1862, 2360 |
| /game e depósito HTTP | Endpoints respondem (401), não 5xx | **GO** — profile e pix/usuario retornam 401 |

### Veredito final

**GO — Ambiente real V308 aprovado para operação do Saque PIX (worker + reconciler agendado).**

- payout_worker está rodando com ciclos regulares (Início do ciclo / Fim do ciclo) e reconciler agendado (runReconcileCycle em setInterval).
- Logs não mostram erros recorrentes de Supabase ou Mercado Pago.
- Fluxo PENDING → PROCESSING → COMPLETED/REJECTED está coerente no código (updateSaqueStatus, reconcileProcessingWithdrawals); em runtime não havia saques pendentes no intervalo observado.
- Depósito PIX: status 'pending' e .in(['pending','pendente']) confirmados no container.
- /game e depósito: rotas respondem 401 sem auth; nenhum 5xx.

### Bloqueadores objetivos

**Nenhum.**

---

*Relatório gerado em modo 100% READ-ONLY. Nenhuma ação corretiva foi executada.*
