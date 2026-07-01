# Indesconectável Payment Engine™ — Core Decoupling

**Versão:** P2.2  
**Data:** 2026-07-01  
**Base:** P2.1 (PASS) · Tag `payment-engine-v1-certified`  
**Modo:** DESACOPLAMENTO CONTROLADO — COMPATIBILIDADE TOTAL

---

## 1. Objetivo

Separar internamente o Core da Payment Engine™ da aplicação Gol de Ouro™, via delegação e adapters, sem alterar comportamento, contratos HTTP, ENV ou regras financeiras.

---

## 2. Arquitetura Antiga (pré-P2.2)

```text
Gol de Ouro Backend (server-fly.js)
    │
    ├── HTTP inline (rotas PIX, saques, webhooks)
    ├── Schedulers inline (MP reconcile, Asaas recovery)
    ├── Imports diretos src/finance/*
    ├── Imports diretos src/domain/payout/*
    └── Schema acoplado (usuarios, saques, pagamentos_pix)
```

**Problema:** Core financeiro existia em `src/finance/` mas a orquestração, persistência e HTTP estavam no monólito sem fronteira clara.

---

## 3. Arquitetura Nova (pós-P2.2)

```text
Gol de Ouro Backend (server-fly.js)
    │
    │  aliases de compatibilidade (zero mudança de rotas)
    ▼
PaymentEngine (fachada pública)
    │
    ├── api/PaymentEngine.js     ← start(), deposit(), withdraw(), reconcile(), providers(), health()
    ├── core/                    ← delegação para src/finance/ + src/domain/payout/
    ├── scheduler/               ← MP reconcile + Asaas recovery (extraídos do monólito)
    ├── adapters/goldeouro/      ← Wallet, Ledger, Repositories do Gol de Ouro
    ├── interfaces/              ← contratos de adapter/repository
    ├── providers/               ← re-export FinanceProviderFactory
    ├── config/                  ← re-export gates ENV
    ├── wallet/ ledger/ reconciliation/ shared/
    └── (src/finance/ inalterado) ← implementação certificada preservada
```

---

## 4. Namespace `src/payment-engine/`

```text
src/payment-engine/
├── index.js                          # Export público
├── api/
│   └── PaymentEngine.js              # Fachada única
├── core/
│   ├── deposit.js                    # → src/finance/deposit + compat
│   ├── withdraw.js                   # → src/domain/payout
│   ├── webhooks.js                   # → src/finance/webhooks
│   └── reconciliation.js             # → src/finance/reconciliation
├── scheduler/
│   ├── index.js                      # startSchedulers()
│   ├── mpDepositReconcile.js         # Extraído de server-fly.js
│   └── asaasPayoutRecoveryScheduler.js
├── adapters/goldeouro/
│   ├── GolDeOuroWalletAdapter.js
│   ├── GolDeOuroLedgerAdapter.js
│   ├── GolDeOuroUserRepository.js
│   ├── GolDeOuroWithdrawRepository.js
│   ├── GolDeOuroDepositRepository.js
│   └── index.js
├── interfaces/
│   ├── WalletAdapter.js
│   ├── LedgerAdapter.js
│   ├── UserRepository.js
│   ├── WithdrawRepository.js
│   └── DepositRepository.js
├── providers/index.js                # → FinanceProviderFactory
├── config/index.js                   # → finance/config/*
├── wallet/index.js
├── ledger/index.js
├── reconciliation/index.js
└── shared/
    └── pickMercadoPagoPaymentIdForReconcile.js
```

---

## 5. Inventário por Classificação (P2.2)

| Classificação | Componentes |
|---------------|-------------|
| **Core puro** | `core/deposit`, `core/withdraw`, `core/webhooks`, `core/reconciliation`, `providers/`, `interfaces/` |
| **Infraestrutura** | `scheduler/`, `config/`, `shared/` |
| **Provider** | `src/finance/providers/*` (inalterado; re-export via `providers/`) |
| **Adapter** | `adapters/goldeouro/*` |
| **Aplicação** | `api/PaymentEngine.js`, aliases em `server-fly.js` |
| **Gol de Ouro** | `server-fly.js` (HTTP), `adminWithdrawController.js` |
| **Legado** | `paymentRoutes.js`, `paymentController.js` (não tocados) |

---

## 6. Fachada Pública — PaymentEngine

