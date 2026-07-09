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
  },
  // PE.2B — adapter boundary (shadow; default PE_ADAPTER_BOUNDARY_ENABLED=false)
  boundary: require('./boundary'),
  ports: {
    LedgerPort: require('./ports/LedgerPort'),
    WalletPort: require('./ports/WalletPort'),
    WithdrawalPort: require('./ports/WithdrawalPort')
  },
  types: {
    WebhookPayload: require('./types/WebhookPayload')
  },
  compat: {
    webhookPayloadFromExpress: require('./compat/webhookPayloadFromExpress'),
    withdrawalIdAlias: require('./compat/withdrawalIdAlias'),
    ledgerPortBridge: require('./compat/ledgerPortBridge'),
    walletPortBridge: require('./compat/walletPortBridge')
  }
};
