'use strict';

const { checkSupabaseDepositIdempotency } = require('../../../finance/webhooks/paymentWebhookIdempotency');
const {
  webhookPayloadFromExpress,
  expressLikeFromWebhookPayload
} = require('../../compat/webhookPayloadFromExpress');

/**
 * PE.2B — adapter shadow de webhook GDO (não ativo em produção por default).
 * Concentra idempotência depósito + conversão WebhookPayload sem alterar handlers PSP.
 */
const GolDeOuroWebhookAdapter = {
  productId: 'gol-de-ouro',

  /**
   * @param {import('express').Request} req
   * @param {{ provider?: string }} [options]
   * @returns {import('../../types/WebhookPayload').WebhookPayload}
   */
  toWebhookPayload(req, options = {}) {
    return webhookPayloadFromExpress(req, options);
  },

  /**
   * @param {import('../../types/WebhookPayload').WebhookPayload} payload
   * @returns {import('express').Request}
   */
  toExpressLike(payload) {
    return expressLikeFromWebhookPayload(payload);
  },

  /**
   * Idempotência depósito — delega implementação certificada existente.
   * @param {object} supabase
   * @param {string} paymentId
   */
  async checkDepositIdempotency(supabase, paymentId) {
    return checkSupabaseDepositIdempotency(supabase, paymentId);
  }
};

module.exports = GolDeOuroWebhookAdapter;
