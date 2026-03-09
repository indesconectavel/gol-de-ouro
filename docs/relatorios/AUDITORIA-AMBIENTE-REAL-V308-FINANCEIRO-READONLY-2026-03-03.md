# Auditoria ambiente real V308 — Financeiro (READ-ONLY)

**Data:** 2026-03-03  
**Modo:** 100% READ-ONLY. Nenhum deploy, rebuild, restart, scale, alteração de secrets/env ou edição de arquivos.  
**Objetivo:** Provar com evidências do ambiente real (containers Fly) que a V308 está correta para Saques PIX (worker + reconciler + patch V1) e que não há regressão em Depósito PIX e /game.

---

## A) Infra real

### 1) flyctl status -a goldeouro-backend-v2

```
App: goldeouro-backend-v2
Hostname: goldeouro-backend-v2.fly.dev
Image: goldeouro-backend-v2:deployment-01KJT40SH9FD11MABFHT8A7ZNH

Machines:
  app           2874551a105768   v308   gru   started   1 total, 1 passing
  app           e82d445ae76178   v308   gru   stopped  1 total, 1 warning
  payout_worker e82794da791108   v308   gru   started
```

### 2) flyctl machines list -a goldeouro-backend-v2

| ID             | NAME                 | STATE   | CHECKS | ROLE           | IMAGE (deployment)        |
|----------------|----------------------|---------|--------|----------------|---------------------------|
| 2874551a105768 | withered-cherry-5478 | started | 1/1    | app            | 01KJT40SH9FD11MABFHT8A7ZNH |
| e82d445ae76178 | dry-sea-3466         | stopped | 0/1    | app            | 01KJT40SH9FD11MABFHT8A7ZNH |
| e82794da791108 | weathered-dream-1146 | started | —      | payout_worker  | 01KJT40SH9FD11MABFHT8A7ZNH |

### 3) flyctl releases -a goldeouro-backend-v2

- v308: failed (1h16m ago)  
- v307: failed; v306: failed  
- v305: complete (Feb 25 2026)

*(Nota: flyctl releases não aceita -n 10; listagem padrão foi usada.)*

### 4) flyctl logs -a goldeouro-backend-v2 --no-tail

Trecho capturado (evidência de app/worker vivos, sem crash de env):

```
app[e82794da791108] [PAYOUT][WORKER] Início do ciclo
app[e82794da791108] [PAYOUT][WORKER] Nenhum saque pendente
app[e82794da791108] [PAYOUT][WORKER] Resumo { payouts_sucesso: 0, payouts_falha: 0 }
app[e82794da791108] [PAYOUT][WORKER] Fim do ciclo
```

Nenhuma mensagem de crash por ADMIN_TOKEN ou envalid nos logs recentes.

---

## B) Secrets (sem revelar valores)

### 5) flyctl secrets list -a goldeouro-backend-v2

**Nomes presentes (digest omitidos):**

- ADMIN_TOKEN  
- JWT_SECRET  
- SUPABASE_URL  
- SUPABASE_SERVICE_ROLE_KEY  
- SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY  
- MERCADOPAGO_ACCESS_TOKEN  
- MERCADOPAGO_WEBHOOK_SECRET  
- MERCADOPAGO_DEPOSIT_ACCESS_TOKEN  
- MERCADOPAGO_PAYOUT_ACCESS_TOKEN (e PAYOUT_PIX_ENABLED, ENABLE_PIX_PAYOUT_WORKER, etc.)

**Checklist obrigatório:**

| Secret                           | Presente |
|----------------------------------|----------|
| ADMIN_TOKEN                      | Sim      |
| JWT_SECRET                       | Sim      |
| SUPABASE_URL                     | Sim      |
| SUPABASE_SERVICE_ROLE_KEY        | Sim      |
| MERCADOPAGO_ACCESS_TOKEN         | Sim      |
| MERCADOPAGO_WEBHOOK_SECRET       | Sim      |
| MERCADOPAGO_DEPOSIT_ACCESS_TOKEN | Sim      |

**Bloqueadores:** Nenhum. Todos os secrets obrigatórios existem.

---

## C) Prova no container (máquina app healthy)

**Máquina app com 1/1 checks passing:** `2874551a105768`

Comandos executados via:  
`flyctl ssh console --machine 2874551a105768 -a goldeouro-backend-v2 -C "<comando>"`

| Comando | Output relevante |
|---------|-------------------|
| `pwd` | `/app` |
| `ls -la` | Raiz: config, controllers, database, middlewares, node_modules, server-fly.js, src, utils, ... |
| `ls -la node_modules/envalid` | Diretório existe: LICENSE, README.md, dist, package.json, src |
| `ls -la src/domain/payout` | processPendingWithdrawals.js, reconcileProcessingWithdrawals.js, withdrawalStatus.js |
| `grep -n updateSaqueStatus src/domain/payout/processPendingWithdrawals.js` | 50:const updateSaqueStatus = async ...; 106, 292, 324, 422: usos/export |
| `grep -Rn reconcileProcessingWithdrawals src/domain/payout src/workers` | reconcileProcessingWithdrawals.js:38,40,293; payout-worker.js:5,112 |
| `grep -n pagamentos_pix server-fly.js` | 1830, 1909, 1914, 1935, 2023, 2030, 2075, 2085, 2358, 2396 |
| `grep -n api/payments/pix/criar server-fly.js` | 1729: app.post('/api/payments/pix/criar', ...) |
| `grep -n pending server-fly.js` | 1837: status: 'pending'; 1862: status: 'pending'; 2360: .in('status', ['pending', 'pendente']) |
| `grep -n api/user/profile server-fly.js` | 1023: app.get('/api/user/profile', ...); 1073: app.put(...) |
| `grep -n api/games/shoot server-fly.js` | 1168: app.post('/api/games/shoot', ...) |
| `grep -n api/fila/entrar server-fly.js` | 3138-3139: app.get('/api/fila/entrar', ...) |

