# Rollback Plan — PE.2J



## Instantâneo (runtime)



```bash

unset PE_PAYOUT_BOUNDARY_ENABLED

# ou

export PE_PAYOUT_BOUNDARY_ENABLED=false

```



Bridge chama `domain/payout` diretamente — comportamento pré-PE.2J.



## Remoção de código (se necessário)



1. Reverter `PaymentEngine.withdraw` / scheduler para `financeLegacySurface`.

2. Remover `payoutBoundaryBridge`, `GolDeOuroPayoutAdapter`, `core/payout`, ports Payout*, flag config.

3. Restaurar `core/withdraw.js` PE.2I (financeLegacySurface re-export).



## Não fazer



- Não alterar `domain/payout`

- Não mexer no worker em rollback de emergência

- Não deploy só por esta flag



## Verificação



```bash

node scripts/pe2j-payout-boundary-smoke.mjs

node scripts/verify-pe2j-payout-boundary.mjs

```

