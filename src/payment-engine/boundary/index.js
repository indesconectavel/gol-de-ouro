'use strict';



const { isAdapterBoundaryEnabled, FLAG_NAME, DEFAULT_VALUE } = require('./adapter-boundary-config');

const {

  isDepositClaimPortEnabled,

  FLAG_NAME: DEPOSIT_CLAIM_FLAG_NAME,

  DEFAULT_VALUE: DEPOSIT_CLAIM_DEFAULT_VALUE

} = require('./deposit-claim-port-config');

const {

  isIdempotencyPortEnabled,

  FLAG_NAME: IDEMPOTENCY_FLAG_NAME,

  DEFAULT_VALUE: IDEMPOTENCY_DEFAULT_VALUE

} = require('./idempotency-port-config');

const {

  isWebhookStorePortEnabled,

  FLAG_NAME: WEBHOOK_STORE_FLAG_NAME,

  DEFAULT_VALUE: WEBHOOK_STORE_DEFAULT_VALUE

} = require('./webhook-store-port-config');

const {

  isPayoutBoundaryEnabled,

  FLAG_NAME: PAYOUT_BOUNDARY_FLAG_NAME,

  DEFAULT_VALUE: PAYOUT_BOUNDARY_DEFAULT_VALUE

} = require('./payout-boundary-config');

const { createLedgerPortFromAdapter } = require('../compat/ledgerPortBridge');

const { createWalletPortFromAdapter } = require('../compat/walletPortBridge');

const { createGolDeOuroWithdrawalAdapter } = require('../adapters/goldeouro/GolDeOuroWithdrawalAdapter');

const { createGolDeOuroDepositClaimAdapter } = require('../adapters/goldeouro/GolDeOuroDepositClaimAdapter');

const { createGolDeOuroIdempotencyStore } = require('../adapters/goldeouro/GolDeOuroIdempotencyStore');

const { createGolDeOuroWebhookStore } = require('../adapters/goldeouro/GolDeOuroWebhookStore');

const { createGolDeOuroPayoutAdapter } = require('../adapters/goldeouro/GolDeOuroPayoutAdapter');

const GolDeOuroWebhookAdapter = require('../adapters/goldeouro/GolDeOuroWebhookAdapter');



/**

 * PE.2B — resolver shadow de ports. Retorna null quando boundary desligado.

 *

 * @param {object} deps

 * @param {object} deps.supabase

 * @param {import('../interfaces/LedgerAdapter').LedgerAdapter} [deps.ledgerAdapter]

 * @param {import('../interfaces/WalletAdapter').WalletAdapter} [deps.walletAdapter]

 * @param {Function} [deps.createLedgerEntry]

 */

function resolveAdapterBoundaryPorts(deps = {}) {

  if (!isAdapterBoundaryEnabled()) {

    return null;

  }



  const { supabase, ledgerAdapter, walletAdapter, createLedgerEntry } = deps;



  return {

    ledger: ledgerAdapter ? createLedgerPortFromAdapter(ledgerAdapter, { supabase }) : null,

    wallet: walletAdapter ? createWalletPortFromAdapter(walletAdapter, { supabase }) : null,

    withdrawal: createGolDeOuroWithdrawalAdapter({ supabase }),

    webhook: GolDeOuroWebhookAdapter,

    // PE.2F — disponível no boundary shadow, mas mutação claim só com PE_DEPOSIT_CLAIM_PORT_ENABLED

    depositClaim:

      supabase && createLedgerEntry

        ? createGolDeOuroDepositClaimAdapter({ supabase, createLedgerEntry })

        : null

  };

}



/**

 * PE.2F — resolve DepositClaimPort quando flag específica ligada.

 * Independente de PE_ADAPTER_BOUNDARY_ENABLED (claim financeiro isolado).

 */

function resolveDepositClaimPort(deps = {}) {

  if (!isDepositClaimPortEnabled()) {

    return null;

  }

  const { supabase, createLedgerEntry, log } = deps;

  if (!supabase || typeof createLedgerEntry !== 'function') {

    return null;

  }

  return createGolDeOuroDepositClaimAdapter({ supabase, createLedgerEntry, log });

}



/**

 * PE.2G — resolve IdempotencyStore quando flag específica ligada.

 */

function resolveIdempotencyStore(deps = {}) {

  if (!isIdempotencyPortEnabled()) {

    return null;

  }

  if (deps.idempotencyStore) return deps.idempotencyStore;

  const { supabase } = deps;

  if (!supabase) return null;

  return createGolDeOuroIdempotencyStore({ supabase });

}



/**

 * PE.2H — resolve WebhookStorePort quando flag específica ligada.

 */

function resolveWebhookStore(deps = {}) {

  if (!isWebhookStorePortEnabled()) {

    return null;

  }

  if (deps.webhookStore) return deps.webhookStore;

  return createGolDeOuroWebhookStore({ backingStore: deps.dryRunStore });

}



/**

 * PE.2J — resolve PayoutStorePort (+ recovery) quando flag específica ligada.

 */

function resolvePayoutStore(deps = {}) {

  if (!isPayoutBoundaryEnabled()) {

    return null;

  }

  if (deps.payoutStore) return deps.payoutStore;

  return createGolDeOuroPayoutAdapter(deps);

}



module.exports = {

  isAdapterBoundaryEnabled,

  FLAG_NAME,

  DEFAULT_VALUE,

  resolveAdapterBoundaryPorts,

  isDepositClaimPortEnabled,

  DEPOSIT_CLAIM_FLAG_NAME,

  DEPOSIT_CLAIM_DEFAULT_VALUE,

  resolveDepositClaimPort,

  isIdempotencyPortEnabled,

  IDEMPOTENCY_FLAG_NAME,

  IDEMPOTENCY_DEFAULT_VALUE,

  resolveIdempotencyStore,

  isWebhookStorePortEnabled,

  WEBHOOK_STORE_FLAG_NAME,

  WEBHOOK_STORE_DEFAULT_VALUE,

  resolveWebhookStore,

  isPayoutBoundaryEnabled,

  PAYOUT_BOUNDARY_FLAG_NAME,

  PAYOUT_BOUNDARY_DEFAULT_VALUE,

  resolvePayoutStore,

  isRuntimeBoundaryEnabled: require('./runtime-boundary-config').isRuntimeBoundaryEnabled,

  RUNTIME_BOUNDARY_FLAG_NAME: require('./runtime-boundary-config').FLAG_NAME,

  RUNTIME_BOUNDARY_DEFAULT_VALUE: require('./runtime-boundary-config').DEFAULT_VALUE,

  isProviderBoundaryEnabled: require('./provider-boundary-config').isProviderBoundaryEnabled,

  PROVIDER_BOUNDARY_FLAG_NAME: require('./provider-boundary-config').FLAG_NAME,

  PROVIDER_BOUNDARY_DEFAULT_VALUE: require('./provider-boundary-config').DEFAULT_VALUE,

  // PE.2I

  resolveFinanceSurface: require('./resolveFinanceSurface').resolveFinanceSurface,

  getFinanceSurface: require('./resolveFinanceSurface').getFinanceSurface,

  isCoreFinanceBoundaryEnabled: require('./resolveFinanceSurface').isCoreFinanceBoundaryEnabled,

  CORE_FINANCE_FLAG_NAME: require('./resolveFinanceSurface').FLAG_NAME,

  CORE_FINANCE_DEFAULT_VALUE: require('./resolveFinanceSurface').DEFAULT_VALUE

};

