'use strict';

const { isAdapterBoundaryEnabled, FLAG_NAME, DEFAULT_VALUE } = require('./adapter-boundary-config');
const { createLedgerPortFromAdapter } = require('../compat/ledgerPortBridge');
const { createWalletPortFromAdapter } = require('../compat/walletPortBridge');
const { createGolDeOuroWithdrawalAdapter } = require('../adapters/goldeouro/GolDeOuroWithdrawalAdapter');
const GolDeOuroWebhookAdapter = require('../adapters/goldeouro/GolDeOuroWebhookAdapter');

/**
 * PE.2B — resolver shadow de ports. Retorna null quando boundary desligado.
 *
 * @param {object} deps
 * @param {object} deps.supabase
 * @param {import('../interfaces/LedgerAdapter').LedgerAdapter} [deps.ledgerAdapter]
 * @param {import('../interfaces/WalletAdapter').WalletAdapter} [deps.walletAdapter]
 */
function resolveAdapterBoundaryPorts(deps = {}) {
  if (!isAdapterBoundaryEnabled()) {
    return null;
  }

  const { supabase, ledgerAdapter, walletAdapter } = deps;

  return {
    ledger: ledgerAdapter ? createLedgerPortFromAdapter(ledgerAdapter, { supabase }) : null,
    wallet: walletAdapter ? createWalletPortFromAdapter(walletAdapter, { supabase }) : null,
    withdrawal: createGolDeOuroWithdrawalAdapter({ supabase }),
    webhook: GolDeOuroWebhookAdapter
  };
}

module.exports = {
  isAdapterBoundaryEnabled,
  FLAG_NAME,
  DEFAULT_VALUE,
  resolveAdapterBoundaryPorts
};
