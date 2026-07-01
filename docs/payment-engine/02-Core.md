# Indesconectável Payment Engine™ — Inventário Core

**Versão:** P2.0A  
**Data:** 2026-07-01  
**Modo:** AUDITORIA COMPLETA

---

## 1. Objetivo

Classificar todos os componentes da Payment Engine em **Core** (reutilizável) versus **Dependência Gol de Ouro** (acoplamento ao domínio do jogo), com estratégia de desacoplamento para productização.

---

## 2. Matriz de Componentes

| Componente | Core | Dependência Gol de Ouro | Estratégia |
|------------|:----:|:-----------------------:|------------|
| **Wallet** (`usuarios.saldo`) | Parcial | Tabela `usuarios` do jogo; compartilha saldo com apostas | V2: extrair para `accounts` com `owner_id` + `owner_type` |
| **Ledger** (`ledger_financeiro`) | ✅ | FK `usuario_id`; nomenclatura PT-BR (`saque`, `deposito`) | V2: renomear tipos para inglês; `account_id` genérico |
| **Transaction Orchestrator** (`processPendingWithdrawals`) | ✅ | Referencia tabela `saques`; campos `usuario_id` | V2: abstrair para `withdrawals` genérico |
| **PIX IN Engine** (`createPixDeposit`, compat) | ✅ | Default description "Depósito Gol de Ouro" | Parametrizar `description` por cliente |
| **PIX OUT Engine** (`createPixWithdrawCompat`) | ✅ | Tabela `saques`; taxa hardcoded no fluxo HTTP | Extrair fee policy para config por tenant |
| **Provider Factory** (`FinanceProviderFactory`) | ✅ | Nenhuma | Manter; já provider-agnostic |
| **PaymentProvider** (contrato) | ✅ | Nenhuma | Manter |
| **PayoutProvider** (contrato) | ✅ | Campo `saqueId` no input | Renomear para `withdrawalId` em V2 |
| **Webhook Engine** (`processPaymentWebhook`) | ✅ | Persistência em `pagamentos_pix` | V2: `deposits` genérico |
| **Transfer Webhook** (`processAsaasTransferWebhook`) | ✅ | Atualiza `saques` | V2: `withdrawals` |
| **Idempotency Layer** | ✅ | Tabelas específicas do jogo | Manter lógica; generalizar schema |
| **Recovery Engine** (`asaasPayoutRecovery`) | ✅ | Query em `saques` | Parametrizar tabela/repositório |
| **Reconciliation** (MP pending) | ✅ | Query em `pagamentos_pix` | Idem |
| **Scheduler** (`server-fly.js` intervals) | ✅ | Embutido no monólito | V2: scheduler próprio ou cron externo |
| **Payout Worker** (`payout-worker.js`) | ✅ | Nenhuma direta | Extrair como processo independente |
| **Compat Layer** (`*Compat.js`) | ✅ | Ponte para `server-fly.js` | Remover quando API for independente |
| **Config** (`primary-psp.js`, gates) | ✅ | Nenhuma | Manter |
| **Audit Layer** (`adminAuditLogger`, `financeLog`) | ✅ | Tabela `admin_logs` do jogo | V2: `audit_events` genérico |
| **Asaas Provider** | ✅ | Nenhuma | Manter |
| **Mercado Pago Provider** | ✅ | Wrapper sobre `services/pix-mercado-pago.js` legado | Consolidar em adapter único |
| **Celcoin Provider** | ✅ (stub) | Nenhuma | Completar implementação |
| **Mock Provider** | ✅ | Nenhuma | Manter para dev/test |
| **RPC claim deposit** | ✅ | Crédito em `usuarios.saldo` | V2: RPC genérica `credit_account` |
| **Admin Withdraw Controller** | Parcial | Fluxo admin do painel Gol de Ouro | V2: Admin API independente |
| **Shoot / Game Engine** (`shoot_apply`) | ❌ | 100% domínio do jogo | Fora do escopo da Engine |
| **Saldo inicial onboarding** (`calculateInitialBalance`) | ❌ | Regra de negócio do jogo | Permanece no Gol de Ouro |
| **paymentRoutes.js** (legado) | ❌ | ~90 rotas não montadas; cashback, afiliados | Deprecar; não productizar |
| **paymentController.js** (legado) | ❌ | Controller MP antigo não usado | Remover em V1.1 cleanup |

