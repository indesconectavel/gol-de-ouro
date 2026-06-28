'use strict';

const MercadoPagoPaymentProvider = require('../providers/mercadopago/MercadoPagoPaymentProvider');
const { createPixDeposit, getPixDepositHealth } = require('../deposit/createPixDeposit');
const { assertBootConfig } = require('../factory/FinanceProviderFactory');

assertBootConfig();

/**
 * Ponte monólito → Payment Engine PIX IN (F4.4).
 * Preserva contrato de resposta para persistência e frontend.
 *
 * @param {object} input
 * @param {number} input.amount
 * @param {string} input.userId
 * @param {string} input.userEmail
 * @param {string} [input.userName]
 * @param {string} [input.payerCpf]
 * @param {string} input.idempotencyKey
 * @param {string} input.externalReference
 * @param {string} input.notificationUrl
 * @param {string} [input.description]
 * @param {boolean} [input.mercadoPagoConnected]
 */
async function createPixDepositCompat(input = {}) {
  const result = await createPixDeposit({
    amount: input.amount,
    userId: input.userId,
    userEmail: input.userEmail,
    userName: input.userName,
    payerCpf: input.payerCpf,
    idempotencyKey: input.idempotencyKey,
    externalReference: input.externalReference,
    notificationUrl: input.notificationUrl,
    description: input.description || 'Depósito Gol de Ouro'
  });

  if (!result.success) {
    return result;
  }

  return {
    success: true,
    provider: result.provider,
    providerRef: result.providerRef,
    amount: result.amount,
    status: result.status || 'pending',
    qrCode: result.qrCode,
    qrCodeBase64: result.qrCodeBase64,
    pixCopyPaste: result.pixCopyPaste || result.qrCode,
    externalReference: result.externalReference,
    idempotencyKey: result.idempotencyKey,
    financialEffect: false
  };
}

/**
 * @param {{ mercadoPagoConnected?: boolean }} [options]
 */
function isPixDepositConfigured(options = {}) {
  const health = getPixDepositHealth();
  if (health.paymentProvider === 'asaas') {
    return health.asaasPaymentConfigured === true;
  }
  if (health.paymentProvider === 'mercadopago') {
    if (options.mercadoPagoConnected === false) {
      return false;
    }
    return MercadoPagoPaymentProvider.isConfigured();
  }
  return false;
}

module.exports = {
  createPixDepositCompat,
  isPixDepositConfigured,
  getPixDepositHealth
};
