# Simulação — Worker offline (documental)

**Refs:** V1.2E WK-01 · [RUNBOOK-payout-worker-offline](../../runbooks/workers/RUNBOOK-payout-worker-offline.md)

---

## Cenário

`PAYOUT_WORKER` habilitado no env mas zero `[PAYOUT][WORKER][HEARTBEAT]` em janela Fly de 800+ linhas. Reconcile sem sinais por >30 min.

## Impacto esperado

- Saques em `processando` sem progresso
- Backlog reconcile estável ou crescente
- Score workers → 0–30; reliability **DEGRADED**

## Alertas

- A-06 (V1.2B)
- WK-01, WK-02 (V1.2E/V1.3)
- IH-WK (autonomous-reliability-check)

## Runbooks

1. [RUNBOOK-payout-worker-offline](../../runbooks/workers/RUNBOOK-payout-worker-offline.md)
2. [RUNBOOK-reconcile-parado](../../runbooks/workers/RUNBOOK-reconcile-parado.md)
3. [RUNBOOK-backlog-growth](../../runbooks/workers/RUNBOOK-backlog-growth.md)

## Rollback

- Não rollback de app por default
- Restart controlado Fly machine (fora escopo read-only — change control)
- Verificar env flags sem alterar em simulação

## Classificação

| Condição | P |
|----------|---|
| Heartbeat ausente, saques OK | P3 |
| Saques stuck >24h | P1 |
| Payout financeiro travado | P0 |

## Contenção esperada

| Etapa | Tempo |
|-------|-------|
| `heartbeat-worker-monitor.js` | 10 min |
| Logs Fly filtrados | 20 min |
| Escalar se stuck > 0 | 1 h |
