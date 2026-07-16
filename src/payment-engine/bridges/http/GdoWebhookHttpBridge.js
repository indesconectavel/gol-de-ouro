'use strict';



const {

  webhookPayloadFromExpress,

  expressLikeFromWebhookPayload,

  coerceToWebhookPayload

} = require('../../compat/webhookPayloadFromExpress');

const { isAdapterBoundaryEnabled, FLAG_NAME } = require('../../boundary/adapter-boundary-config');



/**

 * PE.2E — HTTP Bridge GDO™

 * Converte Express Request → WebhookPayload na borda do Gol de Ouro™.

 * A Payment Engine consome apenas o contrato neutro.

 *

 * Produção: bridge disponível, mas rotas só usam path novo se

 * PE_ADAPTER_BOUNDARY_ENABLED=true (shadow / HITL).

 */

const GdoWebhookHttpBridge = {

  flagName: FLAG_NAME,



  isShadowPathEnabled() {

    return isAdapterBoundaryEnabled();

  },



  /**

   * @param {object} req

   * @param {{ provider?: string, correlationId?: string, metadata?: object }} [options]

   */

  extract(req, options = {}) {

    return webhookPayloadFromExpress(req, {

      ...options,

      metadata: {

        ...(options.metadata || {}),

        bridge: 'GdoWebhookHttpBridge',

        productId: 'gol-de-ouro'

      }

    });

  },



  /**

   * Monta input da engine a partir do payload neutro (sem Express).

   * @param {object} webhookPayload

   * @param {{ provider?: string, deps?: object, signatureValidation?: object, res?: object }} [extras]

   */

  toEngineInput(webhookPayload, extras = {}) {

    const payload = coerceToWebhookPayload(webhookPayload, {

      provider: extras.provider || webhookPayload.provider

    });

    return {

      provider: extras.provider || payload.provider,

      webhookPayload: payload,

      body: payload.parsedBody ?? payload.body,

      headers: payload.headers,

      deps: extras.deps || {},

      signatureValidation: extras.signatureValidation,

      res: extras.res,

      // req omitido de propósito — ingress via payload

      pe2e: true

    };

  },



  /**

   * Compat legado: payload → objeto duck-typed estilo req (validators MP/Asaas).

   */

  toExpressLike(webhookPayload) {

    return expressLikeFromWebhookPayload(webhookPayload);

  },



  /**

   * Extrai na borda e monta input; se shadow off, retorna modo legado `{ req }`.

   * @param {object} req

   * @param {{ provider: string, deps?: object, res?: object, signatureValidation?: object, forcePayload?: boolean }} options

   */

  buildProcessInput(req, options = {}) {

    const usePayload = options.forcePayload === true || isAdapterBoundaryEnabled();

    if (!usePayload) {

      return {

        provider: options.provider,

        req,

        res: options.res,

        deps: options.deps || {},

        signatureValidation: options.signatureValidation,

        pe2e: false

      };

    }

    const webhookPayload = this.extract(req, { provider: options.provider });

    return this.toEngineInput(webhookPayload, {

      provider: options.provider,

      deps: options.deps,

      res: options.res,

      signatureValidation: options.signatureValidation

    });

  }

};



module.exports = GdoWebhookHttpBridge;

