# PE.2H — Rollback Plan



1. Manter `PE_WEBHOOK_STORE_PORT_ENABLED=false` (ou ausente).

2. Reverter commit PE.2H se necessário.

3. Preservar `paymentWebhookDryRunStore.js` legado.

4. Não alterar banco / schema / secrets / runtime / produção.



## Arquivos criados



- `src/payment-engine/ports/WebhookStorePort.js`

- `src/payment-engine/types/WebhookStoreRecord.js`

- `src/payment-engine/core/webhookStore.js`

- `src/payment-engine/boundary/webhook-store-port-config.js`

- `src/payment-engine/adapters/goldeouro/GolDeOuroWebhookStore.js`

- `src/payment-engine/adapters/memory/InMemoryWebhookStore.js`

- `src/payment-engine/compat/webhookStorePortBridge.js`

- `scripts/pe2h-webhook-store-smoke.mjs`

- `scripts/verify-pe2h-webhook-store-port.mjs`

- `docs/payment-engine/webhook-store/*`

- `docs/relatorios/PE.2H-WEBHOOK-PERSISTENCE-STORE-EXTRACTION.md`

- `docs/relatorios/snapshots/pe2h-webhook-store-extraction.json`



## Arquivos modificados



- `src/finance/webhooks/processPaymentWebhook.js` (compat dry-run)

- `src/payment-engine/adapters/goldeouro/GolDeOuroWebhookAdapter.js`

- `src/payment-engine/adapters/goldeouro/index.js`

- `src/payment-engine/boundary/index.js`

- `src/payment-engine/index.js`

- `docs/payment-engine/package-boundary/package-readiness.json`

