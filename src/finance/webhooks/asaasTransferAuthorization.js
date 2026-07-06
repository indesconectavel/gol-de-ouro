'use strict';

const { timingSafeEqual } = require('node:crypto');
const { ASAAS_WEBHOOK_AUTH_HEADER } = require('../providers/asaas/asaas-webhook-validator');
const {
  isAsaasTransferAuthWebhookEnabled,
  isAsaasTransferAuthStrictMode,
  isAsaasTransferAuthIpCheckEnabled,
  getAsaasTransferAuthWebhookToken,
  OFFICIAL_ASAAS_WEBHOOK_IPS
} = require('../config/asaas-transfer-auth-config');

const LOG_PREFIX = '[ASAAS][TRANSFER_AUTH]';
const SAQUE_SELECT =
  'id, usuario_id, status, amount, valor, fee, net_amount, correlation_id, payout_external_reference, asaas_transfer_id, asaas_transfer_status, asaas_payout_raw';
const TERMINAL_SAQUE_STATUSES = new Set([
  'processado',
  'falhou',
  'cancelado',
  'pago_manual',
  'cancelado_manual',
  'pago',
  'paid',
  'concluido',
  'concluído',
  'estornado',
  'rollback'
]);
const AUTHORIZABLE_SAQUE_STATUSES = new Set([
  'aguardando_confirmacao',
  'processando',
  'processing',
  'em_processamento',
  'pendente',
  'pending'
]);
const VALUE_TOLERANCE = 0.01;

/** @type {Map<string, { decision: string, at: number }>} */
const recentAuthDecisions = new Map();
const AUTH_DECISION_TTL_MS = 15 * 60 * 1000;

function authLog(event, payload = {}) {
  try {
    console.log(
      LOG_PREFIX,
      JSON.stringify({
        ts: new Date().toISOString(),
        event,
        ...payload
      })
    );
  } catch (_) {
    /* no-op */
  }
}

function normalizeHeaders(headers = {}) {
  const normalized = {};
  for (const [key, value] of Object.entries(headers || {})) {
    if (value == null) continue;
    normalized[String(key).toLowerCase()] = Array.isArray(value) ? value[0] : String(value);
  }
  return normalized;
}

