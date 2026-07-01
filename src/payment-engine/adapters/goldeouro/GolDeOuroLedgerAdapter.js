'use strict';

/** @implements {import('../../interfaces/LedgerAdapter').LedgerAdapter} */
function createGolDeOuroLedgerAdapter(createLedgerEntryFn) {
  return {
    productId: 'gol-de-ouro',
    tableName: 'ledger_financeiro',

    async createEntry(input) {
      return createLedgerEntryFn(input);
    }
  };
}

module.exports = { createGolDeOuroLedgerAdapter };
