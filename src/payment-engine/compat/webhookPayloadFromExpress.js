'use strict';



const {

  createWebhookPayload,

  isWebhookPayload,

  inferEventFields

} = require('../types/WebhookPayload');



/**

 * PE.2E / PE.2B — mapper HTTP borda → WebhookPayload.

 * Único ponto da Payment Engine que aceita objetos estilo Express.

 * Não importa o pacote `express` em runtime.

 *

 * @param {object} req — duck-typed HTTP request (Express Request ou compatível)

 * @param {{ provider?: string, correlationId?: string, metadata?: Record<string, unknown> }} [options]

 * @returns {import('../types/WebhookPayload').WebhookPayload}

 */

function webhookPayloadFromExpress(req, options = {}) {

  if (!req) {

    throw new Error('INVALID_HTTP_REQUEST');

  }



  let rawBody = req.rawBody;

  if (rawBody == null && req.body != null) {

    rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

  }



  const body = req.body !== undefined ? req.body : null;

  const inferred = inferEventFields(body);

  const requestId =

    (req.headers && (req.headers['x-request-id'] || req.headers['x-requestid'])) ||

    req.id ||

    null;

  const sourceIp =

    req.ip ||

    (req.socket && req.socket.remoteAddress) ||

    (req.headers && req.headers['x-forwarded-for']

      ? String(req.headers['x-forwarded-for']).split(',')[0].trim()

      : null);



  return createWebhookPayload({

    provider: options.provider || 'unknown',

    eventId: inferred.eventId,

    eventType: inferred.eventType,

    headers: req.headers,

    query: req.query,

    params: req.params,

    body,

    rawBody: rawBody != null ? rawBody : null,

    sourceIp: sourceIp != null ? String(sourceIp) : null,

    requestId: requestId != null ? String(requestId) : null,

    metadata: {

      ...(options.metadata || {}),

      bridge: 'webhookPayloadFromExpress'

    },

    method: req.method,

    path: req.originalUrl || req.url || '/',

    parsedBody: body,

    correlationId: options.correlationId

  });

}



/**

 * Reconstrói um objeto duck-typed compatível com handlers legados que esperam `req`.

 * Uso exclusivo em bridge/adapter — não reintroduz o pacote Express.

 *

 * @param {import('../types/WebhookPayload').WebhookPayload|object} payload

 * @returns {object}

 */

function expressLikeFromWebhookPayload(payload) {

  if (!payload || typeof payload !== 'object') {

    throw new Error('INVALID_WEBHOOK_PAYLOAD');

  }

  const body = payload.parsedBody !== undefined ? payload.parsedBody : payload.body;

  return {

    method: payload.method || 'POST',

    originalUrl: payload.path || '/',

    url: payload.path || '/',

    headers: payload.headers || {},

    query: payload.query || {},

    params: payload.params || {},

    body,

    rawBody: payload.rawBody != null ? payload.rawBody : undefined,

    ip: payload.sourceIp || undefined,

    id: payload.requestId || undefined

  };

}



/**

 * Aceita WebhookPayload ou objeto estilo req — retorna sempre WebhookPayload.

 * @param {object} input

 * @param {{ provider?: string, correlationId?: string }} [options]

 */

function coerceToWebhookPayload(input, options = {}) {

  if (isWebhookPayload(input) && !input.app && typeof input.get !== 'function') {

    return createWebhookPayload({

      ...input,

      provider: options.provider || input.provider,

      correlationId: options.correlationId || input.correlationId

    });

  }

  return webhookPayloadFromExpress(input, options);

}



module.exports = {

  webhookPayloadFromExpress,

  expressLikeFromWebhookPayload,

  coerceToWebhookPayload

};

