# V1.1F-STAGING — Validação isolada webhook payout HMAC

**Data:** 2026-05-18  
**Modo:** Servidor **local** com patch V1.1F · DB **staging** `uatszaqzdqcwnfbipoxg` · **Produção Fly/Supabase prod não alterados** · Sem deploy prod

**Referências:** [V1.1F proposta](V1-1F-HARDENING-WEBHOOK-PAYOUT-2026-05-18.md) · [V1.1E payout](V1-1E-AUDITORIA-PAYOUT-SAQUES-2026-05-18.md)  
**Dados:** `V1-1F-STAGING-WEBHOOK-PAYOUT-HMAC-DATA-2026-05-18.json`  
**Script:** `node scripts/v1-1f-staging-webhook-payout-hmac.js`

---

## Respostas diretas

| Pergunta | Resposta |
|----------|----------|
| **`x-signature` + `data.id` compatíveis com payout?** | **Sim** (simulado com `MERCADOPAGO_WEBHOOK_SECRET` e manifest MP padrão) |
| **Secret reutilizável depósito → payout** | **Sim** — mesmo secret, manifests válidos para `body.data.id` (payment) e `body.id` / `query[data.id]` (intent) |
| **Regressão depósito inbound** | **PASS** — sem assinatura **401**; assinado **200** |
| **Produção tocada** | **Não** — testes em `127.0.0.1:18981`; ledger via pooler staging |
| **Veredito cirurgia** | **GO COM RESSALVAS** |

---

## Escopo executado

### Código (patch V1.1F para teste local — ainda não em Fly prod)

| Ficheiro | Alteração |
|----------|-----------|
| `utils/webhook-signature-validator.js` | `getMercadoPagoPayoutWebhookDataId`, `validateMercadoPagoPayoutWebhook` (aditivo); core extraído em `_validateMercadoPagoManifestWebhook` sem mudar comportamento de `validateMercadoPagoWebhook`; helper `buildMercadoPagoWebhookSignedRequest` |
| `server-fly.js` | `POST /webhooks/mercadopago`: validação **antes** do `200`; **401** se assinatura inválida |
| `scripts/v1-1f-staging-webhook-payout-hmac.js` | Runner de testes U1–U5 + HTTP 1–5b |

**Não alterado:** `POST /api/payments/webhook`, player, admin, gameplay, inbound PIX RPC.

### Ambiente de teste

| Item | Valor |
|------|-------|
| API exercitada | `http://127.0.0.1:18981` (child `server-fly.js`) |
| Fly prod | Apenas `GET /health` read-only (sem POST webhook) |
| Supabase staging | `uatszaqzdqcwnfbipoxg` via pooler `:5432` |
| Assinatura | `MERCADOPAGO_WEBHOOK_SECRET` local (mesmo padrão Fly prod) |

---

## Resultados dos testes

| ID | Teste | Resultado |
|----|-------|-----------|
| **U1** | `validateMercadoPagoWebhook` sem assinatura → inválido | **PASS** |
| **U2** | `validateMercadoPagoWebhook` assinado (payment id) | **PASS** |
| **U3** | `validateMercadoPagoPayoutWebhook` sem assinatura → inválido | **PASS** |
| **U4** | `validateMercadoPagoPayoutWebhook` assinado (`body.id` intent) | **PASS** |
| **U5** | Payout: `data.id` só na **query** | **PASS** |
| **1** | Depósito inbound sem assinatura → **401** | **PASS** |
| **2** | Depósito inbound assinado → **200** | **PASS** |
| **3** | Payout sem assinatura → **401** | **PASS** |
| **4** | Payout assinado → **200** | **PASS** |
| **5a** | Payout assinatura errada → **401** | **PASS** |
| **5b** | Staging ledger `payout_confirmado` / `falha_payout` / `rollback` inalterado | **PASS** |

### Manifest (exemplos)

- Depósito: `id:999000000000099;request-id:stg-req-…;ts:…;`
- Payout (intent): `id:ti-stg-v11f-…;request-id:stg-req-…;ts:…;`

Resolver de `data.id` payout (ordem): `query['data.id']` → `body.data.id` (não-payment numérico) → `body.id`.

### Ledger staging (antes = depois)

| `tipo` | Count |
|--------|------:|
| `payout_confirmado` | 0 |
| `falha_payout` | 0 |
| `rollback` | 0 |

Payload forjado `approved` + assinatura inválida → **401** antes de efeitos financeiros.

---

## Compatibilidade MP payout

| Hipótese V1.1F | Evidência deste run |
|----------------|---------------------|
| MP envia `x-signature` + `x-request-id` | **Compatível** — mesmo esquema do inbound (doc MP + simulação) |
| `data.id` na query para intent | **PASS** (teste U5) |
| `data.id` = `body.id` do transaction-intent | **PASS** (teste U4) |
| Mesmo `MERCADOPAGO_WEBHOOK_SECRET` | **PASS** (U2 + U4 com um secret) |

**Ressalva:** não foi capturado nesta sessão um POST **real** do Mercado Pago (Money Out) contra URL pública — apenas reprodução criptográfica fiel ao [manifest MP](https://www.mercadopago.com.br/developers/en/docs/your-integrations/notifications/webhooks).

---

## Ressalvas (veredito GO COM RESSALVAS)

1. **Fly prod (`goldeouro-backend-v2`) ainda sem este patch** — comportamento prod continua 200 sem HMAC até deploy controlado.
2. **Webhook MP real payout** — recomendado 1 evento no simulador MP ou sandbox após deploy em ambiente não-prod com `MERCADOPAGO_WEBHOOK_DEBUG_LOG=1`.
3. **Ledger staging vazio** para tipos payout — prova de não-escrita, não stress com saque real pendente.
4. Teste **5b** em ambiente Windows exigiu `NODE_TLS_REJECT_UNAUTHORIZED=0` só para PG staging no runner (não afeta runtime Fly).

---

## Próximo passo recomendado (fora desta missão)

1. Deploy **staging/non-prod** Fly com este commit.  
2. Simulador MP → `POST /webhooks/mercadopago?data.id={intentId}` + corpo transaction-intent.  
3. Gate prod: regressão depósito + 401 payout sem sig + monitor `withdraw_webhook_rejected`.

---

## Veredito final — cirurgia

| Veredito | **GO COM RESSALVAS** |
|----------|----------------------|
| Motivo | Todos os testes automatizados **PASS**; HMAC e secret **reutilizáveis**; regressão depósito **OK**. Pendente confirmação com **notificação MP real** e deploy Fly antes de considerar **GO** pleno em produção. |

**NO-GO** não aplicável — nenhuma incompatibilidade técnica encontrada nos testes.

---

## Reprodução

```powershell
Set-Location "e:\Chute de Ouro\goldeouro-backend"
# .env.local: DATABASE_URL staging (uatszaq) + MERCADOPAGO_WEBHOOK_SECRET
$env:NODE_TLS_REJECT_UNAUTHORIZED = '0'   # só se PG local falhar SSL
node scripts/v1-1f-staging-webhook-payout-hmac.js
```

---

*Relatório V1.1F-STAGING — 2026-05-18. Produção não alterada.*
