# Package Map — Indesconectável Payment Engine™



**Gate:** PE.2C-PRE  

**Data:** 2026-07-11  

**Modo:** READ-ONLY ABSOLUTO  



---



## 1. Visão da fronteira proposta (Package C0)



```text

┌─────────────────────────────────────────────────────────────┐

│  RUNTIME (permanece no monólito GDO)                        │

│  server-fly.js · routes · controllers · workers · config DB │

└───────────────────────────┬─────────────────────────────────┘

                            │ injeta supabase, ENV, Express

┌───────────────────────────▼─────────────────────────────────┐

│  ADAPTERS (produto — fora do Core puro)                      │

│  adapters/goldeouro/* · domain/payout (legado) · services/mp  │

└───────────────────────────┬─────────────────────────────────┘

                            │ Ports / interfaces

┌───────────────────────────▼─────────────────────────────────┐

│  PACKAGE CORE (C0 candidato)                                  │

│  src/finance/** + payment-engine/api + core + providers       │

│  + ports + types + compat + boundary (shadow)                 │

└───────────────────────────┬─────────────────────────────────┘

                            │ HTTP / SDK

┌───────────────────────────▼─────────────────────────────────┐

│  ADAPTERS PSP (dentro do Core hoje)                          │

│  providers/asaas · mercadopago · celcoin · mock              │

└─────────────────────────────────────────────────────────────┘

```



---



## 2. Inventário por camada



### 2.1 CORE (pertence ao package C0)



| Path | Arquivos | Função | Evidência |

|------|:--------:|--------|-----------|

| `src/finance/contracts/` | 2 | Contratos PaymentProvider, PayoutProvider | F4.0E |

| `src/finance/factory/` | 1 | FinanceProviderFactory multi-PSP | P1.9 |

| `src/finance/deposit/` | 2 | PIX IN, claim | P1.4F |

| `src/finance/webhooks/` | 7 | Processamento webhooks, idempotência | P1.9 |

| `src/finance/reconciliation/` | 1 | Asaas payout recovery | P1.9 GOLD |

| `src/finance/config/` | 5 | PSP, webhook, Asaas gates | ADR-002 |

| `src/finance/compat/` | 3 | Compat layers monólito | P2.2 |

| `src/finance/providers/` | 18+ | Asaas, MP, Celcoin, Mock | F4.Z |

| `src/payment-engine/api/PaymentEngine.js` | 1 | Fachada pública P2.2 | PE.PATRIMÔNIO |

| `src/payment-engine/core/` | 4 | Delegação deposit/withdraw/webhooks/reconcile | P2.2 |

| `src/payment-engine/providers/index.js` | 1 | Re-export factory | P2.2 |

| `src/payment-engine/config/index.js` | 1 | Re-export finance config | P2.2 |

| `src/payment-engine/scheduler/` | 3 | MP reconcile + Asaas recovery cycles | V1 |

| `src/payment-engine/interfaces/` | 5 | Contratos adapter JSDoc | P2.2 |

| `src/payment-engine/shared/` | 1 | Util MP reconcile | P2.2 |



**Total estimado Core:** ~55 arquivos JS (+ COPYRIGHT)



---



### 2.2 PORTS (fronteira — shadow PE.2B)



| Path | Status | Produção |

|------|--------|----------|

| `src/payment-engine/ports/LedgerPort.js` | READY_SHADOW | ❌ flag=false |

| `src/payment-engine/ports/WalletPort.js` | READY_SHADOW | ❌ |

| `src/payment-engine/ports/WithdrawalPort.js` | READY_SHADOW | ❌ |

| `src/payment-engine/types/WebhookPayload.js` | READY_SHADOW | ❌ |

| `src/payment-engine/boundary/` | READY_SHADOW | ❌ |

| `src/payment-engine/compat/*Bridge*.js` | READY_SHADOW | ❌ |



**Evidência:** `docs/payment-engine/adapter-boundary/adapter-boundary-map.json`



---



### 2.3 ADAPTERS (produto GDO — **fora** do Core puro)



| Path | Tipo | Acoplamento schema |

|------|------|-------------------|

| `src/payment-engine/adapters/goldeouro/GolDeOuroWalletAdapter.js` | Wallet | `usuarios.saldo` |

| `src/payment-engine/adapters/goldeouro/GolDeOuroLedgerAdapter.js` | Ledger | `ledger_financeiro` |

| `src/payment-engine/adapters/goldeouro/GolDeOuroDepositRepository.js` | Depósito | `pagamentos_pix` |

| `src/payment-engine/adapters/goldeouro/GolDeOuroWithdrawRepository.js` | Saque | `saques` |

| `src/payment-engine/adapters/goldeouro/GolDeOuroUserRepository.js` | Usuário | `usuarios` |

