# RUNBOOK — Reconcile PIX parado

**Área:** Workers · **Alerta V1.2B:** A-02 · **Ref:** V1.1D

---

## Sintomas

- `reconcile_backlog_pending` crescendo.
- Muitos `pending` sem transição.
- Sem logs de ciclo reconcile (Fly).

## Severidade

| Situação | Nível |
|----------|-------|
| Backlog estável 54 | **P3** |
| Backlog crescente | **P1** |
| `approved` em MP mas local `pending` em massa | **P1** |

## Possíveis causas

- Worker/cron desligado.
- Rate limit MP.
- Early-return webhook em backlog `approved` (by design V1.1D).
- Env reconcile desabilitado.

## Queries (read-only)

```sql
SELECT count(*) FROM pagamentos_pix
WHERE lower(trim(status::text)) = 'pending'
  AND COALESCE(reconcile_skip, false) = false;
```

```bash
flyctl logs -a goldeouro-backend-v2 --no-tail | findstr /i reconcile
node scripts/v1-2b-operational-alerts.js
```

## Critérios GO / NO-GO

| GO | NO-GO |
|----|-------|
| Backlog estável; novos PIX OK | Backlog ↑ + novos `approved` sem ledger |

## Ações permitidas

- Verificar env flags no `/health/workers`.
- Revisar limites de ciclo (config).
- Amostrar MP para pending antigos.

## Ações proibidas

- Reconcile forçar crédito em massa.
- Desabilitar HMAC para “acelerar”.

## Rollback

Deploy se regressão pós-release reconcile.

## Escalonamento

Ops → backend on-call → MP se API down.
