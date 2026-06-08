const crypto = require('crypto');

/** @type {import('../../contracts/PayoutProvider').PayoutProvider} */
const MockPayoutProvider = {
  name: 'mock',

  isConfigured() {
    return true;
  },

  async requestPixPayout(input) {
    return {
      success: true,
      data: {
        id: `mock-intent-${crypto.randomBytes(8).toString('hex')}`,
        status: 'in_process',
        status_detail: 'mock',
        external_reference: input.payoutExternalReference,
        sanitized: { mock: true }
      }
    };
  },

  async getPayoutStatus(providerRef) {
    return {
      success: true,
      data: { id: providerRef, status: 'in_process' }
    };
  },

  async handlePayoutWebhook() {
    return { valid: false, error: 'MockPayoutProvider webhook not wired in F4.0E-S1' };
  }
};

module.exports = MockPayoutProvider;
