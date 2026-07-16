'use strict';



const PaymentEngine = require('./api/PaymentEngine');



module.exports = {

  PaymentEngine,

  // Re-exports para integração gradual

  core: {

    deposit: require('./core/deposit'),

    withdraw: require('./core/withdraw'),

    payout: require('./core/payout'),

    webhooks: require('./core/webhooks'),

    reconciliation: require('./core/reconciliation'),

    idempotency: require('./core/idempotency'),

    webhookStore: require('./core/webhookStore')

  },

  adapters: {

    goldeouro: require('./adapters/goldeouro'),

    psp: require('./adapters/psp')

  },

  scheduler: require('./scheduler'),

  runtime: {

    RuntimeBoundary: require('./runtime/RuntimeBoundary')

  },

  config: require('./config'),

  providers: require('./providers'),

  interfaces: {

    WalletAdapter: require('./interfaces/WalletAdapter'),

    LedgerAdapter: require('./interfaces/LedgerAdapter'),

    UserRepository: require('./interfaces/UserRepository'),

    WithdrawRepository: require('./interfaces/WithdrawRepository'),

    DepositRepository: require('./interfaces/DepositRepository')

  },

  // PE.2B / PE.2E — adapter boundary + webhook payload

  boundary: require('./boundary'),

  bridges: {

    http: {

      GdoWebhookHttpBridge: require('./bridges/http/GdoWebhookHttpBridge')

    }

  },

  ports: {

    LedgerPort: require('./ports/LedgerPort'),

    WalletPort: require('./ports/WalletPort'),

    WithdrawalPort: require('./ports/WithdrawalPort'),

    DepositClaimPort: require('./ports/DepositClaimPort'),

    IdempotencyStore: require('./ports/IdempotencyStore'),

    WebhookStorePort: require('./ports/WebhookStorePort'),

    PayoutStorePort: require('./ports/PayoutStorePort'),

    PayoutRecoveryPort: require('./ports/PayoutRecoveryPort'),

    PaymentProviderPort: require('./ports/PaymentProviderPort'),

    TransferProviderPort: require('./ports/TransferProviderPort')

  },

  types: {

    WebhookPayload: require('./types/WebhookPayload'),

    DepositClaimInput: require('./types/DepositClaimInput'),

    IdempotencyKey: require('./types/IdempotencyKey'),

    WebhookStoreRecord: require('./types/WebhookStoreRecord'),

    PayoutProcessInput: require('./types/PayoutProcessInput')

  },

  compat: {

    webhookPayloadFromExpress: require('./compat/webhookPayloadFromExpress'),

    withdrawalIdAlias: require('./compat/withdrawalIdAlias'),

    ledgerPortBridge: require('./compat/ledgerPortBridge'),

    walletPortBridge: require('./compat/walletPortBridge'),

    depositClaimPortBridge: require('./compat/depositClaimPortBridge'),

    idempotencyPortBridge: require('./compat/idempotencyPortBridge'),

    webhookStorePortBridge: require('./compat/webhookStorePortBridge'),

    financeLegacySurface: require('./compat/financeLegacySurface'),

    payoutBoundaryBridge: require('./compat/payoutBoundaryBridge')

  }

};

