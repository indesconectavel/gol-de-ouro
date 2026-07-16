# Rollback Plan — PE.2L



## Instantâneo



```bash

unset PE_PROVIDER_BOUNDARY_ENABLED

# ou

export PE_PROVIDER_BOUNDARY_ENABLED=false

```



ProviderResolver delega 100% à FinanceProviderFactory.



## Remoção estrutural



1. Reverter `providers/index.js` para require direto da factory (pré-PE.2L).

2. Remover `ProviderResolver`, `adapters/psp`, ports PE.2L, flag config.



## Verificação



```bash

node scripts/pe2l-provider-boundary-smoke.mjs

node scripts/verify-pe2l-provider-boundary.mjs

```