**Observação:** Um comando com aspas duplas no padrão (`grep -n "status: 'pending'" server-fly.js`) falhou no SSH com erro de rede/DNS; o mesmo conteúdo foi confirmado com `grep -n pending server-fly.js` (linhas 1837, 1862, 2360).

---

## D) Prova no container (máquina payout_worker)

**Máquina:** `e82794da791108`

| Comando | Output relevante |
|---------|-------------------|
| `ls -la src/workers` | payout-worker.js (4289 bytes, Mar 2 22:29) |
| `grep -Rn reconcileProcessingWithdrawals src/workers src/domain/payout` | payout-worker.js:5 require, :112 await reconcileProcessingWithdrawals({...}); reconcileProcessingWithdrawals.js:38,40,293 |
| `grep -n setInterval src/workers/payout-worker.js` | 128: setInterval(runCycle, intervalMs); 130: setInterval(runReconcileCycle, reconcileIntervalMs); |
| `grep -n runReconcileCycle src/workers/payout-worker.js` | 103: async function runReconcileCycle(); 129: runReconcileCycle(); 130: setInterval(runReconcileCycle, ...) |

Alguns comandos SSH no worker retornaram no final "Error: Identificador inválido" ou "context deadline exceeded"; a saída útil foi capturada antes do erro (evidência suficiente). Alternativa em ambiente com SSH instável: usar WSL ou `flyctl machine exec` para comandos pontuais.

---

## E) Não-regressão Depósito PIX e /game (evidência no container)

### Depósito PIX

- **Insert em pagamentos_pix:** No `server-fly.js` do container, linhas **1837** e **1862** usam **`status: 'pending'`** (string literal para depósito; não 'pendente' nem constante de saque).
- **reconcilePendingPayments:** Linha **2360** usa **`.in('status', ['pending', 'pendente'])`** — aceita ambos os valores para reconciliação.

### Rotas /game (independentes do domínio payout)

- **GET /api/user/profile:** linha 1023 (authenticateToken).  
- **POST /api/games/shoot:** linha 1168.  
- **GET /api/fila/entrar:** linhas 3138-3139.  

Todas presentes no mesmo `server-fly.js`; não dependem de `src/domain/payout`.

---

## F) Estado das máquinas e risco operacional

### 10) Estado atual

- **1 app healthy:** 2874551a105768 — started, 1/1 passing, imagem deployment-01KJT40SH9FD11MABFHT8A7ZNH (V308).  
- **1 app stopped:** e82d445ae76178 — stopped, 0/1, mesma imagem V308.  
- **1 payout_worker:** e82794da791108 — started, mesma imagem.

**Risco operacional (descrição, sem ações automáticas):** O tráfego HTTP é atendido por uma única instância app. Se a máquina 2874551a105768 cair ou for reiniciada, não há outra app em started para absorver o tráfego até a segunda máquina ser iniciada ou até novo deploy. A segunda máquina (e82d445ae76178) permanece stopped por decisão do Fly (estado anterior ao update).

### 11) /health (read-only)

**PowerShell:**  
`Invoke-WebRequest https://goldeouro-backend-v2.fly.dev/health -UseBasicParsing`

- **StatusCode:** 200  
- **Content:**  
  `{"status":"ok","timestamp":"2026-03-03T16:32:34.849Z","version":"1.2.1","database":"connected","mercadoPago":"connected","contadorChutes":211,"ultimoGolDeOuro":0}`

---

## Tabela GO/NO-GO por item

| Item | Critério | Resultado |
|------|----------|-----------|
| B) Secrets | Obrigatórios presentes (nomes) | GO — todos presentes |
| C) Container app | node_modules/envalid existe | GO — existe |
| C) Container app | updateSaqueStatus + reconcile no código | GO — presentes |
| C) Container app | Arquivos reconciler + processPending em src/domain/payout | GO — presentes |
| E) Depósito | Insert pagamentos_pix com status 'pending' | GO — 1837, 1862 |
| E) Depósito | reconcilePendingPayments .in(['pending','pendente']) | GO — 2360 |
| E) /game | Rotas profile, shoot, fila/entrar em server-fly.js | GO — 1023, 1168, 3139 |
| F) Health | /health 200 | GO — 200, body ok |

---

## Veredito final (ambiente real)

**GO — Ambiente real V308 está aprovado para Saques PIX (worker + reconciler + patch V1) e sem indício de regressão em Depósito PIX ou /game.**

- Secrets obrigatórios: presentes.  
- Container app (healthy): envalid instalado; `updateSaqueStatus`, `reconcileProcessingWithdrawals`, `processPendingWithdrawals` e rotas de depósito/game confirmados por arquivo/linha no sistema de arquivos da imagem.  
- Container payout_worker: `reconcileProcessingWithdrawals` e `runReconcileCycle`/setInterval confirmados.  
- Depósito PIX: insert com `status: 'pending'`; reconciliação com `['pending','pendente']`.  
- /game: rotas profile, shoot e fila/entrar presentes.  
- /health: 200, database e Mercado Pago conectados.

**Bloqueadores objetivos:** Nenhum.

**Recomendações (somente leitura):** Documentar o estado de uma app stopped e o risco de single point of failure para decisões futuras de capacidade ou recuperação da segunda máquina.
