# RUNBOOK — Saldo negativo

**Área:** Financeiro · **Alerta V1.2B:** C-01 · **Baseline:** 0 usuários

---

## Sintomas

- `saldo_negativo` &gt; 0.
- Alerta **C-01** / **P0**.
- Usuário consegue apostar/saque indevido (se UI permitir).

## Severidade

**P0 — CRÍTICO**

## Possíveis causas

- Race saque vs depósito.
- Crédito manual errado.
- Bug `UPDATE usuarios` duplicado.
- Rollback parcial de saque.

## Queries (read-only)

```sql
SELECT id, email, saldo, updated_at
FROM usuarios
WHERE COALESCE(saldo, 0) < 0
ORDER BY saldo ASC;

SELECT * FROM ledger_financeiro
WHERE usuario_id = '<UUID>'
ORDER BY created_at DESC
LIMIT 50;
```

```bash
node scripts/v1-2b-operational-alerts.js
```

## Critérios GO / NO-GO

| GO | NO-GO |
|----|-------|
| Nenhum saldo &lt; 0 | ≥ 1 usuário negativo |
| | Atividade de saque/jogo continua no usuário afetado |

## Ações permitidas

- Identificar usuários e últimas movimentações.
- Bloquear saque do usuário (via admin/policy — change control).
- Freeze deploy global.

## Ações proibidas

- `UPDATE saldo` ad-hoc sem auditoria.
- Ignorar por ser “valor pequeno”.

## Rollback

- Deploy se correlacionado a release &lt; 24 h.
- Correção saldo: ticket financeiro + ledger de ajuste documentado.

## Escalonamento

P0 imediato → financeiro → engenharia → comunicação se exposição ao jogador.
