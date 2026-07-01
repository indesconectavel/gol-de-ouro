# Indesconectável Payment Engine™ — Interfaces Públicas

**Versão:** P2.0A  
**Data:** 2026-07-01  
**Runtime ativo:** `server-fly.js` (produção Fly v536)

---

## 1. Objetivo

Mapear todas as interfaces públicas da Payment Engine — endpoints HTTP ativos, contratos programáticos e interfaces planejadas para V2.

---

## 2. Interfaces HTTP Ativas (V1)

> **Nota:** `routes/paymentRoutes.js` (~90 rotas) **não está montado** em produção. Apenas endpoints inline em `server-fly.js` são listados abaixo.

### 2.1 Deposit API (PIX IN)

| Método | Path | Auth | Função | Classificação |
|--------|------|------|--------|---------------|
| POST | `/api/payments/pix/criar` | JWT | Criar cobrança PIX (factory → MP/Asaas) | **Core** |
| GET | `/api/payments/pix/usuario` | JWT | Listar depósitos do titular | **Core** |
| GET | `/api/payments/pix/status` | JWT | Status + sync + crédito se aprovado | **Core** |
| GET | `/api/payments/pix/status/:paymentId` | JWT | Idem com ID na URL | **Core** |

**Fluxo interno:** `createPixDepositCompat` → `FinanceProviderFactory.resolvePaymentProvider()` → PSP

### 2.2 Withdraw API (PIX OUT)

| Método | Path | Auth | Função | Classificação |
|--------|------|------|--------|---------------|
| POST | `/api/withdraw/request` | JWT | Solicitar saque (débito saldo + ledger + idempotência) | **Core** |
| GET | `/api/withdraw/history` | JWT | Histórico de saques do titular | **Core** |

**Fluxo interno:** Débito otimista → insert `saques` → ledger → worker/approve-and-send → factory

### 2.3 Webhook API

| Método | Path | Auth | Função | Classificação |
|--------|------|------|--------|---------------|
| POST | `/api/payments/webhook` | HMAC MP | Webhook Mercado Pago depósito | **Core** |
| POST | `/webhooks/asaas` | Token/IP Asaas | Eventos Asaas (`PAYMENT_*`, `TRANSFER_*`) | **Core** |
| POST | `/webhooks/asaas/transfer-validation` | Token Asaas | Autorização pré-transferência (P1.6) | **Core** |
| POST | `/webhooks/mercadopago` | Ed25519 MP | Webhook payout MP (transaction-intents) | **Core** |

**Fluxo interno:** `processPaymentWebhookCompat` → `processPaymentWebhook` / `processAsaasTransferWebhook`

### 2.4 Admin API (Financeiro)

| Método | Path | Auth | Função | Classificação |
|--------|------|------|--------|---------------|
| GET | `/api/admin/withdraw/list` | Admin JWT | Listar saques (filtro status) | Core + **Gol de Ouro** |
| POST | `/api/admin/withdraw/approve` | Admin JWT | Marcar saque como pago manual | Core + **Gol de Ouro** |
| POST | `/api/admin/withdraw/approve-and-send` | Admin JWT | Aprovar + enviar PIX automático | **Core** |
| POST | `/api/admin/withdraw/cancel` | Admin JWT | Cancelar/reverter saque | Core + **Gol de Ouro** |
| GET | `/api/admin/financial/report` | Admin JWT | Relatório ledger consolidado | **Gol de Ouro** |
| GET | `/api/admin/dashboard/stats` | Admin JWT | KPIs financeiros | **Gol de Ouro** |
| GET | `/api/admin/audit/logs` | Admin JWT | Logs de auditoria admin | **Gol de Ouro** |

### 2.5 Health API

| Método | Path | Auth | Função | Classificação |
|--------|------|------|--------|---------------|
| GET | `/health` | Público | Health geral + DB + MP status | **Core** |
| GET | `/health/workers` | Público | Flags do payout worker | **Core** |
| GET | `/api/monitoring/health` | Público | Health avançado (DB, MP, métricas) | **Core** |
| GET | `/api/monitoring/metrics` | Público | Métricas de performance | **Core** |

### 2.6 Wallet API (indireta — V1)

Não há endpoints `/wallet` ou `/saldo` dedicados. Saldo exposto via:

| Método | Path | Função | Classificação |
|--------|------|--------|---------------|
| GET | `/api/user/profile` | Retorna `saldo` no payload | **Gol de Ouro** |
| GET | `/usuario/perfil` | Perfil legado com saldo | **Gol de Ouro** |

### 2.7 Recovery API

**Não existe endpoint HTTP público.** Recovery opera em background:

| Job | Trigger | Função |
|-----|---------|--------|
| `reconcilePendingPayments()` | `setInterval` em `server-fly.js` | PIX IN pendentes |
| `runAsaasPayoutRecoveryCycle()` | `setInterval` em `server-fly.js` | PIX OUT stale Asaas |

---

## 3. Interfaces Programáticas (Contratos)

### 3.1 PaymentProvider (PIX IN)

```javascript
// src/finance/contracts/PaymentProvider.js
{
  name: string,
  isConfigured: () => boolean,
  createPixDeposit: (PixDepositCreateInput) => Promise<PixDepositCreateResult>,
  getPixDepositStatus: (providerRef) => Promise<StatusResult>,
  handleDepositWebhook: (req) => Promise<WebhookResult>
}
```

### 3.2 PayoutProvider (PIX OUT)

