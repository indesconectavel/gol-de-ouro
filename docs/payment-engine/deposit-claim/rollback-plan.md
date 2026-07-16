# PE.2F — Rollback Plan



## Princípio



Produção nunca deve ter `PE_DEPOSIT_CLAIM_PORT_ENABLED=true`. Rollback não exige mudança de banco/schema/secrets além de garantir flag false.



## Passos (ordem)



1. **Flag** — garantir `PE_DEPOSIT_CLAIM_PORT_ENABLED=false` (ou ausente) em todos os ambientes.

2. **Código** — reverter o commit PE.2F (ou remover arquivos listados abaixo) se necessário.

3. **Legado** — `src/finance/deposit/claimApprovedPixDeposit.js` permanece; não foi alterado neste gate.

4. **Não alterar** — banco, schema, RLS, secrets Fly (exceto unset da flag se setada), runtime prod.



## Arquivos criados (removíveis no rollback de código)



| Arquivo |

|---------|

| `src/payment-engine/ports/DepositClaimPort.js` |

| `src/payment-engine/types/DepositClaimInput.js` |

| `src/payment-engine/core/claimApprovedDeposit.js` |

| `src/payment-engine/adapters/goldeouro/GolDeOuroDepositClaimAdapter.js` |

| `src/payment-engine/adapters/memory/InMemoryDepositClaimPorts.js` |

| `src/payment-engine/compat/depositClaimPortBridge.js` |

| `src/payment-engine/boundary/deposit-claim-port-config.js` |

| `scripts/pe2f-claim-deposit-port-smoke.mjs` |

| `scripts/verify-pe2f-deposit-claim-port.mjs` |

| `docs/payment-engine/deposit-claim/*` |

| `docs/relatorios/PE.2F-CLAIM-DEPOSIT-PORT-EXTRACTION.md` |

| `docs/relatorios/snapshots/pe2f-claim-deposit-port-extraction.json` |



## Arquivos modificados (restaurar via git)



| Arquivo |

|---------|

| `src/payment-engine/core/deposit.js` |

| `src/payment-engine/api/PaymentEngine.js` |

| `src/payment-engine/adapters/goldeouro/index.js` |

| `src/payment-engine/boundary/index.js` |

| `src/payment-engine/index.js` |

| `src/payment-engine/ports/WalletPort.js` |

| `src/payment-engine/ports/LedgerPort.js` |



## Verificação pós-rollback



```bash

# Flag false

node -e "delete process.env.PE_DEPOSIT_CLAIM_PORT_ENABLED; console.log(require('./src/payment-engine/boundary/deposit-claim-port-config').isDepositClaimPortEnabled())"

# → false



node scripts/verify-asaas-deposit-claim-fallback.mjs

```



## Rollback primário (sem revert de código)



```text

PE_DEPOSIT_CLAIM_PORT_ENABLED=false

```



Com flag false, `claimApprovedPixDepositCompat` chama o legado diretamente.

