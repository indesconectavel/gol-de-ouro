'use strict';

const PaymentEngine = require('./api/PaymentEngine');

module.exports = {
  PaymentEngine,
  // Re-exports para integração gradual
  core: {
    deposit: require('./core/deposit'),
    withdraw: require('./core/withdraw'),
    webhooks: require('./core/webhooks'),
    reconciliation: require('./core/reconciliation')
  },
  adapters: {
    goldeouro: require('./adapters/goldeouro')
  },
  scheduler: require('./scheduler'),
  config: require('./config'),
  providers: require('./providers'),
  interfaces: {
    WalletAdapter: require('./interfaces/WalletAdapter'),
    LedgerAdapter: require('./interfaces/LedgerAdapter'),
    UserRepository: require('./interfaces/UserRepository'),
    WithdrawRepository: require('./interfaces/WithdrawRepository'),
    DepositRepository: require('./interfaces/DepositRepository')
  }
};
