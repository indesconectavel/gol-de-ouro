# RUNBOOK — Duplicata ledger `(correlation_id, tipo)`

**Área:** Financeiro · **Alerta V1.2B:** C-02 · **Baseline:** 0 duplicatas

---

## Sintomas

- `dups_corr_tipo` &gt; 0.
- Alerta **C-02** / incidente **P0**.
- Suspeita de double-credit no saldo.

## Severidade

**P0 — CRÍTICO** (sempre que duplicata confirmada em produção).

## Possíveis causas

- Índice único ausente ou bypass.
- Race em webhook + reconcile.
- Retry MP sem idempotência.
- SQL manual duplicado.

## Queries (read-only)

```sql
SELECT correlation_id, tipo, count(*) AS n
FROM ledger_financeiro
GROUP BY 1, 2
HAVING count(*) > 1;

SELECT * FROM ledger_financeiro
WHERE (correlation_id, tipo) IN (
  SELECT correlation_id, tipo FROM ledger_financeiro
  GROUP BY 1, 2 HAVING count(*) > 1
)
ORDER BY correlation_id, created_at;

-- Saldo usuário afetado
SELECT u.id, u.saldo, l.*
FROM ledger_financeiro l
JOIN usuarios u ON u.id = l.usuario_id
WHERE l.correlation_id = '<PAYMENT_OR_SAQUE_ID>';
```

## Critérios GO / NO-GO

| GO | NO-GO |
|----|-------|
| Falso positivo (tipos diferentes normalizados) | ≥ 1 duplicata real confirmada |
| | Qualquer saldo inconsistente com ledger |

## Ações permitidas

- Freeze deploy (**sim**).
- Congelar créditos manuais.
- Exportar amostra para auditoria.
- Abrir P0 no [INCIDENT-RESPONSE-FLOW](../INCIDENT-RESPONSE-FLOW.md).

## Ações proibidas

- DELETE duplicata sem plano B aprovado.
- Segundo `claim_and_credit` no mesmo `payment_id`.

## Rollback

- Deploy se introduzido por release recente.
- Reversão financeira: **somente** script/ticket plano B documentado.

## Escalonamento

Imediato: ops + financeiro + engenharia líder. Notificar stakeholders se impacto saldo.
