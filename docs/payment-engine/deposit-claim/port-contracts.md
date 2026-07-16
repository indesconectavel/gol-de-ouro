# PE.2F — Port Contracts (Deposit Claim)



## DepositClaimPort



Arquivo: `src/payment-engine/ports/DepositClaimPort.js`



| Método | Assinatura | Nota |

|--------|------------|------|

| `findByProviderPaymentId` | `(providerPaymentId) => { found, deposit, error? }` | Sem tabelas GDO no retorno |

| `claimApprovedDeposit` | `(DepositClaimInput) => DepositClaimResult` | Claim canônico |

| `markProcessed` | opcional | NOOP no adapter GDO (transição dentro do claim) |

| `markFailed` | opcional | Resultado neutro de falha |



### DepositRecord (neutro)



- `depositId`, `accountId`, `amount`, `status`, `providerPaymentId`, `correlationId`, `metadata`



### DepositClaimResult



- `ok`, `credited`, `idempotent`, `reason?`, `accountId?`, `amount?`, `correlationId?`, `ledgerId?`, `metadata?`



## WalletPort (preservado PE.2B)



Arquivo: `src/payment-engine/ports/WalletPort.js`



Conceitual PE.2F: `credit({ accountId, amount, correlationId, metadata })`



Assinatura PE.2B preservada: `credit(accountId, amount, meta)` com `meta.correlationId`.



## LedgerPort (preservado PE.2B)



Arquivo: `src/payment-engine/ports/LedgerPort.js`



Conceitual PE.2F: `record({ accountId, type, amount, correlationId, metadata })`



Assinatura PE.2B preservada: `append(entry)` ≡ `record`.



## Input neutro



Arquivo: `src/payment-engine/types/DepositClaimInput.js`



Proibido receber: row Supabase, `req`, `pagamento_pix`, objeto bruto Mercado Pago/Asaas, cliente DB.



## Adapter GDO



`createGolDeOuroDepositClaimAdapter({ supabase, createLedgerEntry, log })`



- Conhece Supabase e schema GDO

- Delega ao legado `claimApprovedPixDeposit` (equivalência)

- Sanitiza logs

- Expõe `findByProviderPaymentId` com mapeamento neutro



## Core



`claimApprovedDeposit(input, { depositClaim })` — só ports  

`claimApprovedDepositOrchestrated(input, { depositClaim, wallet, ledger })` — fakes/shadow

