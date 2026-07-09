'use strict';

const GolDeOuroWalletAdapter = require('./GolDeOuroWalletAdapter');
const { createGolDeOuroLedgerAdapter } = require('./GolDeOuroLedgerAdapter');
const GolDeOuroUserRepository = require('./GolDeOuroUserRepository');
const GolDeOuroWithdrawRepository = require('./GolDeOuroWithdrawRepository');
const GolDeOuroDepositRepository = require('./GolDeOuroDepositRepository');
const GolDeOuroWebhookAdapter = require('./GolDeOuroWebhookAdapter');
const { createGolDeOuroWithdrawalAdapter } = require('./GolDeOuroWithdrawalAdapter');

/**
 * Factory de adapters Gol de Ouro™ — encapsula schema legado sem alterar comportamento.
 * @param {{ createLedgerEntry: Function, supabase?: object }} deps
 */
function createGolDeOuroAdapters(deps = {}) {
  const { createLedgerEntry, supabase } = deps;
  return {
    productId: 'gol-de-ouro',
    wallet: GolDeOuroWalletAdapter,
    ledger: createGolDeOuroLedgerAdapter(createLedgerEntry),
    userRepository: GolDeOuroUserRepository,
    withdrawRepository: GolDeOuroWithdrawRepository,
    depositRepository: GolDeOuroDepositRepository,
    // PE.2B — shadow adapters (inertes até PE_ADAPTER_BOUNDARY_ENABLED=true)
    webhookAdapter: GolDeOuroWebhookAdapter,
    withdrawalAdapter: supabase ? createGolDeOuroWithdrawalAdapter({ supabase }) : null
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
  createGolDeOuroLedgerAdapter
};
