'use strict';



const { isIdempotencyPortEnabled } = require('../../boundary/idempotency-port-config');

const { isWebhookStorePortEnabled } = require('../../boundary/webhook-store-port-config');

const { checkDepositIdempotencyCompat } = require('../../compat/idempotencyPortBridge');

const { createGolDeOuroWebhookStore } = require('./GolDeOuroWebhookStore');

const {

  webhookPayloadFromExpress,

  expressLikeFromWebhookPayload,

  coerceToWebhookPayload

} = require('../../compat/webhookPayloadFromExpress');

const GdoWebhookHttpBridge = require('../../bridges/http/GdoWebhookHttpBridge');



/**

 * PE.2E / PE.2G / PE.2H — adapter de webhook GDO.

 * Payload + idempotência (PE.2G) + store de ciclo de vida (PE.2H).

 */

const GolDeOuroWebhookAdapter = {

  productId: 'gol-de-ouro',

  httpBridge: GdoWebhookHttpBridge,



  toWebhookPayload(req, options = {}) {

    return webhookPayloadFromExpress(req, options);

  },



  coercePayload(input, options = {}) {

    return coerceToWebhookPayload(input, options);

  },



  toExpressLike(payload) {

    return expressLikeFromWebhookPayload(payload);

  },



  buildProcessInput(req, options = {}) {

    return GdoWebhookHttpBridge.buildProcessInput(req, options);

  },



  async checkDepositIdempotency(supabase, paymentId, extraDeps = {}) {

    return checkDepositIdempotencyCompat(

      { supabase, idempotencyStore: extraDeps.idempotencyStore },

      paymentId

    );

  },



  createWebhookStore(deps = {}) {

    return createGolDeOuroWebhookStore(deps);

  },



  isIdempotencyPortEnabled,

  isWebhookStorePortEnabled

};



module.exports = GolDeOuroWebhookAdapter;

