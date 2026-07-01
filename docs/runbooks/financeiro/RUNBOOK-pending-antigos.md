# RUNBOOK — PIX `pending` antigos

**Área:** Financeiro · **Alerta V1.2B:** A-02, B-02 · **Baseline:** 54 pending &gt; 7 dias

---

## Sintomas

- `pix_pending_old` &gt; 54 ou crescendo.
- Reconcile backlog `pending` com `reconcile_skip = false`.
- Usuários com QR expirado localmente mas MP ainda `pending`.

## Severidade

| Situação | Nível |
|----------|-------|
| Estável em 54 | **P3** |
| Crescimento &gt; baseline | **P1** |
| Pending com valor alto + suspeita de pagamento real | **P2** |

## Possíveis causas

- Pagamentos abandonados / QR expirados.
- Webhook MP não recebido.
- Reconcile worker limitado por rate/ciclo (V1.1D).
- `reconcile_skip` não aplicado em casos encerrados.

## Queries (read-only)

```sql
SELECT count(*) FROM pagamentos_pix
WHERE lower(trim(status::text)) = 'pending'
  AND COALESCE(updated_at, created_at) < now() - interval '7 days';

SELECT payment_id, valor, created_at, updated_at, reconcile_skip
FROM pagamentos_pix
WHERE lower(trim(status::text)) = 'pending'
  AND COALESCE(updated_at, created_at) < now() - interval '7 days'
ORDER BY created_at DESC
LIMIT 30;
```

## Critérios GO / NO-GO

| GO | NO-GO |
|----|-------|
| Contagem estável; reconcile rodando | Pending antigos **crescendo** rápido |
| Sem approved recentes presos em pending | MP mostra `approved` local `pending` |

## Ações permitidas

- Amostrar casos; consultar MP.
- Marcar `reconcile_skip` **somente** com política documentada + ticket.
- Ajustar limite reconcile via config (change control).

## Ações proibidas

- Forçar `approved` local sem confirmação MP.
- Crédito em massa por pending antigo.

## Rollback

- N/A (estado dados); reverter skips via ticket se erro.

## Escalonamento

Ops → Engenharia reconcile → MP suporte se padrão de webhook perdido.
