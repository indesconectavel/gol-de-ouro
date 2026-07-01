# Indesconectável Payment Engine™ — Arquitetura Oficial

**Versão:** P2.0A  
**Data:** 2026-07-01  
**Base certificada:** V1 (P1.9 PASS)  
**Origem:** Gol de Ouro™ V1  
**Modo:** PRODUCTIZAÇÃO CONTROLADA

---

## 1. Visão Geral

A **Indesconectável Payment Engine™** é a camada financeira reutilizável do ecossistema Indesconectável™. Ela abstrai PIX Cash-In, PIX Cash-Out, wallet, ledger, webhooks, reconciliação e recovery sobre múltiplos PSPs (Payment Service Providers).

Na V1 certificada, a Engine opera embutida no monólito `server-fly.js` do Gol de Ouro, com o núcleo modular em `src/finance/`. A productização P2.0A define a separação conceitual e prepara a evolução para plataforma independente.

---

## 2. Diagrama Oficial

```text
                    Client Systems
                    ──────────────

        Gol de Ouro™        Sistema A        Sistema B
        Marketplace           SaaS             Fintech

                              │
                              ▼

              Indesconectável Payment Engine™
              ═══════════════════════════════════

    ┌─────────────────────────────────────────────────┐
    │  API Layer (HTTP — hoje inline em server-fly)   │
    │  Deposit · Withdraw · Webhook · Health · Admin  │
    └──────────────────────┬──────────────────────────┘
                           │
    ┌──────────────────────▼──────────────────────────┐
    │  Domain Layer                                   │
    │  Wallet · Ledger · Transaction Orchestration    │
    └──────────────────────┬──────────────────────────┘
                           │
    ┌──────────────────────▼──────────────────────────┐
    │  Engine Core (src/finance/)                     │
    │  ┌─────────────┐ ┌──────────────┐ ┌───────────┐ │
    │  │ Compat Layer│ │ Idempotency  │ │  Config   │ │
    │  └─────────────┘ └──────────────┘ └───────────┘ │
    │  ┌─────────────┐ ┌──────────────┐ ┌───────────┐ │
    │  │ Webhook Eng.│ │ Recovery Eng.│ │ Reconcile │ │
    │  └─────────────┘ └──────────────┘ └───────────┘ │
    │  ┌─────────────┐ ┌──────────────┐               │
    │  │  Scheduler  │ │ Audit Layer  │               │
    │  └─────────────┘ └──────────────┘               │
    └──────────────────────┬──────────────────────────┘
                           │
    ┌──────────────────────▼──────────────────────────┐
    │  Provider Layer (FinanceProviderFactory)        │
    │  PaymentProvider · PayoutProvider               │
    └──────────────────────┬──────────────────────────┘
                           │
    ┌──────────────────────▼──────────────────────────┐
    │  PSP Adapters                                   │
    │  Asaas · Mercado Pago · Celcoin · Mock · (Efí)  │
    └─────────────────────────────────────────────────┘
```

---

## 3. Camadas

### 3.1 API Layer

Ponto de entrada HTTP. Hoje implementado inline em `server-fly.js`. Futuro V2: serviço REST independente com autenticação multi-tenant.

| Responsabilidade | Estado V1 |
|------------------|-----------|
| Criação de depósito PIX | ✅ Ativo |
| Consulta de status PIX IN | ✅ Ativo |
| Solicitação de saque PIX OUT | ✅ Ativo |
| Webhooks PSP | ✅ Ativo |
| Health / Monitoring | ✅ Ativo |
| Admin financeiro | ✅ Ativo (acoplado ao Gol de Ouro) |

### 3.2 Domain Layer

Lógica de negócio financeira independente de PSP.

| Componente | Localização | Função |
|------------|-------------|--------|
| Wallet | `usuarios.saldo` + RPC `claim_and_credit_approved_pix_deposit` | Saldo do titular |
| Ledger | `ledger_financeiro` + `createLedgerEntry()` | Trilha imutável de movimentações |
| Payout Orchestrator | `src/domain/payout/processPendingWithdrawals.js` | Ciclo de vida de saques |
| Payout Worker | `src/workers/payout-worker.js` | Scheduler de processamento |

### 3.3 Engine Core (`src/finance/`)

```text
src/finance/
├── config/           # Gates, flags, PSP primário
├── contracts/        # PaymentProvider, PayoutProvider (JSDoc)
├── factory/          # FinanceProviderFactory
├── compat/           # Ponte monólito → factory
├── deposit/          # PIX IN entry points
├── webhooks/         # Orquestração de webhooks
├── reconciliation/   # Recovery e reconciliação
└── providers/        # Adapters por PSP
    ├── asaas/
    ├── mercadopago/
    ├── celcoin/
    └── mock/
```

