# Indesconectável Payment Engine™ — Architecture Signature

**Versão:** V1 CERTIFICADA  
**Data:** 2026-07-01  
**Tipo:** Documento técnico — assinatura arquitetural imutável

---

## 1. Identificação

| Campo | Valor |
|-------|-------|
| Nome oficial | Indesconectável Payment Engine™ |
| Versão | V1 CERTIFICADA |
| Status | Production Certified |
| Tag Git | `payment-engine-v1-certified` |
| Commit | `eab1d74` |
| Módulo | `src/finance/` |
| Runtime | `server-fly.js` + `src/workers/payout-worker.js` |

---

## 2. Missão Técnica

Prover infraestrutura PIX (Cash-In, Cash-Out) com wallet, ledger imutável, abstração multi-PSP, reconciliação automática e recovery — garantindo continuidade operacional mesmo na ausência de webhooks.

---

## 3. Escopo V1

### Incluído

- Depósitos PIX (PIX IN) via Mercado Pago e Asaas
- Saques PIX (PIX OUT) via Asaas (homologado) e Mercado Pago (legado)
- Wallet interna (`usuarios.saldo`)
- Ledger imutável (`ledger_financeiro`)
- Webhooks: MP depósito, MP payout, Asaas PAYMENT, Asaas TRANSFER
- Autorização pré-transferência Asaas
- Recovery Job PIX OUT Asaas
- Reconciliação PIX IN Mercado Pago
- Idempotência estrutural
- Provider Factory com contratos formais
- Scheduler inline + payout worker
- Feature flags e gates de produção

### Excluído

- Multi-tenant
- API REST versionada independente
- SDK público
- Wallet API dedicada
- Recovery MP PIX OUT
- Celcoin operacional (stub apenas)
- Game engine (`shoot_apply`)
- Pagamentos internacionais

---

## 4. Princípios Arquiteturais

| # | Princípio | Implementação |
|---|-----------|---------------|
| P1 | **Idempotência estrutural** | UNIQUE `(correlation_id, tipo, referencia)` no ledger; claim RPC atômica; guards de replay em webhooks |
| P2 | **Ledger como fonte de verdade** | Toda movimentação financeira gera entrada imutável em `ledger_financeiro` |
| P3 | **Provider abstraction** | Contratos `PaymentProvider` + `PayoutProvider`; resolução via factory; novo PSP = adapter |
| P4 | **Sem fallback silencioso** | Factory falha explicitamente; gates impedem ativação acidental de provider |
| P5 | **Recovery compensa webhook** | Job periódico consulta PSP diretamente; reconcilia estado stale |
| P6 | **Correlation ID end-to-end** | Rastreio de depósito/saque do request ao ledger |
| P7 | **Feature flags explícitas** | `ASAAS_PRODUCTION_ENABLED`, `MOCK_FINANCE_ENABLED`, `PAYMENT_WEBHOOK_ENGINE_ENABLED` |
| P8 | **Compat layer temporária** | Ponte monólito → factory; removível em V1.2+ |
| P9 | **Débito otimista em saque** | Saldo debitado na solicitação; rollback em falha |
| P10 | **Auditabilidade** | `financeLog()`, `admin_logs`, scripts de release audit readonly |

---

## 5. Componentes

### 5.1 Domain

| Componente | Responsabilidade | Localização |
|------------|------------------|-------------|
| Wallet | Saldo do titular | `usuarios.saldo` + RPC claim |
| Ledger | Trilha imutável | `ledger_financeiro` + `createLedgerEntry()` |
| Payout Orchestrator | Ciclo de vida de saques | `processPendingWithdrawals.js` |
| Provider Persistence | Normalização refs PSP | `payoutProviderPersistence.js` |

### 5.2 Engine Core

| Componente | Responsabilidade | Localização |
|------------|------------------|-------------|
| Factory | Resolução de PSP | `FinanceProviderFactory.js` |
| Deposit Engine | PIX IN entry | `createPixDeposit.js`, `*Compat.js` |
| Webhook Engine | Orquestração webhooks | `processPaymentWebhook.js` |
| Transfer Handler | Webhook TRANSFER Asaas | `processAsaasTransferWebhook.js` |
| Recovery Engine | Reconciliação stale | `asaasPayoutRecovery.js` |
| Idempotency | Guards de replay | `paymentWebhookIdempotency.js` |
| Config | Gates e flags | `src/finance/config/` |
| Compat Layer | Ponte monólito | `src/finance/compat/` |