| Método | Delegação | Comportamento |
|--------|-----------|---------------|
| `configure(deps)` | Injeta runtime (supabase, financeLog, flags MP) | Novo — setup |
| `start()` | `scheduler/startSchedulers()` | Idêntico a setInterval anterior |
| `deposit.createCompat()` | `createPixDepositCompat` | Idêntico |
| `deposit.claimAndCredit()` | `claimApprovedPixDeposit` + ledger | Idêntico |
| `withdraw.createCompat()` | `createPixWithdrawCompat` | Idêntico |
| `withdraw.processPending()` | `processPendingWithdrawals` | Idêntico |
| `webhooks.process()` | `processPaymentWebhook` | Idêntico |
| `reconcile.mpDeposits()` | `runMpDepositReconcileCycle` | Idêntico |
| `reconcile.asaasPayouts()` | `runAsaasPayoutRecoveryCycle` | Idêntico |
| `providers()` | `FinanceProviderFactory` | Idêntico |
| `health()` | Snapshot providers + deposit health | Novo (observabilidade) |
| `adapters()` | Gol de Ouro adapters | Novo (abstração) |

---

## 7. Adapters Gol de Ouro

| Adapter | Tabela | Responsabilidade |
|---------|--------|------------------|
| `GolDeOuroWalletAdapter` | `usuarios.saldo` | getBalance, debitBalance |
| `GolDeOuroLedgerAdapter` | `ledger_financeiro` | createEntry (delega createLedgerEntry) |
| `GolDeOuroUserRepository` | `usuarios` | findById, getBalanceRow |
| `GolDeOuroWithdrawRepository` | `saques` | findById, listByUser |
| `GolDeOuroDepositRepository` | `pagamentos_pix` | listPending, pickMercadoPagoPaymentId |

**Nenhum comportamento alterado** — adapters encapsulam queries existentes.

---

## 8. Delegação em server-fly.js

### Antes

```javascript
const { createPixDepositCompat } = require('./src/finance/compat/...');
// ... 8 imports finance
// reconcilePendingPayments() — 100 linhas inline
// runAsaasPayoutRecoveryCycle() — inline
```

### Depois

```javascript
const { PaymentEngine } = require('./src/payment-engine');
// aliases locais → PaymentEngine.* (compatibilidade 100%)
PaymentEngine.configure({ getSupabase, financeLog, ... });
PaymentEngine.start(); // schedulers
```

Rotas HTTP, handlers e payloads **inalterados**.

---

## 9. Dependências

```text
server-fly.js
    → payment-engine/api/PaymentEngine.js
        → core/* → src/finance/* + src/domain/payout/*
        → scheduler/* → core/reconciliation + axios
        → adapters/goldeouro/* → Supabase tables
        → providers/* → src/finance/factory/*
```

### Circulares remanescentes (documentadas)

| Ciclo | Motivo | Mitigação futura |
|-------|--------|------------------|
| `core/withdraw` → `finance/compat` → `factory` | Design V1 | V1.2 repository pattern |
| `processPendingWithdrawals` → `finance/compat` | Payout usa factory | Consolidar em V1.1 |
| `server-fly` → `PaymentEngine` → `scheduler` → `claimAndCredit` → runtime | Runtime injection | OK por design |

**Nenhuma dependência circular nova introduzida.**

---

## 10. Compatibilidade Garantida

| Dimensão | Status |
|----------|:------:|
| Endpoints HTTP | ✅ Inalterados |
| Providers PSP | ✅ Inalterados (`src/finance/` preservado) |
| Variáveis ENV | ✅ Inalteradas |
| Scripts homologação | ✅ Inalterados |
| Wallet / Ledger | ✅ Mesmas tabelas e RPCs |
| Recovery / Scheduler | ✅ Mesmos intervalos e lógica |
| Webhooks | ✅ Mesmos handlers |
| Contratos HTTP | ✅ Inalterados |

---

## 11. Riscos

| Risco | Severidade | Mitigação P2.2 |
|-------|:----------:|----------------|
| Regressão por rewire imports | Média | Aliases locais preservam nomes |
| Scheduler duplicado se start() chamado 2x | Baixa | Flag `_started` |
| Adapters não usados em todos os fluxos ainda | Baixa | Escopo V1.2 — repository pattern |
| `src/finance/` duplicado conceitualmente com `core/` | Informativo | `core/` é delegação fina |

---

## 12. Critério GOLD

> O Gol de Ouro continua operando exatamente como antes, enquanto a Payment Engine™ tornou-se significativamente mais independente?

## SIM

**Justificativa:**
- Rotas, ENV, providers e regras financeiras preservados via delegação pura
- Fachada `PaymentEngine` unifica entry point
- Adapters isolam schema Gol de Ouro
- Schedulers extraídos do monólito
- `src/finance/` certificado permanece intocado
- Próximo produto poderá implementar adapters próprios sem alterar Core

---

## 13. Próximos Passos (V1.2)

1. Rotear fluxos internos via adapters (não só fachada)
2. Extrair rotas HTTP para `payment-engine/api/routes/`
3. Repository pattern completo
4. Segundo adapter de produto piloto

---

*Indesconectável Payment Engine™ — Core Decoupling P2.2*