function safeEqualToken(provided, expected) {
  if (!provided || !expected) return false;
  const a = Buffer.from(String(provided));
  const b = Buffer.from(String(expected));
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function extractClientIp(input = {}) {
  const forwarded = input.headers?.['x-forwarded-for'] || input.headers?.['X-Forwarded-For'];
  if (forwarded) {
    return String(forwarded).split(',')[0].trim();
  }
  if (input.ip) {
    return String(input.ip).replace(/^::ffff:/, '');
  }
  return null;
}

function isOfficialAsaasIp(ip) {
  if (!ip) return false;
  const normalized = String(ip).replace(/^::ffff:/, '');
  return OFFICIAL_ASAAS_WEBHOOK_IPS.includes(normalized);
}

function buildRefused(reason) {
  return {
    httpStatus: 200,
    body: { status: 'REFUSED', refuseReason: String(reason).slice(0, 240) },
    authorized: false,
    reason
  };
}

function buildApproved(extra = {}) {
  return {
    httpStatus: 200,
    body: { status: 'APPROVED' },
    authorized: true,
    reason: 'approved',
    ...extra
  };
}

function validateAuthPayload(body) {
  if (body == null || typeof body !== 'object') {
    return { valid: false, error: 'EMPTY_BODY' };
  }
  const type = String(body.type || '').trim().toUpperCase();
  if (type !== 'TRANSFER') {
    return { valid: false, error: `UNSUPPORTED_TYPE:${type || 'missing'}` };
  }
  const transfer = body.transfer;
  if (!transfer || typeof transfer !== 'object') {
    return { valid: false, error: 'TRANSFER_OBJECT_MISSING' };
  }
  const transferId = transfer.id ? String(transfer.id).trim() : null;
  if (!transferId) {
    return { valid: false, error: 'TRANSFER_ID_MISSING' };
  }
  return {
    valid: true,
    transferId,
    transferStatus: String(transfer.status || '').trim().toUpperCase(),
    transferValue: Number(transfer.value),
    externalReference: transfer.externalReference ? String(transfer.externalReference).trim() : null,
    operationType: transfer.operationType ? String(transfer.operationType).trim().toUpperCase() : null,
    sanitizedTransfer: {
      id: transferId,
      status: transfer.status ?? null,
      value: transfer.value ?? null,
      netValue: transfer.netValue ?? null,
      operationType: transfer.operationType ?? null,
      externalReference: transfer.externalReference ?? null
    }
  };
}

function validateAuthToken(headers) {
  const expected = getAsaasTransferAuthWebhookToken();
  const normalizedHeaders = normalizeHeaders(headers);
  const headerToken = normalizedHeaders[ASAAS_WEBHOOK_AUTH_HEADER] ?? null;

  if (!isAsaasTransferAuthStrictMode()) {
    return { valid: true, skipped: true, headerPresent: Boolean(headerToken) };
  }

  if (!expected) {
    return { valid: false, error: 'AUTH_TOKEN_NOT_CONFIGURED' };
  }
  if (!headerToken) {
    return { valid: false, error: 'AUTH_TOKEN_HEADER_MISSING' };
  }
  if (!safeEqualToken(headerToken, expected)) {
    return { valid: false, error: 'AUTH_TOKEN_MISMATCH' };
  }
  return { valid: true };
}

function validateAuthIp(ip) {
  if (!isAsaasTransferAuthIpCheckEnabled()) {
    return { valid: true, skipped: true };
  }
  if (!isOfficialAsaasIp(ip)) {
    return { valid: false, error: 'IP_NOT_ALLOWLISTED', ip: ip ? `${String(ip).slice(0, 8)}...` : null };
  }
  return { valid: true };
}

function parseSaqueAmounts(saqueRow) {
  const amount = parseFloat(saqueRow.amount ?? saqueRow.valor ?? 0);
  const fee = parseFloat(saqueRow.fee ?? 0);
  const netAmount = parseFloat(saqueRow.net_amount ?? (amount - fee));
  return { amount, fee, netAmount };
}

function isTerminalSaqueStatus(status) {
  return TERMINAL_SAQUE_STATUSES.has(String(status || '').toLowerCase());
}

function isAuthorizableSaqueStatus(status) {
  return AUTHORIZABLE_SAQUE_STATUSES.has(String(status || '').toLowerCase());
}

function valuesMatch(expected, actual, tolerance = VALUE_TOLERANCE) {
  if (!Number.isFinite(expected) || !Number.isFinite(actual)) {
    return false;
  }
  return Math.abs(expected - actual) <= tolerance;
}

function rememberAuthDecision(transferId, decision) {
  recentAuthDecisions.set(transferId, { decision, at: Date.now() });
  if (recentAuthDecisions.size > 500) {
    const cutoff = Date.now() - AUTH_DECISION_TTL_MS;
    for (const [key, val] of recentAuthDecisions.entries()) {
      if (val.at < cutoff) recentAuthDecisions.delete(key);
    }
  }
}

function getRecentAuthDecision(transferId) {
  const entry = recentAuthDecisions.get(transferId);
  if (!entry) return null;
  if (Date.now() - entry.at > AUTH_DECISION_TTL_MS) {
    recentAuthDecisions.delete(transferId);
    return null;
  }
  return entry.decision;
}

async function findSaqueForAuth(supabase, { transferId, externalReference }) {
  if (transferId) {
    const byId = await supabase
      .from('saques')
      .select(SAQUE_SELECT)
      .eq('asaas_transfer_id', transferId)
      .maybeSingle();
    if (byId.error) {
      return { error: byId.error };
    }
    if (byId.data?.id) {
      return { saque: byId.data, matchedBy: 'asaas_transfer_id' };
    }
  }

  if (externalReference) {
    const byRef = await supabase
      .from('saques')
      .select(SAQUE_SELECT)
      .eq('payout_external_reference', externalReference)
      .maybeSingle();
    if (byRef.error) {
      return { error: byRef.error };
    }
    if (byRef.data?.id) {
      return { saque: byRef.data, matchedBy: 'payout_external_reference' };
    }
  }

  return { saque: null, matchedBy: null };
}

async function checkLedgerIntegrity(supabase, saqueRow) {
  const correlationId = saqueRow.correlation_id;
  const saqueId = saqueRow.id;
  if (!correlationId) {
    return { ok: false, reason: 'CORRELATION_ID_MISSING' };
  }

  const { data, error } = await supabase
    .from('ledger_financeiro')
    .select('id, tipo, referencia')
    .eq('correlation_id', correlationId)
    .in('tipo', ['payout_confirmado', 'payout_manual_confirmado', 'rollback_manual', 'rollback', 'falha_payout']);

  if (error) {
    return { ok: false, reason: 'LEDGER_LOOKUP_FAILED' };
  }

  const rows = Array.isArray(data) ? data : [];
  const idRef = String(saqueId);
  const hasPayoutConfirmed = rows.some(
    (r) => r.tipo === 'payout_confirmado' && String(r.referencia || '') === idRef
  );
  if (hasPayoutConfirmed) {
    return { ok: false, reason: 'ALREADY_CONFIRMED_IN_LEDGER' };
  }

  const hasPayoutManual = rows.some(
    (r) => r.tipo === 'payout_manual_confirmado' && String(r.referencia || '') === idRef
  );
  const hasRollbackManual = rows.some((r) => {
    if (r.tipo !== 'rollback_manual') return false;
    const ref = String(r.referencia || '');
    return ref === idRef || ref === `${idRef}:fee` || ref.startsWith(`${idRef}:estorno_`);
  });
  if (hasPayoutManual && hasRollbackManual) {
    return { ok: false, reason: 'LEDGER_COMPENSATED' };
  }

  const hasFailure = rows.some(
    (r) => r.tipo === 'falha_payout' && String(r.referencia || '') === idRef
  );
  const hasRollback = rows.some(
    (r) =>
      (r.tipo === 'rollback' || r.tipo === 'rollback_manual') &&
      (String(r.referencia || '') === idRef || String(r.referencia || '').startsWith(`${idRef}:`))
  );
  if (hasFailure && hasRollback) {
    return { ok: false, reason: 'PAYOUT_FAILED_AND_ROLLED_BACK' };
  }

  return { ok: true };
}

/** Read-only — não altera wallet. */
async function checkWalletConsistency(supabase, saqueRow) {
  const userId = saqueRow.usuario_id;
  if (!userId) {
    return { ok: false, reason: 'USER_ID_MISSING' };
  }

  const { data, error } = await supabase.from('usuarios').select('saldo').eq('id', userId).maybeSingle();
  if (error) {
    return { ok: false, reason: 'WALLET_LOOKUP_FAILED' };
  }
  if (!data) {
    return { ok: false, reason: 'USER_NOT_FOUND' };
  }

  const saldo = parseFloat(data.saldo);
  if (!Number.isFinite(saldo) || saldo < 0) {
    return { ok: false, reason: 'WALLET_INCONSISTENT' };
  }

  return { ok: true, saldo };
}

function isAsaasProviderSaque(saqueRow) {
  if (saqueRow.asaas_transfer_id) return true;
  if (saqueRow.asaas_payout_raw && typeof saqueRow.asaas_payout_raw === 'object') return true;
  if (saqueRow.asaas_transfer_status) return true;
  return false;
}

function evaluateSaqueForAuth(saqueRow, payload) {
  if (!saqueRow?.id) {
    return { approved: false, reason: 'WITHDRAWAL_NOT_FOUND' };
  }

  if (!isAsaasProviderSaque(saqueRow)) {
    return { approved: false, reason: 'PROVIDER_NOT_ASAAS' };
  }

  if (isTerminalSaqueStatus(saqueRow.status)) {
    return { approved: false, reason: `SAQUE_TERMINAL:${saqueRow.status}` };
  }

  if (!isAuthorizableSaqueStatus(saqueRow.status)) {
    return { approved: false, reason: `SAQUE_STATUS_INVALID:${saqueRow.status}` };
  }

  if (payload.transferStatus && payload.transferStatus !== 'PENDING') {
    return { approved: false, reason: `TRANSFER_STATUS_NOT_PENDING:${payload.transferStatus}` };
  }

  const { netAmount } = parseSaqueAmounts(saqueRow);
  if (!valuesMatch(netAmount, payload.transferValue)) {
    return { approved: false, reason: 'VALUE_MISMATCH' };
  }

  if (payload.externalReference && saqueRow.payout_external_reference) {
    if (String(payload.externalReference) !== String(saqueRow.payout_external_reference)) {
      return { approved: false, reason: 'EXTERNAL_REFERENCE_MISMATCH' };
    }
  }

  if (saqueRow.asaas_transfer_id && payload.transferId) {
    if (String(saqueRow.asaas_transfer_id) !== String(payload.transferId)) {
      return { approved: false, reason: 'TRANSFER_ID_MISMATCH' };
    }
  }

  return { approved: true, reason: 'business_rules_passed' };
}

/**
 * Processa webhook de autorização de transferência Asaas (P1.6A).
 * Resposta síncrona APPROVED/REFUSED — read-only (sem escrita DB/wallet/ledger).
 */
async function handleAsaasTransferAuthorization(input = {}) {
  const started = Date.now();
  const requestId = input.requestId || `auth_${Date.now()}`;

  if (!isAsaasTransferAuthWebhookEnabled()) {
    authLog('gate_disabled', {
      request_id: requestId,
      authorized: false,
      reason: 'GATE_DISABLED',
      duration_ms: Date.now() - started
    });
    return {
      httpStatus: 404,
      body: { status: 'REFUSED', refuseReason: 'Authorization endpoint disabled' },
      authorized: false,
      reason: 'ENDPOINT_DISABLED'
    };
  }

  const clientIp = extractClientIp(input);

  const ipCheck = validateAuthIp(clientIp);
  if (!ipCheck.valid) {
    authLog('ip_rejected', {
      request_id: requestId,
      reason: ipCheck.error,
      duration_ms: Date.now() - started
    });
    return buildRefused(ipCheck.error);
  }

  const tokenCheck = validateAuthToken(input.headers);
  if (!tokenCheck.valid) {
    authLog('token_rejected', {
      request_id: requestId,
      reason: tokenCheck.error,
      duration_ms: Date.now() - started
    });
    return buildRefused(tokenCheck.error);
  }

  const payloadCheck = validateAuthPayload(input.body);
  if (!payloadCheck.valid) {
    authLog('payload_rejected', {
      request_id: requestId,
      reason: payloadCheck.error,
      duration_ms: Date.now() - started
    });
    return buildRefused(payloadCheck.error);
  }

  const priorDecision = getRecentAuthDecision(payloadCheck.transferId);
  if (priorDecision === 'APPROVED') {
    authLog('idempotent_replay', {
      request_id: requestId,
      transfer_id: payloadCheck.transferId,
      externalReference: payloadCheck.externalReference,
      authorized: true,
      reason: 'prior_approved',
      duration_ms: Date.now() - started
    });
    return buildApproved({ idempotent: true });
  }

  if (!input.supabase) {
    authLog('supabase_missing', { request_id: requestId, transfer_id: payloadCheck.transferId });
    return buildRefused('SUPABASE_UNAVAILABLE');
  }

  const lookup = await findSaqueForAuth(input.supabase, payloadCheck);
  if (lookup.error) {
    authLog('lookup_failed', {
      request_id: requestId,
      transfer_id: payloadCheck.transferId,
      reason: lookup.error.message,
      duration_ms: Date.now() - started
    });
    return buildRefused('WITHDRAWAL_LOOKUP_FAILED');
  }

  const saqueRow = lookup.saque;
  const { netAmount } = parseSaqueAmounts(saqueRow || {});
  const logBase = {
    request_id: requestId,
    transfer_id: payloadCheck.transferId,
    externalReference: payloadCheck.externalReference,
    saque_id: saqueRow?.id ?? null,
    correlation_id: saqueRow?.correlation_id ?? null,
    amount: Number.isFinite(netAmount) ? netAmount : payloadCheck.transferValue
  };

  const business = evaluateSaqueForAuth(saqueRow, payloadCheck);
  if (!business.approved) {
    authLog('refused', {
      ...logBase,
      authorized: false,
      reason: business.reason,
      duration_ms: Date.now() - started
    });
    rememberAuthDecision(payloadCheck.transferId, 'REFUSED');
    return buildRefused(business.reason);
  }

  const ledgerCheck = await checkLedgerIntegrity(input.supabase, saqueRow);
  if (!ledgerCheck.ok) {
    authLog('refused', {
      ...logBase,
      authorized: false,
      reason: ledgerCheck.reason,
      duration_ms: Date.now() - started
    });
    rememberAuthDecision(payloadCheck.transferId, 'REFUSED');
    return buildRefused(ledgerCheck.reason);
  }

  const walletCheck = await checkWalletConsistency(input.supabase, saqueRow);
  if (!walletCheck.ok) {
    authLog('refused', {
      ...logBase,
      authorized: false,
      reason: walletCheck.reason,
      duration_ms: Date.now() - started
    });
    rememberAuthDecision(payloadCheck.transferId, 'REFUSED');
    return buildRefused(walletCheck.reason);
  }

  rememberAuthDecision(payloadCheck.transferId, 'APPROVED');

  authLog('approved', {
    ...logBase,
    authorized: true,
    reason: business.reason,
    duration_ms: Date.now() - started
  });

  if (typeof input.financeLog === 'function') {
    input.financeLog('asaas_transfer_auth_approved', {
      withdrawal_id: saqueRow.id,
      correlation_id: saqueRow.correlation_id,
      transfer_id: payloadCheck.transferId,
      tipo: 'saque'
    });
  }

  return buildApproved({
    saque_id: saqueRow.id,
    correlation_id: saqueRow.correlation_id,
    transfer_id: payloadCheck.transferId
  });
}

module.exports = {
  LOG_PREFIX,
  handleAsaasTransferAuthorization,
  validateAuthPayload,
  validateAuthToken,
  validateAuthIp,
  evaluateSaqueForAuth,
  findSaqueForAuth,
  checkLedgerIntegrity,
  checkWalletConsistency,
  buildApproved,
  buildRefused,
  rememberAuthDecision,
  getRecentAuthDecision,
  clearAuthDecisionCache: () => recentAuthDecisions.clear()
};
