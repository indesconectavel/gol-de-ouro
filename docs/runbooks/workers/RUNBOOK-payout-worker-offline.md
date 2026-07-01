# RUNBOOK — Payout worker offline

**Área:** Workers · **Alerta V1.2B:** A-06, M-06

---

## Sintomas

- `/health/workers`: `payoutWorker.enabledByEnv: true` mas sem `[PAYOUT][WORKER][HEARTBEAT]` nos logs.
- Saques `pendente` / `processando` acumulando.
- Alerta **A-06** (amostra logs ≥ 300 linhas).

## Severidade

| Situação | Nível |
|----------|-------|
| Liveness inconclusivo (amostra pequena) | **P2** |
| Env on + zero heartbeat + backlog saque | **P1** |
| Saques pagos sem ledger / saldo travado | **P0** |

## Possíveis causas

- Processo worker crash loop.
- `PAYOUT_PIX_PROCESSING_ENABLED` false no runtime real vs endpoint.
- Deploy sem worker start.
- Fly machine OOM.

## Queries (read-only)

```bash
curl -s https://goldeouro-backend-v2.fly.dev/health/workers | jq
flyctl logs -a goldeouro-backend-v2 --no-tail | findstr /i "PAYOUT WORKER HEARTBEAT"
```

```sql
SELECT status, count(*) FROM saques GROUP BY 1;
SELECT * FROM saques
WHERE lower(trim(status::text)) IN ('pendente', 'pending', 'processando')
ORDER BY updated_at DESC LIMIT 20;
```

## Critérios GO / NO-GO

| GO | NO-GO |
|----|-------|
| Heartbeat &lt; 5 min em logs amplos | Backlog saque + sem heartbeat |
| Fila vazia (só legado cancelado) | `processando` &gt; 24 h |

## Ações permitidas

- Restart machine Fly (change control).
- Revisar env secrets Fly.
- Escalar amostra logs (`V12B_FLY_LOG_LINES`).

## Ações proibidas

- Processar payout manual em massa sem idempotência.
- Desabilitar validação saldo.

## Rollback

Backend deploy anterior se worker sumiu após release.

## Escalonamento

Ops → engenharia payout → Fly support se infra.
