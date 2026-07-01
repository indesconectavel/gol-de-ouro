'use strict';

const GolDeOuroWalletAdapter = require('./GolDeOuroWalletAdapter');
const { createGolDeOuroLedgerAdapter } = require('./GolDeOuroLedgerAdapter');
const GolDeOuroUserRepository = require('./GolDeOuroUserRepository');
const GolDeOuroWithdrawRepository = require('./GolDeOuroWithdrawRepository');
const GolDeOuroDepositRepository = require('./GolDeOuroDepositRepository');

/**
 * Factory de adapters Gol de Ouro™ — encapsula schema legado sem alterar comportamento.
 * @param {{ createLedgerEntry: Function }} deps
 */
function createGolDeOuroAdapters(deps = {}) {
  const { createLedgerEntry } = deps;
  return {
    productId: 'gol-de-ouro',
    wallet: GolDeOuroWalletAdapter,
    ledger: createGolDeOuroLedgerAdapter(createLedgerEntry),
    userRepository: GolDeOuroUserRepository,
    withdrawRepository: GolDeOuroWithdrawRepository,
    depositRepository: GolDeOuroDepositRepository
  };
}

module.exports = {
  createGolDeOuroAdapters,
  GolDeOuroWalletAdapter,
  GolDeOuroUserRepository,
  GolDeOuroWithdrawRepository,
  GolDeOuroDepositRepository,
  createGolDeOuroLedgerAdapter
};
