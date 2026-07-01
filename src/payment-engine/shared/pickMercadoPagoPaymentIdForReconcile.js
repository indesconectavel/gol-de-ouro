'use strict';

/**
 * Escolhe o ID numérico do Mercado Pago para GET /v1/payments/{id}.
 * Extraído de server-fly.js (P2.2) — comportamento idêntico.
 */
function pickMercadoPagoPaymentIdForReconcile(row) {
  const pid = row?.payment_id != null ? String(row.payment_id).trim() : '';
  const ext = row?.external_id != null ? String(row.external_id).trim() : '';
  if (/^\d+$/.test(pid)) return pid;
  if (/^\d+$/.test(ext)) return ext;
  return null;
}

module.exports = { pickMercadoPagoPaymentIdForReconcile };