### 5.3 Provider Layer

| Contrato | Métodos |
|----------|---------|
| `PaymentProvider` | `createPixDeposit`, `getPixDepositStatus`, `handleDepositWebhook` |
| `PayoutProvider` | `requestPixPayout`, `getPayoutStatus`, `handlePayoutWebhook` |

| Adapter | PIX IN | PIX OUT | Certificado |
|---------|:------:|:-------:|:-----------:|
| Asaas | ✅ | ✅ | ✅ |
| Mercado Pago | ✅ | ✅ | ✅ (IN); legado (OUT) |
| Mock | ✅ | ✅ | Dev only |
| Celcoin | stub | stub | ❌ |

### 5.4 Scheduler

| Job | Trigger | Função |
|-----|---------|--------|
| MP reconcile | `setInterval` server-fly | Depósitos pendentes |
| Asaas recovery | `setInterval` server-fly | Saques stale |
| Payout worker | `setInterval` worker | Fila de saques |

---

## 6. Garantias Arquiteturais

### G1 — Continuidade sem webhook

O Recovery Job consulta o PSP diretamente (`GET /v3/transfers/{id}`) e reconcilia transações em estado stale. Comprovado em produção (P1.9): saque reconciliado após ~5h sem evento `TRANSFER_DONE`.

### G2 — Idempotência em todas as camadas

- Ledger: índice UNIQUE impede duplicata
- PIX IN: RPC claim rejeita reprocessamento
- Webhook: guards verificam estado terminal antes de agir
- PIX OUT MP: header `X-Idempotency-Key`

### G3 — Auditabilidade completa

Toda operação financeira produz:
1. Entrada no ledger com `correlation_id`
2. Log estruturado via `financeLog()`
3. Ações admin em `admin_logs`

### G4 — Troca de PSP sem reescrita

Novo PSP requer apenas:
1. Implementar `PaymentProvider` e/ou `PayoutProvider`
2. Registrar na `FinanceProviderFactory`
3. Configurar env vars e gates

Wallet, ledger, webhooks e recovery permanecem inalterados.

### G5 — Falha explícita

- `assertBootConfig()` no boot impede config inválida
- `MOCK_FINANCE_ENABLED` proibido em produção
- Provider não configurado → erro, não fallback silencioso

---

## 7. Dependências Externas

| Dependência | Papel | Crítica |
|-------------|-------|:-------:|
| Supabase PostgreSQL | Persistência wallet, ledger, transações | ✅ |
| Fly.io | Runtime produção | ✅ |
| Asaas API v3 | PIX IN/OUT primário homologado | ✅ |
| Mercado Pago API | PIX IN produção; PIX OUT legado | ✅ |
| Env secrets | API keys, webhook tokens | ✅ |

---

## 8. Limitações Arquiteturais V1

| Limitação | Impacto | Resolução planejada |
|-----------|---------|---------------------|
| Monólito HTTP | Engine não deployável separadamente | V2.0 microserviço |
| Schema acoplado (`usuarios`, `saques`) | Naming e FK do domínio Gol de Ouro | V2.0 schema genérico |
| Recovery só Asaas | MP PIX OUT sem recovery automático | V1.1 |
| MP payout fora de `src/finance/` | Acoplamento legado | V1.1 consolidação |
| Single-tenant | Apenas Gol de Ouro | V2.0 multi-tenant |

---

## 9. Invariantes (não violáveis na V1)

1. Ledger nunca é alterado — apenas append
2. Toda movimentação financeira tem `correlation_id`
3. Saque debita saldo antes de enviar ao PSP
4. Webhook rejeitado retorna erro explícito (não silencia)
5. Recovery é idempotente — estado terminal não é sobrescrito
6. Mock finance é impossível em `NODE_ENV=production`

---

## 10. Assinatura

```text
┌────────────────────────────────────────────────────────────┐
│  Indesconectável Payment Engine™                           │
│  Version: V1 CERTIFICADA                                   │
│  Status:  Production Certified                             │
│  Tag:     payment-engine-v1-certified                      │
│  Date:    2026-07-01                                       │
│                                                            │
│  Certified: P1.9 PASS                                      │
│  Productized: P2.0A PASS                                   │
│  Frozen: P2.0B                                             │
│                                                            │
│  Guarantee GOLD: Recovery without webhook — PROVEN           │
└────────────────────────────────────────────────────────────┘
```

---

*Indesconectável Payment Engine™ V1 CERTIFICADA — Architecture Signature*