---

## 3. Inventário Detalhado — Core

### 3.1 Wallet

Não existe módulo `WalletService`. O wallet é implementado como:

| Artefato | Caminho | Papel |
|----------|---------|-------|
| Saldo | `usuarios.saldo` | Balance do titular |
| Crédito PIX IN | `database/claim_and_credit_approved_pix_deposit.sql` | RPC atômica idempotente |
| Crédito JS fallback | `src/finance/deposit/claimApprovedPixDeposit.js` | Fallback Asaas `pay_*` |
| Débito saque | `server-fly.js` + `processPendingWithdrawals.js` | Débito otimista |
| Sandbox wallet | `src/finance/webhooks/paymentWebhookControlledCreditStore.js` | In-memory F4.6 |

### 3.2 Ledger

| Artefato | Caminho | Papel |
|----------|---------|-------|
| Schema | `database/schema-ledger-financeiro.sql` | Tipos: deposito, saque, taxa, rollback, payout_confirmado, falha_payout |
| Writer | `src/domain/payout/processPendingWithdrawals.js` → `createLedgerEntry()` | Insert com dedup |
| UNIQUE index | `(correlation_id, tipo, referencia)` | Idempotência estrutural |

### 3.3 Transaction Orchestrator

Distribuído (não há classe `TransactionEngine`):

| Artefato | Caminho | Papel |
|----------|---------|-------|
| Payout motor | `src/domain/payout/processPendingWithdrawals.js` | `processPendingWithdrawals`, rollback, healing |
| Provider persistence | `src/domain/payout/payoutProviderPersistence.js` | Normalização MP vs Asaas refs |
| Worker | `src/workers/payout-worker.js` | Ciclo periódico (default 30s) |

### 3.4 Provider Factory

| Artefato | Caminho | Papel |
|----------|---------|-------|
| Factory | `src/finance/factory/FinanceProviderFactory.js` | Resolução + cache + boot assert |
| Contrato IN | `src/finance/contracts/PaymentProvider.js` | `createPixDeposit`, `getPixDepositStatus`, `handleDepositWebhook` |
| Contrato OUT | `src/finance/contracts/PayoutProvider.js` | `requestPixPayout`, `getPayoutStatus`, `handlePayoutWebhook` |

### 3.5 Scheduler

| Job | Intervalo (env) | Função |
|-----|-----------------|--------|
| MP reconcile | `MP_RECONCILE_INTERVAL_MS` | Depósitos PIX IN pendentes |
| Asaas payout recovery | `ASAAS_PAYOUT_RECOVERY_INTERVAL_MS` | Saques stale Asaas |
| Payout worker | `PAYOUT_WORKER_INTERVAL_MS` | Processa fila de saques |

### 3.6 Recovery & Reconciliation

| Artefato | Caminho | Função |
|----------|---------|--------|
| Asaas recovery | `src/finance/reconciliation/asaasPayoutRecovery.js` | GET `/transfers/{id}` → reconcilia |
| MP reconcile | `server-fly.js` → `reconcilePendingPayments()` | Sync status depósitos |
| Watchdog | `scripts/operational/watchdog-financial-integrity.js` | Read-only: duplicatas, saldo negativo |

### 3.7 Idempotência

| Camada | Mecanismo |
|--------|-----------|
| Ledger | UNIQUE `(correlation_id, tipo, referencia)` |
| PIX IN claim | RPC `claim_and_credit_approved_pix_deposit` |
| Webhook deposit | `paymentWebhookIdempotency.js` — checa `pagamentos_pix` approved |
| Webhook transfer | `processAsaasTransferWebhook.js` → `isIdempotentReplay()` |
| PIX OUT MP | Header `X-Idempotency-Key` |
| MP legado | Tabela `mp_events` |

