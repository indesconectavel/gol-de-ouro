# F4 — Preparação Celcoin Payment Engine

**Data:** 2026-06-23  
**Modo:** preparatório / seguro — sem credenciais reais, sem deploy, sem alteração do provider ativo  
**Escopo:** auditoria da Payment Engine + stubs Celcoin

---

## 1. Arquitetura financeira atual encontrada

### 1.1 Entry point e deploy

| Item | Valor |
|------|-------|
| Servidor HTTP | `server-fly.js` |
| Worker payout | `src/workers/payout-worker.js` (Fly process `payout_worker`) |
| Provider ativo (default) | **Mercado Pago** |

### 1.2 Camada de abstração (Payment Engine F4.0E-S1)

| Camada | Arquivo | Status |
|--------|---------|--------|
| Contrato PIX OUT | `src/finance/contracts/PayoutProvider.js` | JSDoc ativo |
| Contrato PIX IN | `src/finance/contracts/PaymentProvider.js` | JSDoc only — **não wired** |
| Factory | `src/finance/factory/FinanceProviderFactory.js` | Payout parcial |
| Adapter MP payout | `src/finance/providers/mercadopago/MercadoPagoPayoutProvider.js` | Produção |
| Mock dev | `src/finance/providers/mock/MockPayoutProvider.js` | `MOCK_FINANCE_ENABLED=true` |
| Ponte legado | `src/finance/compat/createPixWithdrawCompat.js` | Worker/admin |

### 1.3 Fluxos ainda acoplados ao monólito

| Fluxo | Onde | Acoplamento |
|-------|------|-------------|
| PIX IN (criar cobrança) | `server-fly.js` → MP `/v1/payments` | **Alto** — sem adapter |
| PIX IN webhook | `server-fly.js` → `/api/payments/webhook` | **Alto** — HMAC MP |
| PIX OUT request | `server-fly.js` → `/api/withdraw/request` | Médio — debita saldo + ledger |
| PIX OUT worker | `processPendingWithdrawals.js` | Médio — usa factory via compat |
| PIX OUT webhook | `server-fly.js` → `/webhooks/mercadopago` | **Alto** — inline MP |

### 1.4 Wallet, ledger, persistência

| Recurso | Arquivo / tabela |
|---------|------------------|
| Saldo usuário | `usuarios.saldo` |
| Depósitos | `pagamentos_pix` |
| Saques | `saques` (+ colunas `mp_*`) |
| Ledger | `ledger_financeiro` |
| RPC depósito | `database/claim_and_credit_approved_pix_deposit.sql` |
| Admin saques | `controllers/adminWithdrawController.js`, `goldeouro-admin/src/pages/SaqueUsuarios.jsx` |

### 1.5 Respostas à auditoria

| Pergunta | Resposta |
|----------|----------|
| Sistema desacoplado de PSP? | **Parcialmente** — payout POST sim; IN + webhooks não |
| Interface comum para providers? | **Sim (parcial)** — `PayoutProvider` + `PaymentProvider` |
| Cash-In isolado? | **Não** — inline em `server-fly.js` |
| Cash-Out isolado? | **Parcial** — envio via factory; webhook não |
| Webhooks isolados por provider? | **Não** — rotas MP-specific |
| O que falta para Celcoin sem quebrar V1? | Stubs (feito), wiring webhook, DICT+payment HTTP, colunas provider-agnostic, tesouraria BaaS |

---

## 2. Onde o provider Celcoin foi criado

Estrutura adicionada em `src/finance/providers/celcoin/`:

```
src/finance/providers/celcoin/
├── celcoin-config.js          # leitura de env + guards
├── CelcoinProvider.js         # provider unificado (stubs)
├── CelcoinPayoutProvider.js   # adapter → PayoutProvider
└── CelcoinPaymentProvider.js  # adapter → PaymentProvider (futuro PIX IN)
```

Integração mínima na factory (`FinanceProviderFactory.js`):

- `PAYOUT_PROVIDER=celcoin` só é aceito se `CELCOIN_ENABLED=true`
- **Default permanece `mercadopago`** — produção inalterada
- `getHealthSnapshot()` expõe `celcoinEnabled` e `celcoinPayoutConfigured`

**Não alterado:** `server-fly.js`, worker, wallet, ledger, lógica do jogo, rotas webhook.

---

## 3. Métodos implementados

### 3.1 `CelcoinProvider.js` (unificado)

| Método | Comportamento atual |
|--------|---------------------|
| `authenticate()` | Guard `CELCOIN_ENABLED` → guard credenciais → stub `CELCOIN_STUB_NOT_IMPLEMENTED` |
| `createPixDeposit()` | Idem — log seguro (amount, userId truncado) |
| `createPixWithdraw()` | Idem — log saqueId/correlationId |
| `getTransactionStatus()` | Idem — log providerRef truncado |
| `validateWebhook()` | Rejeita se disabled; rejeita se secret ausente; stub se configurado |
| `handleWebhook()` | Delega `validateWebhook` → stub |
| `isEnabled()` / `isConfigured()` | Helpers de readiness |

### 3.2 Guards (sem fallback silencioso)

