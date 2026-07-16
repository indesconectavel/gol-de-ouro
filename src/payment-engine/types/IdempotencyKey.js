'use strict';



/**

 * PE.2G — normalização neutra de chaves / registros de idempotência.

 */



/**

 * @param {string | object} raw

 * @param {string} [defaultScope]

 * @returns {import('../ports/IdempotencyStore').IdempotencyKey}

 */

function normalizeIdempotencyKey(raw, defaultScope = 'deposit_pix') {

  if (raw != null && typeof raw === 'object' && !Array.isArray(raw)) {

    const key = String(raw.key || raw.paymentId || raw.providerPaymentId || raw.eventId || raw.correlationId || '').trim();

    return {

      scope: String(raw.scope || defaultScope),

      key,

      provider: raw.provider != null ? String(raw.provider) : undefined,

      correlationId: raw.correlationId != null ? String(raw.correlationId) : key || undefined,

      metadata: raw.metadata && typeof raw.metadata === 'object' ? { ...raw.metadata } : {}

    };

  }

  const key = String(raw || '').trim();

  return {

    scope: defaultScope,

    key,

    correlationId: key || undefined,

    metadata: {}

  };

}



/**

 * @param {Partial<import('../ports/IdempotencyStore').IdempotencyRecord>} partial

 * @returns {import('../ports/IdempotencyStore').IdempotencyRecord}

 */

function normalizeIdempotencyRecord(partial = {}) {

  return {

    scope: String(partial.scope || 'unknown'),

    key: String(partial.key || ''),

    state: partial.state || 'none',

    exists: !!partial.exists,

    reserved: !!partial.reserved,

    duplicate: !!partial.duplicate,

    status: partial.status != null ? String(partial.status) : null,

    metadata: partial.metadata && typeof partial.metadata === 'object' ? { ...partial.metadata } : {},

    error: partial.error

  };

}



module.exports = {

  normalizeIdempotencyKey,

  normalizeIdempotencyRecord

};

