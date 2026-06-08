/** @type {import('../../contracts/PaymentProvider').PaymentProvider} */
const MockPaymentProvider = {
  name: 'mock',

  isConfigured() {
    return true;
  },

  async createPixDeposit() {
    return {
      success: true,
      providerRef: 'mock-payment-id',
      qrCode: 'mock-qr',
      copyPaste: '00020126580014br.gov.bcb.pix0136mock',
      status: 'pending'
    };
  },

  async getPixDepositStatus() {
    return { success: true, status: 'pending' };
  },

  async handleDepositWebhook() {
    return { valid: false, error: 'MockPaymentProvider webhook not wired in F4.0E-S1' };
  }
};

module.exports = MockPaymentProvider;
