# Indesconectável Payment Engine™ — Provider Layer

**Versão:** P2.0A  
**Data:** 2026-07-01  
**Modo:** AUDITORIA DE ABSTRAÇÃO

---

## 1. Pergunta Central

> **Adicionar um novo PSP exige copiar código ou implementar somente a interface Provider?**

## Resposta: Implementar somente a interface Provider

A Payment Engine V1 possui contratos formais (`PaymentProvider`, `PayoutProvider`) e uma factory central (`FinanceProviderFactory`) que resolve o provider por configuração de ambiente. Adicionar um novo PSP requer:

1. Criar adapter implementando o contrato
2. Registrar na factory
3. Adicionar config/gates
4. Configurar env vars

**Não é necessário** copiar lógica de wallet, ledger, webhooks ou recovery.

---

## 2. Contratos

### 2.1 PaymentProvider (PIX IN)

**Arquivo:** `src/finance/contracts/PaymentProvider.js`

| Método | Input | Output | Obrigatório |
|--------|-------|--------|:-----------:|
| `name` | — | `string` | ✅ |
| `isConfigured()` | — | `boolean` | ✅ |
| `createPixDeposit(input)` | `PixDepositCreateInput` | `PixDepositCreateResult` | ✅ |
| `getPixDepositStatus(ref)` | `providerRef` | `{ success, status, amount }` | ✅ |
| `handleDepositWebhook(req)` | Express Request | `{ valid, providerRef }` | ✅ |

**Input mínimo para depósito:**

```javascript
{
  amount: number,
  userId: string,
  userEmail: string,
  idempotencyKey: string,
  notificationUrl: string
}
```

### 2.2 PayoutProvider (PIX OUT)

**Arquivo:** `src/finance/contracts/PayoutProvider.js`

| Método | Input | Output | Obrigatório |
|--------|-------|--------|:-----------:|
| `name` | — | `string` | ✅ |
| `isConfigured()` | — | `boolean` | ✅ |
| `requestPixPayout(input)` | `PixPayoutRequestInput` | `PixPayoutRequestResult` | ✅ |
| `getPayoutStatus(ref)` | `providerRef` | `{ success, data }` | ✅ |
| `handlePayoutWebhook(req)` | Express Request | `{ valid, status, providerRef }` | ✅ |

**Input mínimo para payout:**

```javascript
{
  netAmount: number,
  pixKey: string,
  pixType: string,
  userId: string,
  saqueId: string,
  correlationId: string,
  payoutExternalReference: string,
  idempotencyKey: string,
  ownerIdentification: { type, number }
}
```

---

## 3. Factory — Resolução de Provider

**Arquivo:** `src/finance/factory/FinanceProviderFactory.js`

```text
Env vars:
  PAYMENT_PROVIDER  → resolvePaymentProvider()
  PAYOUT_PROVIDER   → resolvePayoutProvider()
  PRIMARY_PSP       → PSP arquitetural (asaas)
  MOCK_FINANCE_ENABLED → Mock providers (dev only)

Resolução:
  1. assertBootConfig() — valida gates
  2. normalizeProviderEnv() — primary-psp.js
  3. Instancia adapter correspondente
  4. Cache singleton por processo
```

### Providers registrados

| Provider | PIX IN | PIX OUT | Status |
|----------|:------:|:-------:|--------|
| **Asaas** | `AsaasPaymentProvider` | `AsaasPayoutProvider` | ✅ Produção homologada |
| **Mercado Pago** | `MercadoPagoPaymentProvider` | `MercadoPagoPayoutProvider` | ✅ Legado ativo |
| **Celcoin** | `CelcoinPaymentProvider` | `CelcoinPayoutProvider` | ⚠️ Stub |
| **Mock** | `MockPaymentProvider` | `MockPayoutProvider` | ✅ Dev/test |
| **Efí** | — | — | ❌ Não implementado |

---

## 4. Guia: Adicionar Novo PSP

### Passo 1 — Criar diretório

```text
src/finance/providers/novo-psp/
├── novo-psp-config.js          # Flags, gates, isConfigured
├── novo-psp-http-client.js     # Cliente HTTP do PSP
├── NovoPspPaymentProvider.js   # Implementa PaymentProvider
├── NovoPspPayoutProvider.js    # Implementa PayoutProvider
├── novo-psp-webhook-validator.js
└── novo-psp-webhook-normalizer.js
```

### Passo 2 — Implementar contratos

```javascript
// NovoPspPaymentProvider.js
class NovoPspPaymentProvider {
  constructor() { this.name = 'novo-psp'; }
  isConfigured() { return Boolean(process.env.NOVO_PSP_API_KEY); }
  async createPixDeposit(input) { /* HTTP ao PSP */ }
  async getPixDepositStatus(ref) { /* GET status */ }
  async handleDepositWebhook(req) { /* validar + normalizar */ }
}
```

### Passo 3 — Registrar na factory

```javascript
// FinanceProviderFactory.js
const NovoPspPaymentProvider = require('../providers/novo-psp/NovoPspPaymentProvider');

// Em resolvePaymentProvider():
if (provider === 'novo-psp') {
  return new NovoPspPaymentProvider();
}
```

### Passo 4 — Configurar env

```env
PAYMENT_PROVIDER=novo-psp
PAYOUT_PROVIDER=novo-psp
NOVO_PSP_API_KEY=...
NOVO_PSP_WEBHOOK_SECRET=...
```

