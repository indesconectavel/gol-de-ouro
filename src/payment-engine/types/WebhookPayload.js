'use strict';



/**

 * PE.2E — WebhookPayload™ (framework-agnóstico).

 * Consolida PE.2A Interface Freeze + PE.2B shadow shape.

 *

 * Campos PE.2E (contrato alvo):

 * @typedef {Object} WebhookPayload

 * @property {string} provider

 * @property {string|null} eventId

 * @property {string|null} eventType

 * @property {Record<string, string>} headers

 * @property {Record<string, string>} query

 * @property {Record<string, string>} params

 * @property {unknown} body

 * @property {string|Buffer|null} rawBody

 * @property {string} receivedAt

 * @property {string|null} sourceIp

 * @property {string|null} requestId

 * @property {Record<string, unknown>} metadata

 *

 * Campos PE.2B preservados (compat / shadow):

 * @property {string} [method]

 * @property {string} [path]

 * @property {unknown} [parsedBody] — alias de body

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



/**

 * Discriminador estrutural — não depende de Express.

 * @param {unknown} value

 * @returns {boolean}

 */

function isWebhookPayload(value) {

  if (!value || typeof value !== 'object') return false;

  const v = /** @type {Record<string, unknown>} */ (value);

  // Express Request tipicamente tem .app / .get / .res

  if (typeof v.get === 'function' || v.app != null || v.res != null) return false;

  // Marcadores PE.2E / PE.2B — evita confundir com HTTP-like legado

  const marked =

    'provider' in v || 'receivedAt' in v || 'parsedBody' in v || 'correlationId' in v;

  if (!marked) return false;

  return 'headers' in v && ('body' in v || 'parsedBody' in v || 'rawBody' in v);

}



/**

 * Normaliza um objeto parcial para WebhookPayload completo.

 * @param {Partial<WebhookPayload> & Record<string, unknown>} partial

 * @returns {WebhookPayload}

 */

function createWebhookPayload(partial = {}) {

  const body = partial.body !== undefined ? partial.body : partial.parsedBody;

  const headers = normalizeHeaderMap(partial.headers);

  const receivedAt =

    typeof partial.receivedAt === 'string' && partial.receivedAt

      ? partial.receivedAt

      : new Date().toISOString();



  return {

    provider: String(partial.provider || 'unknown'),

    eventId: partial.eventId != null ? String(partial.eventId) : null,

    eventType: partial.eventType != null ? String(partial.eventType) : null,

    headers,

    query: normalizeStringMap(partial.query),

    params: normalizeStringMap(partial.params),

    body: body === undefined ? null : body,

    rawBody: partial.rawBody != null ? partial.rawBody : null,

    receivedAt,

    sourceIp: partial.sourceIp != null ? String(partial.sourceIp) : null,

    requestId: partial.requestId != null ? String(partial.requestId) : null,

    metadata:

      partial.metadata && typeof partial.metadata === 'object' && !Array.isArray(partial.metadata)

        ? { ...partial.metadata }

        : {},

    // PE.2B aliases

    method: partial.method ? String(partial.method).toUpperCase() : 'POST',

    path: partial.path != null ? String(partial.path) : '/',

    parsedBody: body === undefined ? null : body,

    correlationId: partial.correlationId != null ? String(partial.correlationId) : undefined

  };

}



/**

 * @param {unknown} headers

 * @returns {Record<string, string>}

 */

function normalizeHeaderMap(headers) {

  const out = {};

  if (!headers || typeof headers !== 'object') return out;

  for (const [key, value] of Object.entries(headers)) {

    if (value == null) continue;

    out[String(key).toLowerCase()] = Array.isArray(value) ? value.join(',') : String(value);

  }

  return out;

}



/**

 * @param {unknown} map

 * @returns {Record<string, string>}

 */

function normalizeStringMap(map) {

  const out = {};

  if (!map || typeof map !== 'object') return out;

  for (const [key, value] of Object.entries(map)) {

    if (value == null) continue;

    out[String(key)] = Array.isArray(value) ? value.map(String).join(',') : String(value);

  }

  return out;

}



/**

 * Extrai eventId/eventType heurísticos de body PSP (Asaas / MP).

 * @param {unknown} body

 * @returns {{ eventId: string|null, eventType: string|null }}

 */

function inferEventFields(body) {

  if (!body || typeof body !== 'object') {

    return { eventId: null, eventType: null };

  }

  const b = /** @type {Record<string, unknown>} */ (body);

  const eventType =

    b.event != null

      ? String(b.event)

      : b.type != null

        ? String(b.type)

        : b.action != null

          ? String(b.action)

          : null;

  const eventId =

    b.id != null

      ? String(b.id)

      : b.eventId != null

        ? String(b.eventId)

        : b.data && typeof b.data === 'object' && /** @type {any} */ (b.data).id != null

          ? String(/** @type {any} */ (b.data).id)

          : b.payment && typeof b.payment === 'object' && /** @type {any} */ (b.payment).id != null

            ? String(/** @type {any} */ (b.payment).id)

            : null;

  return { eventId, eventType };

}



module.exports = {

  isWebhookPayload,

  createWebhookPayload,

  normalizeHeaderMap,

  normalizeStringMap,

  inferEventFields

};

