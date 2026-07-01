# RUNBOOK — PIX `approved` sem ledger `deposito`

**Área:** Financeiro · **Alerta V1.2B:** A-01, B-01 · **Baseline:** 34 approved sem ledger (V1.2A)

---

## Sintomas

- `approved_without_ledger` &gt; 34 ou crescendo vs baseline.
- PIX `approved` em `pagamentos_pix` sem linha `ledger_financeiro` tipo `deposito`.
- Alertas V1.2B **A-01** (alto) ou **B-01** (estável).

## Severidade

| Situação | Nível |
|----------|-------|
| Contagem **igual** ao baseline 34 (legado) | **P3** |
| Contagem **crescente** ou novos `approved` 72h sem ledger | **P1** |
| Suspeita double-credit / fraude | **P0** |

## Possíveis causas

- Backlog legado pré-RPC M1 (maioria dos 34).
- Casos U1–U4 fora do auto-heal ([runbook U1–U4](../../relatorios/V1-1B-M1-RUNBOOK-U1-U4-PIX-SUSPEITOS-2026-05-17.md)).
- Webhook/reconcile não executou; RPC `not_found` / status não `approved` no MP.
- `ledger_backfill` registrou ledger **sem** creditar saldo (by design).

## Queries (read-only)

```sql
-- Contagem approved sem ledger
SELECT count(*) FROM pagamentos_pix p
WHERE lower(trim(p.status::text)) = 'approved'
  AND NOT EXISTS (
    SELECT 1 FROM ledger_financeiro l
    WHERE l.correlation_id = p.payment_id AND l.tipo = 'deposito'
  );

-- Amostra recentes (72h)
SELECT payment_id, status, approved_at, updated_at, usuario_id
FROM pagamentos_pix
WHERE lower(trim(status::text)) = 'approved'
  AND COALESCE(approved_at, updated_at, created_at) > now() - interval '72 hours'
ORDER BY COALESCE(approved_at, updated_at) DESC
LIMIT 20;
```

```bash
node scripts/v1-2a-runtime-financial-health.js
node scripts/v1-2b-operational-alerts.js
```

## Critérios GO / NO-GO

| GO (continuidade) | NO-GO |
|-------------------|-------|
| Contagem estável = 34; 0 novos recentes sem ledger | Contagem &gt; baseline ou `recent_without_ledger` &gt; 0 |
| Duplicatas ledger = 0 | Duplicatas &gt; 0 |
| RPC probe `not_found` em IDs fake OK | Saldo negativo ou crédito manual não auditado |

## Ações permitidas

- Inventariar `payment_id` novos vs baseline.
- Consultar MP GET payment (read-only API).
- Executar runbook U1–U4 caso a caso.
- Registrar decisão ops antes de crédito manual.

## Ações proibidas

- Invocar `claim_and_credit_approved_pix_deposit` em U1–U4 sem decisão.
- Assumir `ledger_backfill` = saldo creditado.
- SQL UPDATE em massa em `usuarios.saldo` sem ticket.

## Rollback

- **Financeiro:** não há rollback automático; reversão via plano B documentado se crédito indevido.
- **Deploy:** só se regressão RPC correlacionada (ver runtime runbooks).

## Escalonamento

1. Ops on-call → 2. Responsável financeiro → 3. Engenharia (RPC/ledger) se novos casos pós-patch M1.
