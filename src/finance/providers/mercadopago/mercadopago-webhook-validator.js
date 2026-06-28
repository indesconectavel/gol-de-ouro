'use strict';

const WebhookSignatureValidator = require('../../../../utils/webhook-signature-validator');

const webhookSignatureValidator = new WebhookSignatureValidator();

/**
 * Validação webhook depósito Mercado Pago — delega ao validador legado existente.
 */
function validateMercadoPagoDepositWebhook(req) {
  return webhookSignatureValidator.validateMercadoPagoWebhook(req);
}

module.exports = {
  validateMercadoPagoDepositWebhook,
  webhookSignatureValidator,
  WebhookSignatureValidator
};
