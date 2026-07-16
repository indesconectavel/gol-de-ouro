# Rollback Plan — PE.2K

## Instantâneo

```bash
unset PE_RUNTIME_BOUNDARY_ENABLED
# ou
export PE_RUNTIME_BOUNDARY_ENABLED=false
```

RuntimeBoundary chama domain/finance diretamente — idêntico pré-ativação.

## Remoção estrutural (se necessário)

1. Reverter requires de worker/admin/server-fly/scheduler para imports diretos domain/finance.
2. Remover `runtime/RuntimeBoundary.js` e `runtime-boundary-config.js`.
3. Remover métodos admin do PaymentEngine se indesejados.

## Não fazer

- Não redeploy só por flag
- Não alterar domain/payout no rollback

## Verificação

```bash
node scripts/pe2k-runtime-boundary-smoke.mjs
node scripts/verify-pe2k-runtime-boundary.mjs
```
