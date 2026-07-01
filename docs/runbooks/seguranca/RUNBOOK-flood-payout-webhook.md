# RUNBOOK — Flood webhook payout

**Área:** Segurança · **Rota:** `POST /webhooks/mercadopago`

---

## Sintomas

- Volume extremo de `withdraw_webhook_rejected` ou 401.
- Latência Fly aumentada.
- CPU alta na machine.

## Severidade

| Situação | Nível |
|----------|-------|
| Scan curto (&lt; 15/min) | **P2** |
| Flood sustentado | **P1** |
| 200 sem HMAC durante flood | **P0** |

## Possíveis causas

- Botnet / scanner.
- MP misconfiguration loop.
- DDoS na rota pública.

## Queries (read-only)

```bash
flyctl logs -a goldeouro-backend-v2 --no-tail | findstr /i "withdraw_webhook"
flyctl metrics -a goldeouro-backend-v2
```

Verificar probes V1.2B A-05.

## Critérios GO / NO-GO

| GO | NO-GO |
|----|-------|
| Todos rejeitados 401; sem ledger novo | Degradação + eventos processados inválidos |
| Health ok | Health fail |

## Ações permitidas

- Rate limit infra (Fly/Vercel edge).
- Bloqueio IP temporário (se disponível).
- Comunicar MP se origem legítima.

## Ações proibidas

- Retornar 200 vazio para todos.
- Desligar rota payout sem plano alternativo MP.

## Rollback

N/A; mitigação infra.

## Escalonamento

Ops → infra → segurança; MP se tráfego legítimo.
