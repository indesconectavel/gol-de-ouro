# RUNBOOK — Spike `rollback` / `falha_payout` no ledger

**Área:** Financeiro · **Alerta V1.2B:** A-04 · **Baseline:** 13 `falha_payout`, 14 `rollback` (V1.2A)

---

## Sintomas

- `falha_payout` ou `rollback` cresce ≥ +3 vs baseline em janela curta.
- Alerta **A-04** disparado.
- Saques cancelados/rejeitados em sequência.

## Severidade

| Situação | Nível |
|----------|-------|
| Contagem estável (legado) | **P3** |
| Delta ≥ 3 em 24–72 h | **P1** |
| Rollback após crédito indevido confirmado | **P0** |

## Possíveis causas

- Falhas MP no payout automático.
- Saldo insuficiente / validação saque.
- Regressão worker payout pós-deploy.
- Operações manuais `rollback_manual` (ledger).

## Queries (read-only)

```sql
SELECT tipo, count(*) FROM ledger_financeiro
WHERE tipo IN ('rollback', 'falha_payout', 'rollback_manual')
GROUP BY 1;

SELECT id, correlation_id, tipo, valor, referencia, created_at
FROM ledger_financeiro
WHERE tipo IN ('rollback', 'falha_payout')
  AND created_at > now() - interval '72 hours'
ORDER BY created_at DESC
LIMIT 30;

SELECT id, status, valor, updated_at FROM saques
WHERE updated_at > now() - interval '72 hours'
ORDER BY updated_at DESC;
```

## Critérios GO / NO-GO

| GO | NO-GO |
|----|-------|
| Spike explicado (falhas MP esperadas) | Spike + saldo negativo ou duplicata |
| Sem saques presos | Saques `processando` &gt; 24 h |

## Ações permitidas

- Correlacionar `correlation_id` saque ↔ ledger.
- Revisar logs Fly `[PAYOUT]`, `financeLog`.
- Pausar novos saques via produto (decisão negócio).

## Ações proibidas

- DELETE em ledger.
- Reprocessar payout em massa sem idempotência.

## Rollback

- Deploy backend se spike coincide com release Fly.
- Financeiro: plano B por transação se crédito indevido.

## Escalonamento

Ops → Financeiro → Engenharia payout → MP se erro API sistemático.
