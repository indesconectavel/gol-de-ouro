# CORRECAO 4 V1 — HEALTH / OBSERVABILIDADE DO PAYOUT WORKER

Data: 2026-04-28  
Modo: Execucao controlada  
Alteracoes: **somente heartbeat de log no worker + endpoint GET read-only** — **sem mudanca** em seleção/processamento/saque/rollback de payout.

## 1. Como o worker roda hoje

- `fly.toml` define dois processos: `app` (`npm start` → servidor HTTP) e `payout_worker` (`node src/workers/payout-worker.js`).
- O health check Fly (`[[services.http_checks]] path="/health"`) atinge apenas o **processo HTTP na porta interna do app** (`processes = ["app"` implícito no serviço). O **worker nao escuta porta HTTP**.
- `src/workers/payout-worker.js`: se `ENABLE_PIX_PAYOUT_WORKER` nao for `true`, sai; ciclo principal em `setInterval(runCycle, intervalMs)` chamando apenas `processPendingWithdrawals` (codigo financeiro intacto nesta correção).

## 2. Registro / heartbeat existente antes

- Cada ciclo já loga inicio/fim (`🟦 Início/Fim do ciclo`). Nao havia linha dedicada de **liveness** em intervalo independente do tempo de processamento.

## 3. `/health` atual

- `GET /health` no `server-fly.js` verifica app principal (DB, Mercado Pago em memoria, contadores). **Nao** reflete o processo `payout_worker`.

## 4. Decisão (menor risco V1)

**Híbrido A + B leve:**

- **A)** Heartbeat periódico no worker: log `[PAYOUT][WORKER][HEARTBEAT]` com `ts`, `uptime_s`, `payout_cycle_ms`, `pid` — **somente texto**, sem novo trigger de ciclo payout, sem novo schema DB.
- **B)** Endpoint read-only **`GET /health/workers`** no processo HTTP: expõe **apenas** flags booleanas derivadas do ambiente (`ENABLE_PIX_PAYOUT_WORKER`, `PAYOUT_PIX_ENABLED`) — mesma ENV no deploy Fly para os dois processos, útil como “intenção de deploy”; o texto da resposta deixa explícito que **liveness real** é via logs.
- **C)** Esta documentação + comandos sugeridos de `fly logs` para filtrar o heartbeat.

Nao foram adicionados triggers de processamento, execução de payout via HTTP, nem alteração ao schema.

## 5. Como validar o worker “ativo”

1. **Evidência forte (runtime):** Nos logs Fly do app, logs do grupo `payout_worker` ou stream geral — procurar linhas **`[PAYOUT][WORKER][HEARTBEAT]`** a cada (~60s padrão, configurável por `PAYOUT_WORKER_HEARTBEAT_LOG_MS` entre 30s e 120s).
2. **Evidência de configuração:** `GET /health/workers` (produção) — `enabledByEnv` esperado `true` se o rollout pretende ligar o worker; se `false`, o processo sai no boot ( já comportamento existente antes desta mudança).
3. **Comando operacional (exemplo):**  
   `fly logs -a goldeouro-backend-v2 --no-tail`  
   Filtrar no cliente por `HEARTBEAT` ou `PAYOUT][WORKER]`.

## 6. Arquivos alterados

- `src/workers/payout-worker.js` — timer de heartbeat (log).
- `server-fly.js` — `GET /health/workers`, skip de rate-limit em `/health/workers`.

## 7. O que não mudou

- `processPendingWithdrawals`, criacao PIX de saque, ledger, webhook, seleção automática vs manual, auto-heal.
- Fluxo financeiro e regra de rollback.

## 8. Validacao tecnica pedida na tarefa

- `node --check server-fly.js` e `node --check src/workers/payout-worker.js`

## 9. Risco final

**Baixo.** Apenas observabilidade e um GET sem side effects; heartbeat isolado dos ciclos reais de payout.
