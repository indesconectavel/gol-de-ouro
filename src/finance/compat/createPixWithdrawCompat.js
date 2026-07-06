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
  console.log('[PSP][PIX_OUT_CREATE]', {
    provider: provider.name,
    saqueId,
    netAmount: amount
  });
  const result = await provider.requestPixPayout({
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
  return {
    ...result,
    provider: result?.provider || provider.name
  };
}

module.exports = { createPixWithdrawCompat };
