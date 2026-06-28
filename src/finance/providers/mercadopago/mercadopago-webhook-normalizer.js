'use strict';

/**
 * Normaliza webhook Mercado Pago → evento interno padrão (F4.5).
 */

function normalizeMercadoPagoPaymentResourceId(raw) {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).trim();
  if (!/^\d+$/.test(s)) return null;
  const idNum = parseInt(s, 10);
  if (Number.isNaN(idNum) || idNum <= 0) return null;
  return { idStr: s, idNum };
}

function mapMercadoPagoWalletStatus(rawStatus) {
  const normalized = String(rawStatus || '').toLowerCase();
  if (normalized === 'approved') return 'approved';
  if (normalized === 'pending' || normalized === 'in_process') return 'pending';
  return normalized || 'unknown';
}

/**
 * @param {object} input
 * @param {object} input.body
 * @param {object} [input.mpPayment] — resposta GET /v1/payments/{id}
 */
function normalizeMercadoPagoPaymentWebhook(input = {}) {
  const body = input.body || {};
  const type = body.type;
  const data = body.data;

  if (type !== 'payment' || data == null) {
    return {
      success: false,
      ignored: true,
      reason: 'UNSUPPORTED_EVENT_TYPE',
      eventType: type ?? null
    };
  }

  const norm = normalizeMercadoPagoPaymentResourceId(data.id);
  if (!norm) {
    return {
      success: false,
      ignored: true,
      reason: 'INVALID_PAYMENT_ID',
      eventType: type
    };
  }

  const mpPayment = input.mpPayment || {};
  const rawStatus = mpPayment.status ?? null;
  const mappedStatus = mapMercadoPagoWalletStatus(rawStatus);
  const amount = Number(mpPayment.transaction_amount ?? mpPayment.amount ?? 0);

  return {
    success: true,
    event: {
      provider: 'mercadopago',
      eventId: `mp_${type}_${norm.idStr}`,
      eventType: type,
      paymentId: norm.idStr,
      externalReference: mpPayment.external_reference ?? null,
      status: mappedStatus,
      amount: Number.isFinite(amount) ? amount : null,
      rawStatus,
      financialEffect: false,
      shouldCreditWallet: mappedStatus === 'approved',
      receivedAt: new Date().toISOString()
    }
  };
}

module.exports = {
  normalizeMercadoPagoPaymentResourceId,
  normalizeMercadoPagoPaymentWebhook,
  mapMercadoPagoWalletStatus
};
