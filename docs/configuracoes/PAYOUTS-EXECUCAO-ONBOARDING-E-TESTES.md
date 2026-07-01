# Payouts / Money Out — Execução, auditoria e testes (Gol de Ouro)

Guia operacional para os **7 itens** do onboarding Payouts. Correlatos: `F2-5B`, `F2-5C`, `F2-5A`.

---

## Visão rápida: quem faz o quê

| # | Item | Painel MP (você) | Repositório / scripts |
|---|------|------------------|------------------------|
| 1 | App Payouts real | **Criar** em Suas integrações | `MP_PAYOUT_APP_ID` no `.env` |
| 2 | Credenciais Payouts | Copiar Test + Prod tokens | `MERCADOPAGO_PAYOUT_ACCESS_TOKEN` |
| 3 | Money transfers | — | Código já em `services/pix-mercado-pago.js` |
| 4 | Sandbox | Ativar credenciais de **teste** | `test-payout-sandbox.mjs` |
| 5 | Ed25519 | Enviar **chave pública** à Integrations team | `generate-ed25519-keys.ps1` |
| 6 | Produção | Ativar credenciais produção (Industry, Website) | Fly secrets |
| 7 | Assinatura runtime | — | `MP_PAYOUT_PRIVATE_KEY` + `MP_PAYOUT_ENFORCE_SIGNATURE=true` |

**Não reutilize** a app `7602307033886084` (“Gol de Ouro - Payout”) — o MCP classifica como **Checkout**.

---

## 1 — Aplicação Payouts real

1. Abra https://www.mercadopago.com.br/developers/panel/app  
2. **Criar aplicação** (não editar a app Checkout existente).  
3. Selecione produto alinhado a **Payouts / transferências / Money Out** (não Checkout Transparente).  
4. Anote o **App ID** e registre:

```env
MP_PAYOUT_APP_ID=<novo_app_id>
```

5. No Cursor, rode MCP `quality_checklist` com o **novo** `application_id` — o checklist **não** deve listar apenas campos de “Preferências”.

---

## 2 — Credenciais Payouts reais

Na **nova** app:

1. **Testes** → **Credenciais de teste** → **Ativar credenciais** (se necessário).  
2. Copie o **Access Token de teste** → `.env.local`:

```env
MERCADOPAGO_PAYOUT_ACCESS_TOKEN=APP_USR-...   # token da app PAYOUTS (teste)
MP_PAYOUT_TEST_TOKEN=true
```

3. Confirme que é **diferente** de `MERCADOPAGO_DEPOSIT_ACCESS_TOKEN` (PIX IN).

```bash
node scripts/payouts/audit-payout-readiness.mjs
```

---

## 3 — Money transfers configurado

O backend já implementa `POST /v1/transaction-intents/process` em `services/pix-mercado-pago.js` (`createPixWithdraw`).

Validação = sandbox retornar `id` sem `client_not_allowed` (passo 4).

---

## 4 — Sandbox Payouts validado

```powershell
$env:ALLOW_PAYOUT_SANDBOX_POST="1"
$env:MP_PAYOUT_TEST_TOKEN="true"
# MERCADOPAGO_PAYOUT_ACCESS_TOKEN já no .env.local
node scripts/payouts/test-payout-sandbox.mjs new
```

Cenários extras (doc integration-test):

```powershell
node scripts/payouts/test-payout-sandbox.mjs failed_insufficient_funds
node scripts/payouts/test-payout-sandbox.mjs failed_by_high_risk
```

**Sucesso esperado:** `success: true`, `mp_id` preenchido, `client_not_allowed: false`.

---

## 5 — Ed25519

```powershell
.\scripts\payouts\generate-ed25519-keys.ps1
```

- Envie `scripts/payouts/keys/mppublic.pem` à **Integrations team** Mercado Pago (doc go-to-production).  
- **Não** commite `mpprivate.pem` (pasta `keys/` está no `.gitignore`).

---

## 6 — Produção Payouts

Após sandbox OK e chave pública aceita pelo MP:

1. Painel → app Payouts → **Produção** → **Ativar credenciais** (Industry, Website, termos).  
2. Copie **Production Access Token**.  
3. Fly (exemplo):

```bash
fly secrets set MERCADOPAGO_PAYOUT_ACCESS_TOKEN="APP_USR-..." -a goldeouro-backend-v2
fly secrets set MP_PAYOUT_TEST_TOKEN="false" -a goldeouro-backend-v2
```

---

## 7 — Assinatura runtime

Somente **depois** da chave pública registrada no MP:

```bash
fly secrets set MP_PAYOUT_ENFORCE_SIGNATURE="true" -a goldeouro-backend-v2
fly secrets set MP_PAYOUT_PRIVATE_KEY="$(cat scripts/payouts/keys/mpprivate.pem)" -a goldeouro-backend-v2
```

Opcional:

```bash
fly secrets set MP_PAYOUT_WEBHOOK_URL="https://goldeouro-backend-v2.fly.dev/webhooks/mercadopago" -a goldeouro-backend-v2
```

**Ordem:** sandbox sem assinatura → registrar chave no MP → produção com `enforce=true`.

---

## Checklist final

- [ ] App Payouts nova + `MP_PAYOUT_APP_ID`
- [ ] `MERCADOPAGO_PAYOUT_ACCESS_TOKEN` ≠ token de depósito
- [ ] `test-payout-sandbox.mjs new` → `mp_id` OK
- [ ] Chave pública enviada à Integrations team
- [ ] Credenciais produção ativadas
- [ ] Fly: token prod + `MP_PAYOUT_TEST_TOKEN=false` + Ed25519
- [ ] Smoke saque manual em valor mínimo (após tudo acima)

---

## Scripts npm

```bash
npm run payout:audit
npm run payout:sandbox   # requer ALLOW_PAYOUT_SANDBOX_POST=1 no ambiente
```

---

## Referências oficiais

- https://www.mercadopago.com.br/developers/pt/docs/payouts/overview  
- https://www.mercadopago.com.br/developers/pt/docs/payouts/integration-test  
- https://www.mercadopago.com.br/developers/en/docs/payouts/go-to-production  
