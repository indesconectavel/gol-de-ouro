# Simulação — Webhook replay (documental)

**Refs:** M1 idempotência · [RUNBOOK-replay-webhook](../../runbooks/seguranca/RUNBOOK-replay-webhook.md)

---

## Cenário

Mesmo `payment_id` reenviado 10× em 5 min. Indicadores `replay`/`idempotency` nos logs.

## Impacto esperado

- Se M1 OK: sem duplicata ledger
- Se falha: dups_corr_tipo > 0 → **P0**

## Alertas

- C-02 se duplicata
- SEC-04 replay indicators
- FIN-C02 proof invalid

## Runbooks

1. [RUNBOOK-replay-webhook](../../runbooks/seguranca/RUNBOOK-replay-webhook.md)
2. [RUNBOOK-duplicata-ledger](../../runbooks/financeiro/RUNBOOK-duplicata-ledger.md)

## Rollback

- Freeze créditos manuais
- Reversão Plano B se duplicata confirmada

## Classificação

| Resultado | P |
|-----------|---|
| Idempotente | P3 |
| 1 dup ledger | P0 |

## Contenção

| Ação | SLA |
|------|-----|
| `watchdog-financial-integrity.js` | 10 min |
| Isolar payment_id | 30 min |
| SQL forense read-only | 2 h |
