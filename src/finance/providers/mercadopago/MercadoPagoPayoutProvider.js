const mp = require('../../../../services/pix-mercado-pago');

/** @type {import('../../contracts/PayoutProvider').PayoutProvider} */
const MercadoPagoPayoutProvider = {
  name: 'mercadopago',

  isConfigured() {
    return mp.isConfigured();
  },

  async requestPixPayout(input) {
    return mp.createPixWithdraw(
      input.netAmount,
      input.pixKey,
      input.pixType,
      input.userId,
      input.saqueId,
      input.correlationId,
      {
        payoutExternalReference: input.payoutExternalReference,
        idempotencyKey: input.idempotencyKey,
        notificationUrl: input.notificationUrl,
        ownerIdentification: input.ownerIdentification
      }
    );
  },

  async getPayoutStatus(providerRef) {
    return mp.getTransactionIntent(providerRef);
  },

  async handlePayoutWebhook() {
    throw new Error('handlePayoutWebhook not wired in F4.0E-S1');
  }
};

module.exports = MercadoPagoPayoutProvider;
