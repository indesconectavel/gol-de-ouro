# Payouts — Checklist produção (validar Saques PIX)

Sandbox já validado com `TEST-7602307033886084-...`. Este guia é para **produção real**.

---

## Ordem obrigatória

### 1. Credencial produção (painel)

1. https://www.mercadopago.com.br/developers/panel/app → app **7602307033886084**
2. **Produção** → **Credenciais de produção** → **Ativar** (Industry + Website)
3. Copiar **Access Token** que começa com **`APP_USR-`** (não `TEST-`)

### 2. Ed25519 + Integrations team

```powershell
.\scripts\payouts\generate-ed25519-keys.ps1
```

Enviar **`scripts/payouts/keys/mppublic.pem`** à **Integrations team** Mercado Pago.  
Aguardar confirmação antes de `MP_PAYOUT_ENFORCE_SIGNATURE=true`.

### 3. Validar localmente (sem saque real)

No `.env.local` (não commitar):

```env
MERCADOPAGO_PAYOUT_ACCESS_TOKEN=APP_USR-...
MP_PAYOUT_TEST_TOKEN=false
MP_PAYOUT_ENFORCE_SIGNATURE=true
MP_PAYOUT_PRIVATE_KEY=<conteúdo de mpprivate.pem ou path via fly secret>
MP_PAYOUT_APP_ID=7602307033886084
```

```powershell
$env:ALLOW_PAYOUT_PRODUCTION_PROBE='1'
npm run payout:production:validate
```

Interpretação:

| Código | Ação |
|--------|------|
| `client_not_allowed` | Token/app errado |
| `invalid_signature` | Chave pública ainda não registrada no MP |
| `users_me` 200 + escopo OK | Token válido |

### 4. Fly (produção)

```powershell
fly secrets set `
  MERCADOPAGO_PAYOUT_ACCESS_TOKEN="APP_USR-..." `
  MP_PAYOUT_TEST_TOKEN="false" `
  MP_PAYOUT_ENFORCE_SIGNATURE="true" `
  PAYOUT_PIX_ENABLED="true" `
  -a goldeouro-backend-v2
```

`MP_PAYOUT_PRIVATE_KEY` — usar arquivo ou heredoc (multiline PEM).

Opcional:

```powershell
fly secrets set MP_PAYOUT_WEBHOOK_URL="https://goldeouro-backend-v2.fly.dev/webhooks/mercadopago" -a goldeouro-backend-v2
```

Depois: `fly deploy -a goldeouro-backend-v2` (se houve alteração em `pix-mercado-pago.js`).

### 5. Smoke saque real

1. Saque manual valor **mínimo** no admin
2. Confirmar `mp_transaction_intent_id` no banco
3. Logs: `[PIX][MP] transaction-intent enviado` sem `client_not_allowed`

---

## O que já está validado (sandbox)

- Bateria 13/14 cenários MP
- `createPixWithdraw` + `getTransactionIntent` com `X-Test-Token`

Relatório: `docs/relatorios/F2-6-VALIDACAO-SAQUES-PIX-SANDBOX-2026-06-02.md`
