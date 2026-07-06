'use strict';

const ASAAS_TERMINAL_FAIL = new Set(['failed', 'cancelled', 'canceled']);
const MP_TERMINAL_FAIL = new Set(['rejected', 'cancelled', 'canceled', 'failed', 'error']);

/**
 * Normaliza resposta de payout (MP ou Asaas) para persistência provider-aware.
 * @param {object} payoutResult
 * @param {string} [resolvedProviderName]
 */
function normalizePayoutResult(payoutResult, resolvedProviderName = 'mercadopago') {
  const provider =
    payoutResult?.provider ||
    (payoutResult?.transfer ? 'asaas' : null) ||
    resolvedProviderName ||
    'mercadopago';

  if (provider === 'asaas') {
    const transfer = payoutResult?.transfer ?? null;
    return {
      provider: 'asaas',
      id: payoutResult?.providerRef ?? transfer?.id ?? null,
      status: transfer?.status ?? null,
      raw: transfer
    };
  }

  return {
    provider: 'mercadopago',
    id: payoutResult?.data?.id ?? null,
    status: payoutResult?.data?.status ?? null,
    raw: payoutResult?.data?.sanitized ?? null
  };
}

/**
 * Patch Supabase additive-only — grava mp_* ou asaas_* conforme provider.
 * @param {ReturnType<typeof normalizePayoutResult>} normalized
 */
function buildProviderPersistencePatch(normalized) {
  const now = new Date().toISOString();
  if (normalized.provider === 'asaas') {
    const patch = {
      asaas_payout_raw: normalized.raw,
      last_asaas_sync_at: now,
      updated_at: now
    };
    if (normalized.id) patch.asaas_transfer_id = String(normalized.id);
    if (normalized.status) patch.asaas_transfer_status = String(normalized.status);
    return patch;
  }

  const patch = {
    mp_payout_raw: normalized.raw,
    last_mp_sync_at: now,
    updated_at: now
  };
  if (normalized.id) patch.mp_transaction_intent_id = normalized.id;
  if (normalized.status) patch.mp_payout_status = normalized.status;
  return patch;
}

function isPayoutTerminalFailure(normalized, payoutResult) {
  if (payoutResult?.success === false) {
    return true;
  }
  const st = String(normalized?.status || '').toLowerCase();
  if (normalized?.provider === 'asaas') {
    return ASAAS_TERMINAL_FAIL.has(st);
  }
  return MP_TERMINAL_FAIL.has(st);
}

function buildPayoutRollbackMotivo(normalized, payoutResult) {
  if (payoutResult?.success === false) {
    return normalized.provider === 'asaas' ? 'payout_asaas_erro' : 'payout_mp_erro';
  }
  const prefix = normalized.provider === 'asaas' ? 'payout_asaas' : 'payout_mp';
  return `${prefix}_${normalized.status || 'unknown'}`;
}

function buildPayoutSuccessFields(normalized) {
  if (normalized.provider === 'asaas') {
    return {
      provider: 'asaas',
      asaas_transfer_id: normalized.id,
      asaas_transfer_status: normalized.status
    };
  }
  return {
    provider: 'mercadopago',
    mp_transaction_intent_id: normalized.id,
    mp_payout_status: normalized.status
  };
}

module.exports = {
  normalizePayoutResult,
  buildProviderPersistencePatch,
  isPayoutTerminalFailure,
  buildPayoutRollbackMotivo,
  buildPayoutSuccessFields
};
