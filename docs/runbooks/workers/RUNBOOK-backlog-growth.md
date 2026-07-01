# RUNBOOK — Crescimento de backlog (PIX / saques)

**Área:** Workers · **Alertas:** A-01, A-02, A-03

---

## Sintomas

- Métricas V1.2B acima do baseline: approved sem ledger, pending antigos, saques presos.
- Estado operacional **AMARELO** persistente.
- **DM-04** V1.2C: vários merges sem deploy.

## Severidade

| Situação | Nível |
|----------|-------|
| Estável nos baselines 34/54 | **P3** |
| Crescimento monotônico 24–72 h | **P1** |
| Crescimento + duplicata/saldo negativo | **P0** |

## Possíveis causas

- Worker reconcile/payout degradado.
- Volume tráfego real novo pós-pausa.
- Regressão pós-deploy.
- MP instável.

## Queries (read-only)

```bash
node scripts/v1-2a-runtime-financial-health.js
node scripts/v1-2b-operational-alerts.js
```

Comparar JSON histórico em `docs/relatorios/V1-2B-ALERTAS-OPERACIONAIS-DATA-*.json`.

## Critérios GO / NO-GO

| GO | NO-GO |
|----|-------|
| Δ = 0 entre execuções 24 h | Δ &gt; 0 em qualquer métrica crítica |
| | P0 em duplicata/saldo |

## Ações permitidas

- Abrir sub-runbooks (approved-sem-ledger, pending, payout-worker).
- Dashboard manual das 3 métricas baseline.
- Freeze deploy se P1+.

## Ações proibidas

- Ignorar por “só +1”.
- Limpar tabelas para reduzir backlog.

## Rollback

Se correlacionado a release; senão mitigação operacional.

## Escalonamento

Ops → owners financeiro + workers → war room se P0.