```javascript
// src/finance/contracts/PayoutProvider.js
{
  name: string,
  isConfigured: () => boolean,
  requestPixPayout: (PixPayoutRequestInput) => Promise<PixPayoutRequestResult>,
  getPayoutStatus: (providerRef) => Promise<StatusResult>,
  handlePayoutWebhook: (req) => Promise<WebhookResult>
}
```

### 3.3 Factory

```javascript
// src/finance/factory/FinanceProviderFactory.js
resolvePaymentProvider(): PaymentProvider
resolvePayoutProvider(): PayoutProvider
getHealthSnapshot(): HealthSnapshot
assertBootConfig(): void
```

### 3.4 Compat Layer (ponte monólito)

| Função | Caminho | Papel |
|--------|---------|-------|
| `createPixDepositCompat` | `src/finance/compat/createPixDepositCompat.js` | Monólito → factory PIX IN |
| `createPixWithdrawCompat` | `src/finance/compat/createPixWithdrawCompat.js` | Monólito → factory PIX OUT |
| `processPaymentWebhookCompat` | `src/finance/compat/processPaymentWebhookCompat.js` | Monólito → webhook engine |

### 3.5 Domain Services

| Função | Caminho | Papel |
|--------|---------|-------|
| `processPendingWithdrawals` | `src/domain/payout/processPendingWithdrawals.js` | Processa fila de saques |
| `claimAndCreditApprovedPixDeposit` | `src/finance/deposit/claimApprovedPixDeposit.js` | Crédito pós-aprovação |
| `reconcileAsaasPendingPayouts` | `src/finance/reconciliation/asaasPayoutRecovery.js` | Recovery PIX OUT |

---

## 4. Interfaces Legadas (NÃO ativas)

| Arquivo | Rotas declaradas | Status |
|---------|------------------|--------|
| `routes/paymentRoutes.js` | ~90 rotas (cashback, afiliados, cupons, extrato, etc.) | **Não montado** — maioria sem implementação |
| `routes/mpWebhook.js` | `POST /mercadopago` | Substituído por rotas ativas |
| `routes/health.js` | Health detalhado | Substituído por inline |
| `controllers/paymentController.js` | 7 métodos MP legado | **Não usado** em produção |

---

## 5. Interfaces Planejadas (V2)

### 5.1 REST API Pública

| API | Endpoints propostos |
|-----|---------------------|
| **Account API** | `POST /v2/accounts`, `GET /v2/accounts/:id/balance`, `GET /v2/accounts/:id/statement` |
| **Deposit API** | `POST /v2/deposits`, `GET /v2/deposits/:id`, `GET /v2/deposits` |
| **Withdraw API** | `POST /v2/withdrawals`, `GET /v2/withdrawals/:id`, `GET /v2/withdrawals` |
| **Webhook API** | `POST /v2/webhooks/:provider` (multi-tenant routing) |
| **Provider API** | `GET /v2/providers`, `GET /v2/providers/health` |
| **Recovery API** | `POST /v2/recovery/trigger` (admin), `GET /v2/recovery/status` |
| **Admin API** | `GET /v2/admin/ledger`, `GET /v2/admin/audit` |
| **Health API** | `GET /v2/health`, `GET /v2/health/providers` |

### 5.2 SDK (V2)

```typescript
// Proposta TypeScript SDK
import { PaymentEngine } from '@indesconectavel/payment-engine';

const engine = new PaymentEngine({ apiKey, tenantId });

await engine.deposits.create({ amount: 100, accountId: '...' });
await engine.withdrawals.create({ amount: 50, pixKey: '...', accountId: '...' });
const balance = await engine.accounts.getBalance('...');
```

### 5.3 Webhook Subscription (V2)

```typescript
engine.webhooks.subscribe({
  events: ['deposit.approved', 'withdrawal.completed', 'withdrawal.failed'],
  url: 'https://client.example.com/webhooks'
});
```

---

## 6. Mapa de Interfaces por Domínio

```text
┌─────────────────────────────────────────────────────────┐
│                    V1 ATIVO                             │
├─────────────┬─────────────┬──────────────┬──────────────┤
│ Deposit API │ Withdraw API│ Webhook API  │ Health API   │
│  4 endpoints│  2 endpoints│  4 endpoints │  4 endpoints │
├─────────────┴─────────────┴──────────────┴──────────────┤
│ Admin API (7 endpoints) · Wallet indireto (2 endpoints) │
├─────────────────────────────────────────────────────────┤
│ Recovery: background only (sem HTTP)                    │
├─────────────────────────────────────────────────────────┤
│ Contratos: PaymentProvider · PayoutProvider · Factory    │
├─────────────────────────────────────────────────────────┤
│                    V2 PLANEJADO                         │
├─────────────┬─────────────┬──────────────┬──────────────┤
│ Account API │ SDK TS/Node │ REST /v2/*   │ Multi-tenant │
└─────────────┴─────────────┴──────────────┴──────────────┘
```

---

## 7. Autenticação

| Interface | Mecanismo V1 | Proposta V2 |
|-----------|--------------|-------------|
| Deposit / Withdraw | JWT do titular (`authenticateToken`) | API Key + OAuth2 |
| Webhooks | Assinatura PSP (HMAC, Ed25519, token) | Assinatura PSP + tenant routing |
| Admin | JWT admin (`requireAdministradorDb`) | API Key admin + RBAC |
| Health | Público | Público (rate limited) |

---

*Indesconectável Payment Engine™ — Interfaces P2.0A*
