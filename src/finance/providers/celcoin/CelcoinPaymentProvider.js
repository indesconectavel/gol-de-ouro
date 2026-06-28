'use strict';

const CelcoinProvider = require('./CelcoinProvider');

/**
 * Adapter Celcoin → contrato PaymentProvider (PIX IN).
 * Não wired na factory até PIX_IN_PROVIDER=celcoin (fase futura).
 */
const CelcoinPaymentProvider = {
  name: 'celcoin',

  isConfigured() {
    return CelcoinProvider.isConfigured();
  },

  async createPixDeposit(input) {
    return CelcoinProvider.createPixDeposit(input);
  },

  async getPixDepositStatus(providerRef) {
    const result = await CelcoinProvider.getTransactionStatus(providerRef, { kind: 'deposit' });
    if (!result.success) {
      return { success: false, error: result.error || result.message };
    }
    return {
      success: true,
      status: result.data?.status,
      statusDetail: result.data?.statusDetail,
      amount: result.data?.amount
    };
  },

  async handleDepositWebhook(req) {
    const validation = CelcoinProvider.validateWebhook(req);
    if (!validation.valid) {
      return validation;
    }
    return CelcoinProvider.handleWebhook(req);
  }
};

module.exports = CelcoinPaymentProvider;
