'use strict';

const CelcoinProvider = require('./CelcoinProvider');

/**
 * Adapter Celcoin → contrato PayoutProvider (F4.0E-S1).
 * Produção continua em Mercado Pago até PAYOUT_PROVIDER=celcoin + CELCOIN_ENABLED=true.
 */
const CelcoinPayoutProvider = {
  name: 'celcoin',

  isConfigured() {
    return CelcoinProvider.isConfigured();
  },

  async requestPixPayout(input) {
    return CelcoinProvider.createPixWithdraw({
      netAmount: input.netAmount,
      pixKey: input.pixKey,
      pixType: input.pixType,
      userId: input.userId,
      saqueId: input.saqueId,
      correlationId: input.correlationId,
      payoutExternalReference: input.payoutExternalReference,
      idempotencyKey: input.idempotencyKey,
      notificationUrl: input.notificationUrl,
      ownerIdentification: input.ownerIdentification
    });
  },

  async getPayoutStatus(providerRef) {
    const result = await CelcoinProvider.getTransactionStatus(providerRef, { kind: 'payout' });
    if (!result.success) {
      return { success: false, error: result.error || result.message };
    }
    return { success: true, data: result.data };
  },

  async handlePayoutWebhook(req) {
    const validation = CelcoinProvider.validateWebhook(req);
    if (!validation.valid) {
      return validation;
    }
    return CelcoinProvider.handleWebhook(req);
  }
};

module.exports = CelcoinPayoutProvider;