### 3.8 Config

| Artefato | Caminho | Função |
|----------|---------|--------|
| PSP primário | `src/finance/config/primary-psp.js` | Arquitetural vs efetivo |
| Webhook gates | `src/finance/config/payment-webhook-config.js` | Engine ON/OFF, crédito controlado |
| Asaas PIX OUT | `src/finance/config/asaas-pix-out-config.js` | Gates produção/sandbox |
| Transfer auth | `src/finance/config/asaas-transfer-auth-config.js` | Webhook autorização P1.6 |

### 3.9 Auditoria

| Artefato | Caminho | Função |
|----------|---------|--------|
| Admin audit | `src/utils/adminAuditLogger.js` | Persiste em `admin_logs` |
| Finance telemetry | `server-fly.js` → `financeLog()` | Eventos estruturados |
| Scripts audit | `scripts/release-audit-pix-*.js` | Read-only release |
| Certificação | `scripts/p19-certification.cjs` | Runner P1.9 |

---

## 4. Dependências Gol de Ouro — Detalhamento

### 4.1 Tabelas acopladas

| Tabela | Uso pela Engine | Acoplamento |
|--------|-----------------|-------------|
| `usuarios` | Wallet (`saldo`), FK em tudo | Alto — compartilhada com game engine |
| `pagamentos_pix` | Depósitos | Médio — naming PT-BR |
| `saques` | Saques | Médio — naming PT-BR |
| `ledger_financeiro` | Ledger | Baixo — schema genérico, FK `usuario_id` |
| `admin_logs` | Audit admin | Médio — escopo admin do jogo |

### 4.2 Lógica de jogo compartilhada

| Componente | Acoplamento | Impacto |
|------------|-------------|---------|
| `shoot_apply` RPC | Debita `usuarios.saldo` para apostas | Wallet compartilhado — V2 precisa de isolamento |
| `calculateInitialBalance('regular')` | Saldo inicial de onboarding | Fora da Engine |
| `total_gols_de_ouro`, lotes, apostas | Tabelas de jogo adjacentes | Não fazem parte da Engine |

### 4.3 Nomenclatura específica

| Atual (Gol de Ouro) | Proposta V2 (Engine) |
|---------------------|----------------------|
| `usuarios` | `accounts` |
| `usuario_id` | `account_id` |
| `saques` | `withdrawals` |
| `pagamentos_pix` | `deposits` |
| `saldo` | `balance` |
| `deposito` (ledger tipo) | `deposit` |
| `saque` (ledger tipo) | `withdrawal` |

### 4.4 Endpoints acoplados

| Endpoint | Acoplamento |
|----------|-------------|
| `GET /api/user/profile` | Retorna saldo no payload do jogador |
| `POST /api/games/shoot` | Debita saldo — game engine |
| `GET /api/admin/dashboard/stats` | KPIs do painel Gol de Ouro |
| `GET /api/admin/financial/report` | Relatório admin do jogo |

---

## 5. Resumo Quantitativo

| Classificação | Componentes | % |
|---------------|-------------|---|
| Core puro | 18 | ~72% |
| Core parcial (schema/naming) | 5 | ~20% |
| Dependência Gol de Ouro | 2 | ~8% |

**Conclusão:** A lógica financeira é majoritariamente Core. O acoplamento principal está no **schema de persistência** (`usuarios`, `saques`, `pagamentos_pix`) e na **montagem HTTP** (`server-fly.js`), não na abstração de providers ou nos motores de webhook/recovery.

---

## 6. Estratégia de Desacoplamento (V1.1 → V2)

| Fase | Ação |
|------|------|
| **V1.1** | Parametrizar descriptions, extrair fee policy, cleanup legado (`paymentRoutes`, `paymentController`) |
| **V1.2** | Repository pattern sobre tabelas atuais (sem rename) |
| **V2.0** | Schema genérico (`accounts`, `withdrawals`, `deposits`); API REST independente |
| **V2.1** | Multi-tenant, SDK, documentação pública |

---

*Indesconectável Payment Engine™ — Inventário Core P2.0A*