### O que NÃO precisa ser alterado

| Componente | Motivo |
|------------|--------|
| Wallet / Ledger | Provider-agnostic |
| Webhook engine (`processPaymentWebhook`) | Delega ao provider |
| Recovery (`asaasPayoutRecovery`) | Específico Asaas; novo PSP teria seu recovery |
| Idempotency layer | Genérico |
| Compat layer | Transparente à factory |
| Schedulers | Chamam factory, não PSP diretamente |

---

## 5. Acoplamentos Identificados

### 5.1 Acoplamentos aceitáveis (por design)

| Acoplamento | Local | Justificativa |
|-------------|-------|---------------|
| Recovery Asaas-specific | `asaasPayoutRecovery.js` | Cada PSP pode ter recovery próprio |
| MP legado wrapper | `MercadoPagoPayoutProvider` → `services/pix-mercado-pago.js` | Transição; consolidar em V1.1 |
| Webhook routes inline | `server-fly.js` | V2 extrai para router próprio |

### 5.2 Acoplamentos a resolver (V1.1)

| Acoplamento | Local | Impacto | Ação |
|-------------|-------|---------|------|
| MP payout via service legado | `services/pix-mercado-pago.js` | Lógica fora de `src/finance/providers/` | Migrar para `MercadoPagoPayoutProvider` completo |
| `saqueId` no contrato PayoutProvider | `PayoutProvider.js` | Naming Gol de Ouro | Renomear para `withdrawalId` em V2 |
| Webhook normalizers por PSP | `providers/*/webhook-*` | Correto por design | Manter; cada PSP tem payload diferente |
| `payoutProviderPersistence` | `src/domain/payout/` | Lógica MP `mp_*` vs Asaas `asaas_*` | Generalizar para `providerRef` genérico |

### 5.3 Acoplamentos inexistentes (positivo)

| Verificação | Resultado |
|-------------|-----------|
| Factory importa lógica de jogo? | ❌ Não |
| Providers conhecem `usuarios` ou `saques`? | ❌ Não (recebem IDs via input) |
| Wallet conhece PSP específico? | ❌ Não |
| Ledger conhece PSP? | ❌ Não (usa `correlation_id`) |
| Webhook engine hardcoded para um PSP? | ❌ Não (delega ao provider) |

---

## 6. Comparativo de Providers

| Capacidade | Asaas | Mercado Pago | Celcoin | Mock |
|------------|:-----:|:------------:|:-------:|:----:|
| PIX IN create | ✅ | ✅ | ⚠️ stub | ✅ |
| PIX IN webhook | ✅ | ✅ | ❌ | ✅ |
| PIX IN status poll | ✅ | ✅ | ⚠️ | ✅ |
| PIX OUT request | ✅ | ✅ | ⚠️ stub | ✅ |
| PIX OUT webhook | ✅ | ✅ | ❌ | ✅ |
| PIX OUT status poll | ✅ | ✅ | ⚠️ | ✅ |
| Transfer authorization | ✅ | ❌ | ❌ | ❌ |
| Recovery job | ✅ | ❌ | ❌ | ❌ |
| Produção homologada | ✅ P1.7-P1.9 | ✅ PIX IN | ❌ | ❌ |
| HTTP client próprio | ✅ | Parcial (SDK) | ✅ | N/A |
| Webhook validator | ✅ | ✅ | ❌ | N/A |

---

## 7. Configuração de Provider

### Env vars por PSP

| Variável | Asaas | MP | Celcoin | Mock |
|----------|:-----:|:--:|:-------:|:----:|
| `PAYMENT_PROVIDER` | `asaas` | `mercadopago` | `celcoin` | `mock` |
| `PAYOUT_PROVIDER` | `asaas` | `mercadopago` | `celcoin` | `mock` |
| API Key | `ASAAS_API_KEY` | `MP_ACCESS_TOKEN` | `CELCOIN_CLIENT_ID` | — |
| Webhook secret | `ASAAS_WEBHOOK_TOKEN` | HMAC key | — | — |
| Production gate | `ASAAS_PRODUCTION_ENABLED` | — | `CELCOIN_ENABLED` | `MOCK_FINANCE_ENABLED` |

### Gates de segurança

| Gate | Função |
|------|--------|
| `assertBootConfig()` | Falha no boot se config inválida |
| `MOCK_FINANCE_ENABLED` forbidden em produção | Impede mock em prod |
| `ASAAS_PRODUCTION_ENABLED` | Gate explícito Asaas produção |
| `isAsaasProviderResolvable()` | Valida credenciais antes de resolver |

---

## 8. Veredito da Auditoria

| Critério | Status |
|----------|--------|
| Contratos formais existem | ✅ |
| Factory centraliza resolução | ✅ |
| Novo PSP = novo adapter (não cópia) | ✅ |
| Providers não conhecem domínio do jogo | ✅ |
| Recovery é per-PSP (design correto) | ✅ |
| MP legado precisa consolidação | ⚠️ V1.1 |
| Naming `saqueId` no contrato | ⚠️ V2 |

**Conclusão:** A Provider Layer está **pronta para productização**. A abstração é real e funcional — comprovada pela homologação Asaas (P1.7-P1.9) sem alterar wallet, ledger ou webhooks genéricos.

---

*Indesconectável Payment Engine™ — Provider Layer P2.0A*
