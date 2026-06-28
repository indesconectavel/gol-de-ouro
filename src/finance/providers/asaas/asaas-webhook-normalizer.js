'use strict';

const { validateAsaasWebhook, DECISION } = require('./asaas-webhook-validator');

const CREDIT_EVENTS = new Set(['PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED']);

function mapAsaasPaymentStatus(rawStatus) {
  const normalized = String(rawStatus || '').toUpperCase();
  if (normalized === 'RECEIVED' || normalized === 'CONFIRMED') return 'approved';
  if (normalized === 'PENDING' || normalized === 'AWAITING_PAYMENT') return 'pending';
  return String(rawStatus || 'unknown').toLowerCase();
}

/**
 * Normaliza webhook Asaas validado → evento interno padrão (F4.5).
 * @param {object} input
 * @param {object} input.body
 * @param {object} input.validation — resultado validateAsaasWebhook
 */
function normalizeAsaasPaymentWebhook(input = {}) {
  const validation = input.validation || validateAsaasWebhook(input);
  const body = input.body || {};

  if (validation.decision === DECISION.IGNORED_UNKNOWN_EVENT) {
    return {
      success: false,
      ignored: true,
      reason: 'UNKNOWN_EVENT',
      validation
    };
  }

  if (
    validation.decision === DECISION.INVALID_PAYLOAD ||
    validation.decision === DECISION.INVALID_SIGNATURE_OR_TOKEN
  ) {
    return {
      success: false,
      ignored: false,
      rejected: true,
      reason: validation.decision,
      validation
    };
  }

  if (validation.decision === DECISION.IGNORED_DISABLED) {
    return {
      success: false,
      ignored: true,
      reason: 'WEBHOOK_DISABLED',
      validation
    };
  }

  const eventType = validation.eventType || body.event;
  const payment = body.payment || {};
  const paymentId = payment.id ? String(payment.id) : validation.resourceId;
  const rawStatus = payment.status ?? validation.paymentStatus ?? null;
  const mappedStatus = mapAsaasPaymentStatus(rawStatus);
  const amount = Number(payment.value ?? payment.netValue ?? 0);
  const shouldCredit =
    CREDIT_EVENTS.has(String(eventType || '').toUpperCase()) && mappedStatus === 'approved';

  return {
    success: true,
    validation,
    event: {
      provider: 'asaas',
      eventId: validation.eventId || body.id || `asaas_${eventType}_${paymentId}`,
      eventType: String(eventType || '').toUpperCase(),
      paymentId: paymentId || null,
      externalReference: payment.externalReference ?? null,
      status: mappedStatus,
      amount: Number.isFinite(amount) ? amount : null,
      rawStatus,
      financialEffect: false,
      shouldCreditWallet: shouldCredit,
      receivedAt: new Date().toISOString()
    }
  };
}

module.exports = {
  normalizeAsaasPaymentWebhook,
  mapAsaasPaymentStatus,
  CREDIT_EVENTS
};
