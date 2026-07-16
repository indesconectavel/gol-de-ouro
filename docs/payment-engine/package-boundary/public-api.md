# Public API — Indesconectável Payment Engine™ Package



**Gate:** PE.2C-PRE  

**Data:** 2026-07-11  

**Modo:** READ-ONLY ABSOLUTO  



---



## 1. API existente (PaymentEngine facade P2.2)



Fonte: `src/payment-engine/api/PaymentEngine.js`, exportada via `src/payment-engine/index.js`.



| Método | Visibilidade atual | Visibilidade ideal package | Notas |

|--------|:------------------:|:--------------------------:|-------|

| `PaymentEngine.configure(deps)` | PUBLIC | **PUBLIC** | Injeta supabase, financeLog, flags |

| `PaymentEngine.start()` | PUBLIC | **PUBLIC** | Schedulers MP + Asaas recovery |

| `PaymentEngine.adapters()` | PUBLIC | **INTERNAL** | Expõe adapters GDO — produto |

| `PaymentEngine.deposit.createCompat(input)` | PUBLIC | **PUBLIC** | Compat monólito |

| `PaymentEngine.deposit.create(input)` | PUBLIC | **PUBLIC** | PIX IN |

| `PaymentEngine.deposit.isConfigured(opts)` | PUBLIC | **PUBLIC** | |

| `PaymentEngine.deposit.getHealth()` | PUBLIC | **PUBLIC** | |

| `PaymentEngine.deposit.claimApproved(paymentId, deps)` | PUBLIC | **PUBLIC** | Requer deps explícitos |

| `PaymentEngine.deposit.claimAndCredit(paymentId)` | PUBLIC | **PUBLIC** | Usa runtime injetado |

| `PaymentEngine.withdraw.createCompat(...)` | PUBLIC | **PUBLIC** | |

| `PaymentEngine.withdraw.processPending(input)` | PUBLIC | **PUBLIC** | Delega domain/payout |

| `PaymentEngine.withdraw.createLedgerEntry(input)` | PUBLIC | **INTERNAL** | Schema GDO |

| `PaymentEngine.withdraw.rollback(input)` | PUBLIC | **PUBLIC** | |

| `PaymentEngine.withdraw.counters` | PUBLIC | **INTERNAL** | Métricas runtime |

| `PaymentEngine.webhooks.processCompat(input)` | PUBLIC | **PUBLIC** | |

| `PaymentEngine.webhooks.process(input)` | PUBLIC | **PUBLIC** | |

| `PaymentEngine.webhooks.processAsaasTransfer(input)` | PUBLIC | **PUBLIC** | |

| `PaymentEngine.webhooks.handleAsaasTransferAuthorization(input)` | PUBLIC | **PUBLIC** | |

| `PaymentEngine.webhooks.isEngineEnabled()` | PUBLIC | **PUBLIC** | |

| `PaymentEngine.webhooks.isAsaasRouteAllowed()` | PUBLIC | **PUBLIC** | |

| `PaymentEngine.reconcile.mpDeposits(runtime)` | PUBLIC | **PUBLIC** | |

| `PaymentEngine.reconcile.asaasPayouts(runtime)` | PUBLIC | **PUBLIC** | |

| `PaymentEngine.reconcile.asaasPendingPayouts(input)` | PUBLIC | **PUBLIC** | |

| `PaymentEngine.reconcile.isAsaasRecoveryEnabled()` | PUBLIC | **PUBLIC** | |

| `PaymentEngine.providers()` | PUBLIC | **PUBLIC** | resolvePayment/Payout, snapshot |

| `PaymentEngine.health()` | PUBLIC | **PUBLIC** | |



---



## 2. API ideal do package C0 (target PE.2C+)



### 2.1 Superfície PUBLIC (contrato licenciável)



