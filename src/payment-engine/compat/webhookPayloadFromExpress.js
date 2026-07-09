'use strict';

/**
 * PE.2B — mapper Express → WebhookPayload (shadow; não substitui handlers produtivos).
 *
 * @param {import('express').Request} req
 * @param {{ provider?: string, correlationId?: string }} [options]
 * @returns {import('../types/WebhookPayload').WebhookPayload}
 */
function webhookPayloadFromExpress(req, options = {}) {
  if (!req) {
    throw new Error('INVALID_EXPRESS_REQUEST');
  }

  const headers = {};
  if (req.headers && typeof req.headers === 'object') {
    for (const [key, value] of Object.entries(req.headers)) {
      if (value == null) continue;
      headers[String(key).toLowerCase()] = Array.isArray(value) ? value.join(',') : String(value);
    }
  }

  let rawBody = req.rawBody;
  if (rawBody == null && req.body != null) {
    rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  }
  if (rawBody == null) {
    rawBody = '';
  }

  return {
    method: String(req.method || 'POST').toUpperCase(),
    path: String(req.originalUrl || req.url || '/'),
    headers,
    rawBody,
    query: req.query && typeof req.query === 'object' ? { ...req.query } : {},
    parsedBody: req.body,
    provider: options.provider,
    correlationId: options.correlationId
  };
}

/**
 * Reconstrói um objeto compatível com handlers que esperam express.Request.
 * Uso exclusivo em testes/shadow — produção mantém req original.
 *
 * @param {import('../types/WebhookPayload').WebhookPayload} payload
 * @returns {import('express').Request}
 */
function expressLikeFromWebhookPayload(payload) {
  return /** @type {import('express').Request} */ ({
    method: payload.method,
    originalUrl: payload.path,
    url: payload.path,
    headers: payload.headers || {},
    query: payload.query || {},
    body: payload.parsedBody ?? payload.rawBody,
    rawBody: payload.rawBody
  });
}

module.exports = {
  webhookPayloadFromExpress,
  expressLikeFromWebhookPayload
};
