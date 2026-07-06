'use strict';

const { DECISION } = require('./asaas-webhook-validator');

/** Status canônicos retornados pela API Asaas em transferências. */
const ASAAS_TRANSFER_STATUSES = {
  PENDING: 'PENDING',
  BANK_PROCESSING: 'BANK_PROCESSING',
  DONE: 'DONE',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
  BLOCKED: 'BLOCKED'
};

const EVENT_TO_STATUS_HINT = {
  TRANSFER_CREATED: ASAAS_TRANSFER_STATUSES.PENDING,
  TRANSFER_PENDING: ASAAS_TRANSFER_STATUSES.PENDING,
  TRANSFER_IN_BANK_PROCESSING: ASAAS_TRANSFER_STATUSES.BANK_PROCESSING,
  TRANSFER_BLOCKED: ASAAS_TRANSFER_STATUSES.BLOCKED,
  TRANSFER_DONE: ASAAS_TRANSFER_STATUSES.DONE,
  TRANSFER_FAILED: ASAAS_TRANSFER_STATUSES.FAILED,
  TRANSFER_CANCELLED: ASAAS_TRANSFER_STATUSES.CANCELLED
};

const PENDING_LIKE = new Set([
  ASAAS_TRANSFER_STATUSES.PENDING,
  ASAAS_TRANSFER_STATUSES.BANK_PROCESSING
]);

const TERMINAL_FAIL = new Set([
  ASAAS_TRANSFER_STATUSES.FAILED,
  ASAAS_TRANSFER_STATUSES.CANCELLED,
  ASAAS_TRANSFER_STATUSES.BLOCKED
]);

function sanitizeTransferPayload(transfer) {
  if (!transfer || typeof transfer !== 'object') {
    return null;
  }
  return {
    id: transfer.id ?? null,
    status: transfer.status ?? null,
    type: transfer.type ?? transfer.operationType ?? null,
    value: transfer.value ?? null,
    netValue: transfer.netValue ?? null,
    externalReference: transfer.externalReference ?? null,
    failReason: transfer.failReason ?? null,
    authorized: transfer.authorized ?? null,
    dateCreated: transfer.dateCreated ?? null,
    effectiveDate: transfer.effectiveDate ?? null,
    endToEndIdentifier: transfer.endToEndIdentifier ?? null
  };
}

function resolveTransferStatus(body = {}, validation = {}) {
  const transfer = body.transfer || {};
  const fromPayload = transfer.status ? String(transfer.status).trim().toUpperCase() : null;
  if (fromPayload) {
    return fromPayload;
  }
  const eventType = String(validation.eventType || body.event || '').trim().toUpperCase();
  return EVENT_TO_STATUS_HINT[eventType] || validation.transferStatus || null;
}

function mapTransferStatusToSaqueStatus(transferStatus) {
  const st = String(transferStatus || '').trim().toUpperCase();
  if (st === ASAAS_TRANSFER_STATUSES.DONE) {
    return 'processado';
  }
  if (TERMINAL_FAIL.has(st)) {
    return 'falhou';
  }
  if (PENDING_LIKE.has(st)) {
    return 'aguardando_confirmacao';
  }
  return null;
}

/**
 * Normaliza webhook Asaas de transferência → evento interno (P1.5G).
 */
function normalizeAsaasTransferWebhook(input = {}) {
  const validation = input.validation;
  const body = input.body || {};

  if (
    validation?.decision === DECISION.INVALID_PAYLOAD ||
    validation?.decision === DECISION.INVALID_SIGNATURE_OR_TOKEN
  ) {
    return {
      success: false,
      rejected: true,
      reason: validation.decision,
      validation
    };
  }

  if (validation?.decision === DECISION.IGNORED_DISABLED) {
    return {
      success: false,
      ignored: true,
      reason: 'WEBHOOK_DISABLED',
      validation
    };
  }

  if (validation?.decision === DECISION.IGNORED_UNKNOWN_EVENT) {
    return {
      success: false,
      ignored: true,
      reason: 'UNKNOWN_EVENT',
      validation
    };
  }

  const transfer = body.transfer || {};
  const transferId = transfer.id ? String(transfer.id) : validation.resourceId || null;
  const externalReference = transfer.externalReference ? String(transfer.externalReference) : null;
  const transferStatus = resolveTransferStatus(body, validation);
  const saqueStatusTarget = mapTransferStatusToSaqueStatus(transferStatus);

  return {
    success: true,
    validation,
    event: {
      provider: 'asaas',
      category: 'transfer',
      eventId: validation.eventId || body.id || `asaas_transfer_${transferId || 'unknown'}`,
      eventType: String(validation.eventType || body.event || '').toUpperCase(),
      transferId,
      externalReference,
      transferStatus,
      saqueStatusTarget,
      sanitizedTransfer: sanitizeTransferPayload(transfer),
      financialEffect: false,
      receivedAt: new Date().toISOString()
    }
  };
}

module.exports = {
  ASAAS_TRANSFER_STATUSES,
  EVENT_TO_STATUS_HINT,
  PENDING_LIKE,
  TERMINAL_FAIL,
  sanitizeTransferPayload,
  resolveTransferStatus,
  mapTransferStatusToSaqueStatus,
  normalizeAsaasTransferWebhook
};
