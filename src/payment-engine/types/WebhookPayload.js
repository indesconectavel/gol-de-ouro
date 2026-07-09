'use strict';

/**
 * PE.2B — payload de webhook framework-agnóstico (Interface Freeze PE.2A).
 *
 * @typedef {Object} WebhookPayload
 * @property {string} method
 * @property {string} path
 * @property {Record<string, string>} headers
 * @property {Buffer|string} rawBody
 * @property {Record<string, string>} [query]
 * @property {unknown} [parsedBody]
 * @property {string} [provider]
 * @property {string} [correlationId]
 */

/**
 * @typedef {Object} WebhookHandleResult
 * @property {boolean} valid
 * @property {string} [error]
 * @property {string} [providerRef]
 * @property {string} [externalReference]
 * @property {string} [status]
 * @property {string} [statusDetail]
 */

module.exports = {};
