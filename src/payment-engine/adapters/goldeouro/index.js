'use strict';



const GolDeOuroWalletAdapter = require('./GolDeOuroWalletAdapter');

const { createGolDeOuroLedgerAdapter } = require('./GolDeOuroLedgerAdapter');

const GolDeOuroUserRepository = require('./GolDeOuroUserRepository');

const GolDeOuroWithdrawRepository = require('./GolDeOuroWithdrawRepository');

const GolDeOuroDepositRepository = require('./GolDeOuroDepositRepository');

const GolDeOuroWebhookAdapter = require('./GolDeOuroWebhookAdapter');

const { createGolDeOuroWithdrawalAdapter } = require('./GolDeOuroWithdrawalAdapter');

const { createGolDeOuroDepositClaimAdapter } = require('./GolDeOuroDepositClaimAdapter');

const { createGolDeOuroIdempotencyStore } = require('./GolDeOuroIdempotencyStore');

const { createGolDeOuroWebhookStore } = require('./GolDeOuroWebhookStore');

const { createGolDeOuroPayoutAdapter } = require('./GolDeOuroPayoutAdapter');



/**

 * Factory de adapters Gol de Ouro™ — encapsula schema legado sem alterar comportamento.

 * @param {{ createLedgerEntry: Function, supabase?: object, dryRunStore?: object }} deps

 */

function createGolDeOuroAdapters(deps = {}) {

  const { createLedgerEntry, supabase, dryRunStore } = deps;

  return {

    productId: 'gol-de-ouro',

    wallet: GolDeOuroWalletAdapter,

    ledger: createGolDeOuroLedgerAdapter(createLedgerEntry),

    userRepository: GolDeOuroUserRepository,

    withdrawRepository: GolDeOuroWithdrawRepository,

    depositRepository: GolDeOuroDepositRepository,

    webhookAdapter: GolDeOuroWebhookAdapter,

    withdrawalAdapter: supabase ? createGolDeOuroWithdrawalAdapter({ supabase }) : null,

    depositClaimAdapter:

      supabase && createLedgerEntry

        ? createGolDeOuroDepositClaimAdapter({ supabase, createLedgerEntry })

        : null,

    idempotencyStore: supabase ? createGolDeOuroIdempotencyStore({ supabase }) : null,

    // PE.2H — WebhookStorePort (inerte até PE_WEBHOOK_STORE_PORT_ENABLED=true)

    webhookStore: createGolDeOuroWebhookStore({ backingStore: dryRunStore }),

    // PE.2J — PayoutStorePort + recovery (inerte até PE_PAYOUT_BOUNDARY_ENABLED=true)

    payoutAdapter: createGolDeOuroPayoutAdapter({ supabase, createLedgerEntry })

  };

}



module.exports = {

  createGolDeOuroAdapters,

  GolDeOuroWalletAdapter,

  GolDeOuroUserRepository,

  GolDeOuroWithdrawRepository,

  GolDeOuroDepositRepository,

  GolDeOuroWebhookAdapter,

  createGolDeOuroWithdrawalAdapter,

  createGolDeOuroLedgerAdapter,

  createGolDeOuroDepositClaimAdapter,

  createGolDeOuroIdempotencyStore,

  createGolDeOuroWebhookStore,

  createGolDeOuroPayoutAdapter

};