### 3.4 Provider Layer

Resolução dinâmica de PSP via `FinanceProviderFactory`:

- `resolvePaymentProvider()` — PIX IN
- `resolvePayoutProvider()` — PIX OUT
- Seleção por env: `PAYMENT_PROVIDER`, `PAYOUT_PROVIDER`, `PRIMARY_PSP`

### 3.5 Persistence Layer

| Tabela | Papel |
|--------|-------|
| `usuarios` | Wallet (coluna `saldo`) |
| `pagamentos_pix` | Depósitos PIX IN |
| `saques` | Saques PIX OUT |
| `ledger_financeiro` | Ledger imutável |
| `admin_logs` | Auditoria admin |

---

## 4. Fluxos Certificados (V1)

### 4.1 PIX IN

```text
Cliente → POST /api/payments/pix/criar
              │
              ▼
       createPixDepositCompat → FinanceProviderFactory
              │
              ▼
       PSP (MP / Asaas) → QR Code
              │
              ▼
       Webhook PAYMENT_* → processPaymentWebhook
              │
              ▼
       claimAndCreditApprovedPixDeposit (RPC atômica)
              │
              ▼
       usuarios.saldo ↑ + ledger_financeiro (deposito)
```

### 4.2 PIX OUT

```text
Cliente → POST /api/withdraw/request
              │
              ▼
       Débito otimista saldo + insert saques + ledger (saque, taxa)
              │
              ▼
       payout-worker / approve-and-send → createPixWithdrawCompat
              │
              ▼
       PSP (Asaas / MP) → POST /transfers
              │
              ├──── Webhook TRANSFER_* → processAsaasTransferWebhook
              │                              │
              └──── Recovery Job ────────────┤
                                             ▼
                                    status = processado
                                    ledger payout_confirmado
```

### 4.3 Recovery (P1.8 / P1.9)

Ciclo em background (`server-fly.js`):

- `reconcilePendingPayments()` — PIX IN pendentes (MP)
- `runAsaasPayoutRecoveryCycle()` — PIX OUT stale (Asaas GET /transfers)

Comprovado em produção: saque reconciliado automaticamente sem webhook (P1.9).

---

## 5. Runtime

| Processo | Função |
|----------|--------|
| `server-fly.js` | Monólito HTTP + schedulers inline |
| `payout-worker.js` | Worker dedicado de payout (opcional) |
| Fly.io `goldeouro-backend-v2` | Deploy produção certificado (v536) |

---

## 6. Princípios Arquiteturais

| Princípio | Implementação |
|-----------|---------------|
| Idempotência | Ledger UNIQUE `(correlation_id, tipo, referencia)`; claim RPC; guards webhook |
| Auditabilidade | `ledger_financeiro` + `correlation_id` + `admin_logs` |
| Resiliência a webhook | Recovery Job compensa ausência de eventos PSP |
| Provider abstraction | Contratos formais + factory; novo PSP = novo adapter |
| Feature flags | Gates explícitos (`ASAAS_PRODUCTION_ENABLED`, `MOCK_FINANCE_ENABLED`) |
| Sem fallback silencioso | Factory falha explicitamente se provider não configurado |

---

## 7. Estado de Independência (P2.0A)

| Dimensão | V1 Certificada | Meta V2 |
|----------|----------------|---------|
| Código Engine | Modular em `src/finance/` | Pacote npm / serviço |
| Deploy | Embutido no monólito Gol de Ouro | Microserviço ou sidecar |
| Wallet | `usuarios.saldo` (tabela do jogo) | `accounts` genérica |
| API | Inline `server-fly.js` | REST pública versionada |
| Multi-tenant | Não | Sim |
| SDK | Não | TypeScript / Node |

---

## 8. Referências

| Documento | Caminho |
|-----------|---------|
| Arquitetura V1 (legado) | `docs/arquitetura/PAYMENT-ENGINE-V1.md` |
| Certificação P1.9 | `docs/relatorios/P1.9-CERTIFICACAO-FINAL-PAYMENT-ENGINE-V1.md` |
| Core (inventário) | `docs/payment-engine/02-Core.md` |
| Interfaces | `docs/payment-engine/03-Interfaces.md` |
| Provider Layer | `docs/payment-engine/04-Provider-Layer.md` |

---

*Indesconectável Payment Engine™ — Arquitetura Oficial P2.0A*