| Código | Quando |
|--------|--------|
| `CELCOIN_DISABLED` | `CELCOIN_ENABLED=false` |
| `CELCOIN_NOT_CONFIGURED` | enabled mas faltam `baseUrl`, `clientId`, `clientSecret` |
| `CELCOIN_STUB_NOT_IMPLEMENTED` | enabled + credenciais OK — **sem HTTP real** (fase preparatória) |
| `CELCOIN_WEBHOOK_SECRET_MISSING` | validateWebhook sem secret |

Logs: JSON via `celcoinLog()` — **nunca** inclui `client_secret`.

### 3.3 Adapters

- `CelcoinPayoutProvider` → `requestPixPayout`, `getPayoutStatus`, `handlePayoutWebhook`
- `CelcoinPaymentProvider` → `createPixDeposit`, `getPixDepositStatus`, `handleDepositWebhook` (não wired na factory)

---

## 4. Variáveis de ambiente necessárias

Adicionadas em `.env.example`:

```bash
CELCOIN_ENABLED=false
CELCOIN_BASE_URL=
CELCOIN_CLIENT_ID=
CELCOIN_CLIENT_SECRET=
CELCOIN_MTLS_CERT_PATH=
CELCOIN_MTLS_KEY_PATH=
CELCOIN_WEBHOOK_SECRET=
```

Opcionais para ativação futura (já suportadas pela factory):

```bash
PAYOUT_PROVIDER=mercadopago   # default — não mudar em produção
PAYOUT_PROVIDER=celcoin       # requer CELCOIN_ENABLED=true
```

Variáveis adicionais previstas para homologação (documentar, não obrigatórias no stub):

| Variável | Uso futuro |
|----------|------------|
| `CELCOIN_AUTH_URL` | OAuth token (sandbox vs prod) |
| `CELCOIN_DEBIT_ACCOUNT` | `debitParty.account` no PIX OUT BaaS |
| `PIX_IN_PROVIDER` | Roteamento PIX IN (fase 2) |

---

## 5. Pendências para homologação real

1. **Onboarding comercial Celcoin BaaS** — conta sandbox/prod + aceite do modelo
2. **HTTP client OAuth + mTLS** — implementar em `authenticate()` e cliente base
3. **PIX OUT:** consulta DICT → `POST /baas/v2/pix/payment` com `clientCode`
4. **Webhook:** rota `POST /webhooks/celcoin` em `server-fly.js` + handler provider
5. **Status mapping:** `CONFIRMED` / `ERROR` / `PENDING` → state machine de `saques`
6. **Colunas DB:** `provider_ref`, `end_to_end_id` (ou prefixo `celcoin_*`)
7. **PIX IN (opcional):** wire `CelcoinPaymentProvider` + refatorar `/api/payments/pix/criar`
8. **Tesouraria:** saldo BaaS Celcoin vs. saldo MP (se dual-provider)
9. **Testes sandbox:** smoke script + saque E2E com webhook simulado
10. **mTLS Fly.io:** montar cert/key via secrets

---

## 6. Riscos identificados

| Risco | Nível | Mitigação |
|-------|-------|-----------|
| Ativar `PAYOUT_PROVIDER=celcoin` sem homologação | Alto | Stub não envia PIX; boot exige `CELCOIN_ENABLED=true` |
| Split tesouraria MP IN / Celcoin OUT | Alto | Manter MP no IN até modelo de repasse |
| Webhook Celcoin não wired | Médio | Produção continua MP; Celcoin inativo |
| mTLS produção | Médio | Planejar secrets Fly antes do go-live |
| DICT + endToEndId 12h | Médio | DICT+payment atômico no worker |
| Compliance premiação/jogos | Alto | Validar com Celcoin antes de prod |

---

## 7. Próximo passo recomendado (sandbox)

### Fase A — Credenciais (externo)
1. Obter `client_id` / `client_secret` sandbox via onboarding Celcoin
2. Preencher `.env` local (nunca commitar)
3. Creditar conta sandbox: `POST /baas/v2/wallet/entry/{AccountNumber}`

### Fase B — HTTP client (código)
1. Implementar `authenticate()` com OAuth real (sem mTLS no sandbox se permitido)
2. Criar `services/pix-celcoin.js` ou módulo `celcoin-http-client.js`
3. Substituir `_stubResponse` por chamadas reais **somente** quando `CELCOIN_ENABLED=true` + flag explícita `CELCOIN_HTTP_ENABLED=true` (recomendado)

### Fase C — Payout E2E
1. `PAYOUT_PROVIDER=celcoin` + `CELCOIN_ENABLED=true` em ambiente dev
2. Admin `approve-and-send` com 1 saque teste
3. Rota webhook + confirmação ledger

### Fase D — Produção
1. mTLS + certificados prod
2. Feature flag gradual; MP permanece fallback via `PAYOUT_PROVIDER=mercadopago`

---

## Checklist de segurança desta fatia

- [x] `CELCOIN_ENABLED=false` por default
- [x] Nenhuma chamada HTTP real
- [x] Provider produção = Mercado Pago (default factory)
- [x] Erros explícitos, sem fallback silencioso
- [x] Logs sem segredos
- [x] Jogo / wallet / ledger inalterados
- [x] MP / mock / contratos existentes preservados
