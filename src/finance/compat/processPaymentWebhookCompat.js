'use strict';

const {
  processPaymentWebhook,
  isPaymentWebhookEngineEnabled,
  isAsaasWebhookRouteAllowed
} = require('../webhooks/processPaymentWebhook');
const { validateMercadoPagoDepositWebhook } = require('../providers/mercadopago/mercadopago-webhook-validator');

/**
 * Ponte monólito → Payment Engine webhook (F4.5).
 * Com PAYMENT_WEBHOOK_ENGINE_ENABLED=false retorna engineEnabled=false (legado no server-fly).
 *
 * @param {object} input
 * @param {'mercadopago'|'asaas'} input.provider
 * @param {import('express').Request} input.req
 * @param {import('express').Response} [input.res]
 * @param {object} [input.deps]
 */
async function processPaymentWebhookCompat(input = {}) {
  const { req, res, provider, deps = {} } = input;

  if (!isPaymentWebhookEngineEnabled()) {
    return {
      success: false,
      engineEnabled: false,
      useLegacyHandler: true
    };
  }

  if (provider === 'mercadopago') {
    const signatureValidation = validateMercadoPagoDepositWebhook(req);
    if (!signatureValidation.valid) {
      if (res) {
        return res.status(401).json({ error: 'Invalid signature' });
      }
      return {
        success: false,
        rejected: true,
        httpStatus: 401,
        error: signatureValidation.error
      };
    }
  }

  const result = await processPaymentWebhook({
    provider,
    req,
    deps,
    signatureValidation: provider === 'mercadopago' ? validateMercadoPagoDepositWebhook(req) : undefined
  });

  if (res && provider === 'mercadopago') {
    if (result.rejected && result.httpStatus === 401) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
    res.status(200).json({ received: true, engine: true, provider });
    return result;
  }

  if (res && provider === 'asaas') {
    if (result.rejected) {
      return res.status(result.httpStatus || 403).json({
        error: result.error,
        message: result.message,
        provider: 'asaas'
      });
    }
    return res.status(200).json({
      received: true,
      engine: true,
      provider: 'asaas',
      dryRun: result.dryRun === true,
      productionCredit: result.productionCredit === true,
      credited: result.credited === true,
      idempotent: result.idempotent === true,
      creditDecision: result.creditDecision ?? null
    });
  }

  return result;
}

module.exports = {
  processPaymentWebhookCompat,
  isPaymentWebhookEngineEnabled,
  isAsaasWebhookRouteAllowed
};