```typescript

// Bootstrap

createPaymentEngine(options: PaymentEngineOptions): PaymentEngineInstance



interface PaymentEngineOptions {

  productId: string;

  ports: {

    wallet: WalletPort;

    ledger: LedgerPort;

    withdrawal: WithdrawalPort;

    deposit?: DepositRepositoryPort;

    user?: UserRepositoryPort;

  };

  psp?: PspConfig;

  logger?: FinanceLogger;

  flags?: FeatureFlags;

}



// Depósitos

createDeposit(input: CreateDepositInput): Promise<DepositResult>

claimDeposit(paymentId: string, ctx: ClaimContext): Promise<ClaimResult>

getDepositHealth(): DepositHealthSnapshot



// Saques

createWithdrawal(input: CreateWithdrawalInput): Promise<WithdrawalResult>

processPendingWithdrawals(ctx: ProcessPendingContext): Promise<ProcessResult>

rollbackWithdrawal(input: RollbackInput): Promise<RollbackResult>



// Webhooks

processWebhook(payload: WebhookPayload, ctx: WebhookContext): Promise<WebhookResult>

processTransferWebhook(payload: WebhookPayload, ctx: WebhookContext): Promise<WebhookResult>

authorizeTransferWebhook(payload: WebhookPayload, ctx: WebhookContext): Promise<AuthResult>



// Recovery / Reconcile

recoverPendingPayouts(ctx: RecoveryContext): Promise<RecoveryResult>

reconcileDeposits(ctx: ReconcileContext): Promise<ReconcileResult>



// Observabilidade

health(): EngineHealthSnapshot

config(): PublicConfigSnapshot



// Providers (extensão)

resolvePaymentProvider(): PaymentProvider

resolvePayoutProvider(): PayoutProvider

```



### 2.2 Superfície INTERNAL (package-only)



| API | Motivo |

|-----|--------|

| `createGolDeOuroAdapters()` | Produto específico |

| `createLedgerPortFromAdapter()` | Bridge PE.2B |

| `webhookPayloadFromExpress()` | Runtime Express |

| `resolveAdapterBoundaryPorts()` | Shadow flag |

| `FinanceProviderFactory` internals | Boot, env coupling |

| `payoutCounters` | Runtime metrics |



### 2.3 Superfície PRIVATE (não exportar)



| API | Motivo |

|-----|--------|

| `claimApprovedPixDepositJsFallback` | Implementação GDO |

| `insertLedgerRow` (domain/payout) | Schema GDO |

| `services/pix-mercado-pago` | Legacy |

| Supabase queries inline em finance | Migrar para ports |

| ENV reads espalhados | Centralizar config |



---



## 3. Gap analysis — existente vs ideal



| Capacidade | Existe | Ideal | Gap |

|------------|:------:|:-----:|-----|

| `createDeposit()` | ✅ `deposit.create` | ✅ | Naming only |

| `createWithdrawal()` | ✅ `withdraw.createCompat` | ✅ | Via compat |

| `claimDeposit()` | ✅ `claimAndCredit` | ✅ | Acoplado runtime injetado |

| `processWebhook()` | ✅ | ✅ | Input ainda Express-compat em prod |

| `health()` | ✅ | ✅ | — |

| `recover()` | ✅ `reconcile.asaasPayouts` | ✅ | — |

| `ledger()` | ⚠️ via adapter | Port PUBLIC | Port shadow only |

| `wallet()` | ⚠️ via adapter | Port PUBLIC | Port shadow only |

| `config()` | ⚠️ parcial | PUBLIC snapshot | Disperso em ENV |

| Ports injetáveis | ⚠️ shadow | PUBLIC | **PE_ADAPTER_BOUNDARY_ENABLED=false** |

| WebhookPayload tipado | ⚠️ shadow | PUBLIC | Prod usa Express.Request |



---



## 4. Classificação por domínio



### Depósitos — PUBLIC



- `createPixDeposit`, `createPixDepositCompat`

- `claimApprovedPixDeposit` (INTERNAL até port extraction B8)

- `isPixDepositConfigured`, `getPixDepositHealth`



### Saques — PUBLIC (com ressalva)



- `createPixWithdrawCompat` — PUBLIC

- `processPendingWithdrawals` — **INTERNAL** hoje (domain/payout fora facade boundary)



### Webhooks — PUBLIC



- `processPaymentWebhook`, `processAsaasTransferWebhook`

- `handleAsaasTransferAuthorization`



### Providers — PUBLIC



- `resolvePaymentProvider`, `resolvePayoutProvider`

- `getHealthSnapshot`, `assertBootConfig`



### Schedulers — INTERNAL



- `startSchedulers`, `runMpDepositReconcileCycle`, `runAsaasPayoutRecoveryCycle`



---



## 5. Recomendação PE.2C-PRE



Antes de package C0:



1. Promover **WebhookPayload** a input PUBLIC (substituir Express.Request em contratos PSP).

2. Extrair **claimApprovedPixDeposit** para operar via **WalletPort + LedgerPort + DepositRepository** (B8).

3. Mover **processPendingWithdrawals** para dentro do package ou expor via **WithdrawalPort** único.

4. Reduzir exports de `index.js` — adapters GDO em pacote `@indesconectavel/payment-engine-adapter-goldeouro`.



---



## Referências



- `src/payment-engine/api/PaymentEngine.js`

- `src/payment-engine/index.js`

- `src/finance/contracts/PaymentProvider.js`

- `docs/payment-engine/adapter-boundary/adapter-boundary-map.json`

