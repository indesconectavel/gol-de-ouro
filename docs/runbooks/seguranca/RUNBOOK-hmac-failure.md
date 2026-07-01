# RUNBOOK — Falha HMAC (webhook)

**Área:** Segurança · **Alerta V1.2B:** C-04 · **Ref:** V1.1F hardening

---

## Sintomas

- `POST /api/payments/webhook` ou `POST /webhooks/mercadopago` retorna **≠ 401** sem assinatura.
- MP reporta falha de entrega webhook.
- Alerta **C-04** / **P0**.

## Possíveis causas

- Regressão deploy removeu check HMAC.
- Middleware ordem errada (200 antes do verify).
- Rota duplicada sem proteção.
- Secret vazio no ambiente Fly.

## Queries (read-only)

```bash
# Depósito — esperado 401
curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  https://goldeouro-backend-v2.fly.dev/api/payments/webhook \
  -H "Content-Type: application/json" \
  -d '{"action":"payment.updated","data":{"id":"000000000000000"}}'

# Payout — esperado 401
curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  https://goldeouro-backend-v2.fly.dev/webhooks/mercadopago \
  -H "Content-Type: application/json" \
  -d '{"type":"payment","data":{"id":"000000000000000"}}'
```

```bash
curl -s https://goldeouro-backend-v2.fly.dev/meta | jq .gitCommit
# Comparar com a83c3cf (V1.1F)
```

## Critérios GO / NO-GO

| GO | NO-GO |
|----|-------|
| Ambos endpoints 401 sem assinatura | 200/500 sem verify |
| SHA = baseline hardened | SHA desconhecido |

## Ações permitidas

- Freeze deploy imediato.
- Rollback Fly para v461 / SHA `a83c3cf`.
- Revisar `server-fly.js` no **SHA live** (não só main).

## Ações proibidas

- Expor webhook “temporariamente” sem HMAC.
- Processar fila manual sem auditoria.

## Rollback

**Obrigatório** se regressão confirmada — [RUNBOOK-fly-release-inesperada](../runtime/RUNBOOK-fly-release-inesperada.md).

## Escalonamento

P0 → ops + segurança + engenharia imediato.
