# RUNBOOK — Replay de webhook

**Área:** Segurança · **Idempotência:** RPC + ledger

---

## Sintomas

- Mesmo `payment_id` / `data.id` processado múltiplas vezes.
- Logs MP mostram reenvios.
- Suspeita de double-credit (ver duplicata runbook).

## Severidade

| Situação | Nível |
|----------|-------|
| Replay bloqueado; ledger idempotente | **P3** |
| Segundo `deposito` ou saldo duplicado | **P0** |

## Possíveis causas

- MP retry após timeout.
- Atacante replay de payload capturado (se HMAC válido).
- Bug idempotência `ON CONFLICT (correlation_id, tipo)`.

## Queries (read-only)

```sql
SELECT correlation_id, tipo, count(*), min(created_at), max(created_at)
FROM ledger_financeiro
WHERE correlation_id = '<MP_PAYMENT_ID>'
GROUP BY 1, 2;

SELECT * FROM pagamentos_pix WHERE payment_id = '<MP_PAYMENT_ID>';
```

Probe RPC (read-only safe id):

```bash
# Via Supabase RPC — ID inexistente; esperado not_found
# Não usar IDs reais de produção em teste repetido sem ticket
```

## Critérios GO / NO-GO

| GO | NO-GO |
|----|-------|
| 1 linha `deposito` por payment_id | count &gt; 1 |
| `credited: false` em replay RPC | Saldo aumentou 2x |

## Ações permitidas

- Confirmar HMAC ativo.
- Auditar logs `financeLog` por `payment_id`.
- Abrir P0 duplicata se confirmado.

## Ações proibidas

- Deletar ledger para “corrigir” replay.
- Reprocessar webhook manualmente sem idempotência.

## Rollback

Deploy se regressão M1; financeiro plano B se crédito duplicado.

## Escalonamento

Ops → financeiro → engenharia RPC.
