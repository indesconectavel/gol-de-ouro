# Simulação — Backlog growth (documental)

**Refs:** FIN-A01/A02 · [RUNBOOK-approved-sem-ledger](../../runbooks/financeiro/RUNBOOK-approved-sem-ledger.md)

---

## Cenário

`approved_without_ledger` sobe de 34 → 40 em 72h sem novos depósitos ledger. `pix_pending_old` sobe de 54 → 65.

## Impacto

- Integridade ledger degradada
- Reconcile worker sobrecarregado
- financial_proof → **DEGRADED**

## Alertas

- A-01, A-02 (V1.2B)
- FIN-A01, FIN-A03 (V1.3 proof)

## Runbooks

1. [RUNBOOK-approved-sem-ledger](../../runbooks/financeiro/RUNBOOK-approved-sem-ledger.md)
2. [RUNBOOK-pending-antigos](../../runbooks/financeiro/RUNBOOK-pending-antigos.md)
3. U1–U4 runbook V1.1B

## Rollback

- SQL/RPC apply **não** automático
- Plano B somente com snapshot PRE-APPLY

## Classificação

| Δ backlog | P |
|-----------|---|
| +1–5 approved sem ledger | P3 |
| +6–20 | P2 |
| dups ou saldo negativo | P0 |

## Contenção

| Ação | SLA |
|------|-----|
| `financial-proof-engine.js` | 15 min |
| Triagem U1–U4 | 4–24 h |
| Apply gate M1 se aprovado | janela change |
