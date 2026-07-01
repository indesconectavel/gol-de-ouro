# Simulação — Payout flood (documental)

**Refs:** [RUNBOOK-flood-payout-webhook](../../runbooks/seguranca/RUNBOOK-flood-payout-webhook.md)

---

## Cenário

Spike de `withdraw_webhook_rejected` > 50 em 800 linhas Fly. Possível ataque ou misconfiguration MP.

## Impacto

- Logs ruidosos; risco de rate limit
- Sem crédito se 401 mantido (V1.1F)
- security watchdog SEC-03 falha

## Alertas

- A-05 (V1.2B)
- SEC-03 (V1.2E/V1.3)

## Runbooks

1. [RUNBOOK-flood-payout-webhook](../../runbooks/seguranca/RUNBOOK-flood-payout-webhook.md)
2. [RUNBOOK-webhook-rejected-spike](../../runbooks/seguranca/RUNBOOK-webhook-rejected-spike.md)
3. [RUNBOOK-hmac-failure](../../runbooks/seguranca/RUNBOOK-hmac-failure.md)

## Rollback

- Rotacionar secrets MP (change control)
- Não desabilitar HMAC

## Classificação

| Volume | P |
|--------|---|
| Rejected only, 401 OK | P3 |
| 200 não-401 | P0 |

## Contenção

| Etapa | Tempo |
|-------|-------|
| Probes 401 | 5 min |
| Análise logs | 30 min |
| WAF/rate limit infra | 2–8 h |