| `src/payment-engine/adapters/goldeouro/GolDeOuroWebhookAdapter.js` | Webhook | → finance idempotency |

| `src/payment-engine/adapters/goldeouro/GolDeOuroWithdrawalAdapter.js` | Withdrawal | `saques` + alias |

| `src/domain/payout/processPendingWithdrawals.js` | Payout runtime | **32 refs** Supabase GDO |

| `services/pix-mercado-pago.js` | Legacy MP | Usado por finance MP provider |



---



### 2.4 RUNTIME (permanece fora do package)



| Path | Import PE/Finance | Bypass facade? |

|------|-------------------|----------------|

| `server-fly.js` | PaymentEngine + finance + domain/payout | **SIM** — imports paralelos |

| `src/workers/payout-worker.js` | finance + domain/payout | **SIM** — não usa PaymentEngine |

| `controllers/adminWithdrawController.js` | domain/payout | **SIM** |

| `routes/paymentRoutes.js` | Controller layer | Indireto |

| `database/supabase-unified-config.js` | — | Runtime DI |

| `goldeouro-player/` | — | HTTP only |

| `goldeouro-admin/` | — | HTTP only |



---



## 3. Resposta: o package pode existir isoladamente?



| Critério | Resposta | Evidência |

|----------|----------|-----------|

| **Logicamente** (npm workspace / subpath export) | **SIM COM RESSALVAS** | Fachada + factory + providers coesos |

| **Fisicamente** (zero imports GDO) | **NÃO** | Core finance referencia tabelas GDO; core/withdraw → domain/payout |

| **Operacionalmente** (prod intacta pós-move) | **NÃO sem bridges** | Worker e server-fly bypassam facade |

| **Comercialmente** (segundo produto) | **NÃO** | Adapters GDO embutidos; ports shadow inativos |



### Veredito de isolamento



> A engine possui **identidade arquitetural** (P2.2 + PE.2B shadow) mas **não possui isolamento suficiente** para package C0 independente sem refatoração prévia.



---



## 4. Grafo de dependência resumido



```text

goldeouro-player/admin  ──HTTP──►  server-fly.js

                                      ├── PaymentEngine (facade)

                                      ├── src/finance/* (DIRECT)

                                      └── domain/payout/* (DIRECT)



payout-worker  ──►  finance/factory + domain/payout  (sem PaymentEngine)



PaymentEngine  ──►  payment-engine/core  ──►  finance/*

                    payment-engine/core/withdraw  ──►  domain/payout/*



finance/providers/mp  ──►  services/pix-mercado-pago  (PROIBIDA no Core puro)



payment-engine/adapters/goldeouro  ──►  schema GDO (Adapter — OK fora Core)

payment-engine/adapters/goldeouro/Webhook  ──►  finance/idempotency (cross)

```



**Dependências circulares de módulo:** **Nenhuma** detectada (`finance` ↛ `payment-engine`).



**Acoplamentos ocultos:** domain/payout paralelo à fachada; ENV global `process.env`; RPC Supabase hardcoded em claim.



---



## 5. Imports proibidos detectados (vs Core puro ideal)



| De | Para | Classificação | Severidade |

|----|------|---------------|:----------:|

| `payment-engine/core/*` | `finance/*` | Delegação intencional P2.2 | MÉDIO — blocker B7 |

| `payment-engine/core/withdraw.js` | `domain/payout/*` | **Core → Runtime GDO** | **ALTO** |

| `finance/providers/mp/*` | `services/pix-mercado-pago` | **Core → Legacy runtime** | **ALTO** |

| `finance/deposit/claim*` | tabelas `pagamentos_pix`, `ledger_financeiro` | **Core → Schema GDO** | **ALTO** |

| `domain/payout/*` | `finance/*` + schema GDO | Runtime (OK fora package) | — |

| `GolDeOuroWebhookAdapter` | `finance/idempotency` | Adapter → Core (aceitável) | BAIXO |



---



## 6. Mapeamento package.json C0 (proposta — não implementada)



```json

{

  "name": "@indesconectavel/payment-engine",

  "exports": {

    ".": "./api/PaymentEngine.js",

    "./ports": "./ports/index.js",

    "./providers": "./providers/index.js",

    "./config": "./config/index.js"

  },

  "peerDependencies": {

    "@supabase/supabase-js": "^2.x"

  }

}

```



**Bloqueio:** `peerDependencies` insuficiente — Core ainda assume shape Supabase GDO.



---



## Referências



- `dependency-graph.json`

- `docs/payment-engine/adapter-boundary/adapter-boundary-map.json`

- `docs/payment-engine/adapter-boundary/risk-register.json`

- `docs/governance/PROPRIETARY-SCOPE.md`

