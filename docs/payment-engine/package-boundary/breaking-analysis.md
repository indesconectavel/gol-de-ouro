# Breaking Changes Analysis — Package Extraction PE.2C



**Gate:** PE.2C-PRE  

**Data:** 2026-07-11  

**Modo:** READ-ONLY ABSOLUTO  

**Cenário:** mover `src/finance/` + `src/payment-engine/` para package `@indesconectavel/payment-engine` sem alteração de comportamento.



---



## 1. Resumo executivo



| Pergunta | Resposta |

|----------|----------|

| Move físico quebra produção imediatamente? | **SIM** — se paths e bridges não forem atualizados |

| Move com bridges compat (re-exports) preserva prod? | **SIM COM RESSALVAS** — exige atualizar ~80+ scripts + server-fly + worker |

| Comportamento financeiro alterado? | **NÃO** — se delegação preservada |

| Deploy staging PE.2B necessário antes? | **SIM** — gate operacional pendente |



---



## 2. O que quebrará



### 2.1 Imports por path relativo (CRÍTICO)



| Consumidor | Padrão atual | Impacto |

|------------|--------------|---------|

| `server-fly.js` | `./src/payment-engine`, `./src/finance/*` | Boot failure |

| `src/workers/payout-worker.js` | `../finance/*`, `../domain/payout/*` | Worker OFF |

| `scripts/verify-*.mjs` (~40 scripts) | `../src/finance/*` | CI/certificação quebrada |

| `scripts/p19-certification.cjs` | finance paths | P1.9 runner |

| `controllers/adminWithdrawController.js` | `../src/domain/payout/*` | Admin saques |



**Mitigação:** re-exports na raiz monorepo (`src/finance` → proxy) ou workspace npm com paths mapping.



---



### 2.2 Dual entry points (ALTO)



Hoje existem **três caminhos** para payout:



```text

1. PaymentEngine.withdraw.processPending → core/withdraw → domain/payout

2. server-fly.runProcessPendingWithdrawals → domain/payout DIRECT

3. payout-worker → domain/payout DIRECT

```



Mover apenas `payment-engine` + `finance` **sem** `domain/payout` quebra caminhos 2 e 3.



**Mitigação:** incluir `domain/payout` no package **ou** forçar todos os consumidores via PaymentEngine (breaking API interna).



---



### 2.3 Legacy Mercado Pago service (ALTO)



`src/finance/providers/mercadopago/MercadoPagoPayoutProvider.js` importa `services/pix-mercado-pago.js` (fora do package candidato).



**Mitigação:** mover service para adapter MP dentro do package **ou** injetar via factory DI.



---



### 2.4 Schema Supabase GDO no Core (CRÍTICO)



Arquivos Core com queries hardcoded:



| Arquivo | Tabelas |

|---------|---------|

| `finance/deposit/claimApprovedPixDeposit.js` | `pagamentos_pix`, `ledger_financeiro` |

| `finance/webhooks/paymentWebhookIdempotency.js` | `pagamentos_pix` |

| `finance/webhooks/processAsaasTransferWebhook.js` | `saques`, `ledger_financeiro` |

| `domain/payout/processPendingWithdrawals.js` | **32 queries** GDO |



Mover para package isolado **expõe** acoplamento — segundo produto não funciona sem adapters.



**Mitigação:** extrair persistência para ports (B8, B10) **antes** do move.



---



### 2.5 ENV e config global (MÉDIO)



`FinanceProviderFactory`, `primary-psp.js`, `asaas-pix-out-config.js` leem `process.env` diretamente.



Package npm em outro repo **quebra** se ENV names divergirem.



**Mitigação:** `PaymentEngine.configure({ env, flags })` centralizado.



---



### 2.6 Schedulers e axios (MÉDIO)



`payment-engine/scheduler/mpDepositReconcile.js` usa `axios` + `GolDeOuroDepositRepository`.



Move exige peerDependency axios e adapter injectable.



---



### 2.7 Shadow boundary flag (BAIXO)



`PE_ADAPTER_BOUNDARY_ENABLED` — paths relativos em `adapter-boundary-config.js` inalterados se package root mudar.



---



## 3. O que continuará funcionando



| Superfície | Condição |

|------------|----------|

| HTTP routes `/api/*` pix | Se server-fly re-exporta PaymentEngine |

| Webhooks MP/Asaas | Se finance paths resolvidos |

| `PaymentEngine.health()` | Se factory boot OK |

| Certificação P1.9 lógica | Se scripts apontam novo path |

| Adapters GolDeOuro | Permanecem produto-side |

| Staging/prod runtime | **Inalterado** se nenhum deploy — apenas análise |

| PSP factory multi-PSP | Lógica intacta |

| Recovery Job | Intacto em finance/reconciliation |



---



## 4. O que precisa de façade



| Componente | Façade necessária |

|------------|-------------------|

| `server-fly.js` | Thin runtime shell — só HTTP + DI |

| `payout-worker.js` | Chamar `PaymentEngine.withdraw.processPending` |

| `adminWithdrawController` | Idem ou WithdrawalPort |

| `scripts/*` | Import `@indesconectavel/payment-engine` |

| ENV/config | `createPaymentEngine({ config })` |



---



## 5. O que precisa de bridge



| Bridge | De → Para | Gate |

|--------|-----------|------|

| `webhookPayloadFromExpress` | Express.Request → WebhookPayload | PE.2E |

| `ledgerPortBridge` | LedgerAdapter → LedgerPort | PE.2B shadow |

| `walletPortBridge` | WalletAdapter → WalletPort | PE.2B shadow |

| `withdrawalIdAlias` | saqueId ↔ withdrawalId | PE.2B shadow |

| **Path re-export bridge** | `src/finance` → package | PE.2C |

| **MP legacy bridge** | services/pix-mercado-pago → MP adapter | PE.2C |

| **domain/payout bridge** | processPendingWithdrawals → WithdrawalPort | PE.2C-D |



---



## 6. Sequência recomendada (não autorizada neste gate)



```text

PE.2B.2 deploy PASS

  → PE.2E (Express → WebhookPayload prod)

  → B8 claim via ports

  → B7 eliminar core→finance thin wrappers (internalizar)

  → Unificar entry points (worker → facade)

  → PE.2C move físico + re-exports

  → PE.2C-D repo/workspace split

```



---



## 7. Matriz breaking × severidade



| Mudança | Severidade | Reversível | Rollback |

|---------|:----------:|:----------:|----------|

| Path move sem proxy | CRÍTICO | SIM | git revert |

| Worker sem facade | CRÍTICO | SIM | revert import |

| Schema port extraction | ALTO | PARCIAL | feature flag |

| MP service decouple | ALTO | SIM | adapter inline |

| npm peerDeps | MÉDIO | SIM | monorepo workspace |

| Shadow flag paths | BAIXO | SIM | env |



---



## Referências



- `dependency-graph.json`

- `docs/payment-engine/adapter-boundary/risk-register.json`

- `server-fly.js` L21–29, L200, L3800

