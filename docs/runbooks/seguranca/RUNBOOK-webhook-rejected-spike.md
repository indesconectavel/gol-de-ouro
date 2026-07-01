# RUNBOOK — Webhook rejected spike

**Área:** Segurança · **Alerta V1.2B:** A-05 · **Logs:** `deposit_webhook_rejected`, `withdraw_webhook_rejected`

---

## Sintomas

- ≥ 15 rejeições em amostra Fly (threshold V1.2B).
- Picos de 401 em logs `financeLog`.
- Possível ataque ou integração MP mal configurada.

## Severidade

| Situação | Nível |
|----------|-------|
| Spike isolado / scan bots | **P2** |
| Spike sustentado + tentativas com payload válido | **P1** |
| Webhook aceita sem assinatura (≠ 401) | **P0** |

## Possíveis causas

- Bots testando endpoints públicos.
- Rotação secret MP não atualizada no Fly.
- Cliente legado sem `x-signature`.
- Replay após leak de URL.

## Queries (read-only)

```bash
flyctl logs -a goldeouro-backend-v2 --no-tail | findstr /i "webhook_rejected"
curl -s -o /dev/null -w "%{http_code}" -X POST https://goldeouro-backend-v2.fly.dev/api/payments/webhook \
  -H "Content-Type: application/json" -d '{"action":"payment.updated","data":{"id":"0"}}'
# Esperado: 401
```

## Critérios GO / NO-GO

| GO | NO-GO |
|----|-------|
| Probes sem assinatura = 401 | Qualquer 200 sem HMAC válido |
| Spike sem impacto financeiro | Correlacionar com créditos/saques anômalos |

## Ações permitidas

- Aumentar observabilidade (contagem por hora).
- WAF / rate limit (infra change).
- Rotacionar secret MP + redeploy (change control).

## Ações proibidas

- Desabilitar verificação HMAC.
- Retornar 200 para “silenciar” atacante sem investigação.

## Rollback

N/A; redeploy secrets se misconfig.

## Escalonamento

Ops → segurança → MP se assinatura sistematicamente inválida em tráfego legítimo.
