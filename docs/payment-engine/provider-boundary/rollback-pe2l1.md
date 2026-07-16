# PE.2L.1 — Rollback



## Política



1. Manter `PE_PROVIDER_BOUNDARY_ENABLED=false` (ou ausente).

2. Reverter **apenas** o commit PE.2L.1 se necessário.

3. Preservar PE.2L (`ProviderResolver`, ports, adapters, flag config).

4. Preservar `FinanceProviderFactory` e Mercado Pago.

5. Não alterar banco / schema / secrets / runtime / produção / staging.



## Arquivos PE.2L.1 (revertíveis)



### Modificados



- `src/payment-engine/providers/ProviderResolver.js` (metadata helpers)

- `src/payment-engine/providers/index.js` (exports)

- `src/payment-engine/api/PaymentEngine.js` (`resolution` / `pe2l.resolution`)

- `scripts/pe2l-provider-boundary-smoke.mjs`

- `scripts/verify-pe2l-provider-boundary.mjs`



### Criados (docs)



- `docs/relatorios/PE.2L.1-PROVIDER-FALLBACK-SEMANTICS.md`

- `docs/relatorios/snapshots/pe2l1-provider-fallback-semantics.json`

- `docs/payment-engine/provider-boundary/fallback-semantics.json`

- `docs/payment-engine/provider-boundary/provider-resolution-contract.md`

- `docs/payment-engine/provider-boundary/fallback-matrix.json`

- `docs/payment-engine/provider-boundary/smoke-failure-analysis.json`

- `docs/payment-engine/provider-boundary/compatibility-check.json`

- `docs/payment-engine/provider-boundary/no-production-impact.json`

- `docs/payment-engine/provider-boundary/rollback-pe2l1.md`



## Pós-rollback



- Fallback produtivo Asaas→MP permanece o homologado em PE.2L / factory.

- Smoke volta à asserção ampla (pode falhar de novo no comentário do adapter) — esperado se só PE.2L.1 for revertido sem manter o fix do regex.

