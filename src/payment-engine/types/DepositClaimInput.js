'use strict';



/**

 * PE.2F — input neutro para claim de depósito aprovado.

 * Proibido: row Supabase, req, pagamento_pix, objeto bruto PSP, cliente DB.

 *

 * @typedef {Object} DepositClaimInput

 * @property {string} [provider] — ex.: 'asaas' | 'mercadopago' | 'unknown'

 * @property {string} providerPaymentId — ID do pagamento no provider (payment_id / external_id)

 * @property {string | null} [accountId]

 * @property {number | string | bigint | null} [amount]

 * @property {string} [currency]

 * @property {string | null} [eventId]

 * @property {string} [correlationId] — default = providerPaymentId

 * @property {string | null} [occurredAt]

 * @property {Record<string, unknown>} [metadata]

 */



/**

 * @typedef {Object} DepositClaimResult

 * @property {boolean} ok

 * @property {boolean} credited

 * @property {boolean} idempotent

 * @property {string} [reason]

 * @property {string | null} [accountId]

 * @property {number | null} [amount]

 * @property {string | null} [correlationId]

 * @property {string | null} [ledgerId]

 * @property {Record<string, unknown>} [metadata]

 */



/**

 * Normaliza paymentId string ou objeto parcial → DepositClaimInput.

 * @param {string | DepositClaimInput} raw

 * @returns {DepositClaimInput}

 */

function normalizeDepositClaimInput(raw) {

  if (raw != null && typeof raw === 'object' && !Array.isArray(raw)) {

    const providerPaymentId = String(raw.providerPaymentId || raw.paymentId || '').trim();

    const correlationId = String(raw.correlationId || providerPaymentId || '').trim() || providerPaymentId;

    return {

      provider: raw.provider != null ? String(raw.provider) : inferProvider(providerPaymentId),

      providerPaymentId,

      accountId: raw.accountId != null ? String(raw.accountId) : null,

      amount: raw.amount != null ? raw.amount : null,

      currency: raw.currency != null ? String(raw.currency) : 'BRL',

      eventId: raw.eventId != null ? String(raw.eventId) : null,

      correlationId,

      occurredAt: raw.occurredAt != null ? String(raw.occurredAt) : null,

      metadata: raw.metadata && typeof raw.metadata === 'object' ? { ...raw.metadata } : {}

    };

  }



  const providerPaymentId = String(raw || '').trim();

  return {

    provider: inferProvider(providerPaymentId),

    providerPaymentId,

    accountId: null,

    amount: null,

    currency: 'BRL',

    eventId: null,

    correlationId: providerPaymentId,

    occurredAt: null,

    metadata: {}

  };

}



/**

 * @param {string} providerPaymentId

 * @returns {string}

 */

function inferProvider(providerPaymentId) {

  if (/^pay_[a-z0-9]+$/i.test(providerPaymentId)) return 'asaas';

  if (/^\d+$/.test(providerPaymentId)) return 'mercadopago';

  return 'unknown';

}



/**

 * @param {Partial<DepositClaimResult>} partial

 * @returns {DepositClaimResult}

 */

function normalizeDepositClaimResult(partial = {}) {

  return {

    ok: !!partial.ok,

    credited: !!partial.credited,

    idempotent: !!partial.idempotent,

    reason: partial.reason != null ? String(partial.reason) : undefined,

    accountId: partial.accountId != null ? String(partial.accountId) : null,

    amount: partial.amount != null && Number.isFinite(Number(partial.amount)) ? Number(partial.amount) : null,

    correlationId: partial.correlationId != null ? String(partial.correlationId) : null,

    ledgerId: partial.ledgerId != null ? String(partial.ledgerId) : null,

    metadata: partial.metadata && typeof partial.metadata === 'object' ? { ...partial.metadata } : {}

  };

}



module.exports = {

  normalizeDepositClaimInput,

  normalizeDepositClaimResult,

  inferProvider

};

