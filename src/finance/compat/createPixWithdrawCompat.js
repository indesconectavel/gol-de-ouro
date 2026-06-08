const { resolvePayoutProvider, assertBootConfig } = require('../factory/FinanceProviderFactory');

assertBootConfig();

/**
 * Ponte legado → PayoutProvider.requestPixPayout (assinatura idêntica a createPixWithdraw).
 * @param {number} amount
 * @param {string} pixKey
 * @param {string} pixKeyType
 * @param {string} userId
 * @param {string} saqueId
 * @param {string} correlationId
 * @param {object} [options]
 */
async function createPixWithdrawCompat(amount, pixKey, pixKeyType, userId, saqueId, correlationId, options = {}) {
  const provider = resolvePayoutProvider();
  return provider.requestPixPayout({
    netAmount: amount,
    pixKey,
    pixType: pixKeyType,
    userId,
    saqueId,
    correlationId,
    payoutExternalReference: options.payoutExternalReference,
    idempotencyKey: options.idempotencyKey,
    notificationUrl: options.notificationUrl,
    ownerIdentification: options.ownerIdentification
  });
}

module.exports = { createPixWithdrawCompat };
