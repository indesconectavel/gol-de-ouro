'use strict';

const { resolvePaymentProvider, getHealthSnapshot } = require('../factory/FinanceProviderFactory');

/**
 * Entry point provider-agnostic — PIX IN via Payment Engine (F4.4).
 * @param {import('../contracts/PaymentProvider').PixDepositCreateInput & {
 *   externalReference?: string,
 *   description?: string,
 *   customerId?: string
 * }} input
 */
async function createPixDeposit(input = {}) {
  const provider = resolvePaymentProvider();
  const result = await provider.createPixDeposit(input);
  return {
    ...result,
    provider: result.provider || provider.name
  };
}

function getPixDepositHealth() {
  return getHealthSnapshot();
}

module.exports = {
  createPixDeposit,
  getPixDepositHealth
};
