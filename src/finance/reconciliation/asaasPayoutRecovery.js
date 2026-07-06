'use strict';

const { getTransfer } = require('../providers/asaas/asaas-http-client');
const { isAsaasPayoutReconcileReadEnabled, asaasLog } = require('../providers/asaas/asaas-config');
const { DECISION } = require('../providers/asaas/asaas-webhook-validator');
const {
  ASAAS_TRANSFER_STATUSES,
  PENDING_LIKE
} = require('../providers/asaas/asaas-transfer-webhook-normalizer');
const { processAsaasTransferWebhook } = require('../webhooks/processAsaasTransferWebhook');

const TERMINAL_RECOVERY_STATUSES = new Set([
  ASAAS_TRANSFER_STATUSES.DONE,
  ASAAS_TRANSFER_STATUSES.FAILED,
  ASAAS_TRANSFER_STATUSES.CANCELLED,
  ASAAS_TRANSFER_STATUSES.BLOCKED
]);

const STATUS_TO_EVENT = {
  [ASAAS_TRANSFER_STATUSES.DONE]: 'TRANSFER_DONE',
  [ASAAS_TRANSFER_STATUSES.FAILED]: 'TRANSFER_FAILED',
  [ASAAS_TRANSFER_STATUSES.CANCELLED]: 'TRANSFER_CANCELLED',
  [ASAAS_TRANSFER_STATUSES.BLOCKED]: 'TRANSFER_BLOCKED',
  [ASAAS_TRANSFER_STATUSES.BANK_PROCESSING]: 'TRANSFER_IN_BANK_PROCESSING',
  [ASAAS_TRANSFER_STATUSES.PENDING]: 'TRANSFER_PENDING'
};

const SAQUE_RECOVERY_SELECT =
  'id, usuario_id, status, amount, valor, fee, net_amount, correlation_id, payout_external_reference, asaas_transfer_id, asaas_transfer_status, updated_at';

function parseRecoveryLimit() {
  const raw = parseInt(process.env.ASAAS_PAYOUT_RECOVERY_LIMIT || '20', 10);
  return Number.isFinite(raw) && raw > 0 ? Math.min(raw, 100) : 20;
}

function parseRecoveryMinAgeMin() {
  const raw = parseInt(process.env.ASAAS_PAYOUT_RECOVERY_MIN_AGE_MIN || '1', 10);
  return Number.isFinite(raw) && raw >= 0 ? Math.min(raw, 120) : 1;
}

function isAsaasPayoutRecoveryEnabled() {
  if (String(process.env.ASAAS_PAYOUT_RECOVERY_ENABLED || '').trim().toLowerCase() === 'false') {
    return false;
  }
  return isAsaasPayoutReconcileReadEnabled();
}

function buildRecoveryWebhookPayload(transferData = {}) {
  const status = String(transferData.status || '').trim().toUpperCase();
  const eventName = STATUS_TO_EVENT[status] || 'TRANSFER_PENDING';
  return {
    validation: {
      decision: DECISION.VALID_SIMULATED_EVENT,
      eventType: eventName,
      eventId: `recovery_${transferData.id || 'unknown'}_${Date.now()}`,
      resourceId: transferData.id ? String(transferData.id) : null,
      transferStatus: status
    },
    body: {
      id: `recovery_${transferData.id || 'unknown'}`,
      event: eventName,
      transfer: transferData
    }
  };
}

/**
 * Reconcilia um saque individual consultando GET /v3/transfers/{id} (P1.8).
 */
async function reconcileSingleAsaasPayout(input = {}) {
  const {
    supabase,
    saqueRow,
    financeLog = () => {},
    getTransferFn = getTransfer,
    processWebhookFn = processAsaasTransferWebhook
  } = input;

  if (!supabase || !saqueRow?.id) {
    return { success: false, error: 'INVALID_INPUT', skipped: true };
  }

  const transferId = saqueRow.asaas_transfer_id;
  if (!transferId) {
    return { success: true, skipped: true, reason: 'NO_TRANSFER_ID' };
  }

  if (String(saqueRow.status || '').toLowerCase() !== 'aguardando_confirmacao') {
    return { success: true, skipped: true, reason: 'SAQUE_NOT_PENDING', saqueId: saqueRow.id };
  }

  const apiResult = await getTransferFn(transferId, { httpGate: 'payoutReconcile' });
  if (!apiResult.success) {
    asaasLog('payout_recovery_get_transfer_failed', {
      saqueId: saqueRow.id,
      transferId: String(transferId).slice(0, 24),
      error: apiResult.error
    });
    return {
      success: false,
      error: apiResult.error || 'GET_TRANSFER_FAILED',
      message: apiResult.message,
      saqueId: saqueRow.id,
      transferId
    };
  }

  const transferData = apiResult.data || apiResult.transfer || {};
  const providerStatus = String(transferData.status || '').trim().toUpperCase();

  if (String(transferData.id || '') && String(transferData.id) !== String(transferId)) {
    return {
      success: false,
      error: 'TRANSFER_ID_MISMATCH',
      saqueId: saqueRow.id,
      transferId,
      providerTransferId: transferData.id
    };
  }

  if (
    transferData.externalReference &&
    saqueRow.payout_external_reference &&
    String(transferData.externalReference) !== String(saqueRow.payout_external_reference)
  ) {
    return {
      success: false,
      error: 'EXTERNAL_REFERENCE_MISMATCH',
      saqueId: saqueRow.id,
      transferId
    };
  }

  if (PENDING_LIKE.has(providerStatus) || providerStatus === ASAAS_TRANSFER_STATUSES.PENDING) {
    financeLog('payout_recovery_skip_pending', {
      provider: 'asaas',
      saque_id: saqueRow.id,
      transfer_id: transferId,
      provider_status: providerStatus
    });
    return {
      success: true,
      skipped: true,
      reason: 'PROVIDER_PENDING',
      saqueId: saqueRow.id,
      transferId,
      providerStatus
    };
  }

  if (!TERMINAL_RECOVERY_STATUSES.has(providerStatus)) {
    return {
      success: true,
      skipped: true,
      reason: 'NON_TERMINAL_STATUS',
      saqueId: saqueRow.id,
      transferId,
      providerStatus
    };
  }

  const { validation, body } = buildRecoveryWebhookPayload(transferData);
  const result = await processWebhookFn({
    validation,
    body,
    supabase,
    financeLog,
    recoverySource: 'recovery_job'
  });

  financeLog('payout_recovery_applied', {
    provider: 'asaas',
    saque_id: saqueRow.id,
    transfer_id: transferId,
    provider_status: providerStatus,
    success: result.success === true,
    idempotent: result.idempotent === true || result.ledgerIdempotent === true,
    terminal_success: result.terminalSuccess === true,
    terminal_fail: result.terminalFail === true,
    financial_effect: result.financialEffect === true
  });

  return {
    ...result,
    saqueId: saqueRow.id,
    transferId,
    providerStatus,
    recoverySource: 'recovery_job'
  };
}

/**
 * Ciclo de recovery: saques aguardando_confirmacao com asaas_transfer_id (P1.8).
 */
async function reconcileAsaasPendingPayouts(input = {}) {
  const {
    supabase,
    financeLog = () => {},
    getTransferFn = getTransfer,
    processWebhookFn = processAsaasTransferWebhook,
    limit = parseRecoveryLimit(),
    minAgeMin = parseRecoveryMinAgeMin()
  } = input;

  if (!isAsaasPayoutRecoveryEnabled()) {
    return { success: true, skipped: true, reason: 'RECOVERY_DISABLED', processed: 0 };
  }

  if (!supabase) {
    return { success: false, error: 'SUPABASE_REQUIRED', processed: 0 };
  }

  const sinceIso =
    minAgeMin > 0 ? new Date(Date.now() - minAgeMin * 60 * 1000).toISOString() : null;

  financeLog('payout_recovery_cycle_start', {
    provider: 'asaas',
    limit,
    min_age_min: minAgeMin
  });

  let query = supabase
    .from('saques')
    .select(SAQUE_RECOVERY_SELECT)
    .eq('status', 'aguardando_confirmacao')
    .not('asaas_transfer_id', 'is', null)
    .order('updated_at', { ascending: true })
    .limit(limit);

  if (sinceIso) {
    query = query.lt('updated_at', sinceIso);
  }

  const { data: pendingRows, error: listError } = await query;

  if (listError) {
    asaasLog('payout_recovery_list_failed', { error: listError.message });
    return { success: false, error: 'LIST_FAILED', message: listError.message, processed: 0 };
  }

  if (!pendingRows || pendingRows.length === 0) {
    financeLog('payout_recovery_cycle_empty', { provider: 'asaas' });
    return { success: true, processed: 0, reconciled: 0, skipped: 0, failed: 0 };
  }

  const summary = { processed: 0, reconciled: 0, skipped: 0, failed: 0, results: [] };

  for (const row of pendingRows) {
    summary.processed++;
    try {
      const one = await reconcileSingleAsaasPayout({
        supabase,
        saqueRow: row,
        financeLog,
        getTransferFn,
        processWebhookFn
      });

      if (one.skipped) {
        summary.skipped++;
      } else if (one.success && (one.terminalSuccess || one.terminalFail || one.financialEffect)) {
        summary.reconciled++;
      } else if (one.success && (one.idempotent || one.ledgerIdempotent)) {
        summary.reconciled++;
      } else if (!one.success) {
        summary.failed++;
      } else {
        summary.skipped++;
      }

      summary.results.push({
        saqueId: row.id,
        transferId: row.asaas_transfer_id,
        success: one.success,
        skipped: one.skipped === true,
        reason: one.reason || one.error || null,
        terminalSuccess: one.terminalSuccess === true,
        terminalFail: one.terminalFail === true,
        idempotent: one.idempotent === true || one.ledgerIdempotent === true
      });
    } catch (err) {
      summary.failed++;
      summary.results.push({
        saqueId: row.id,
        transferId: row.asaas_transfer_id,
        success: false,
        error: err?.message || 'unexpected_error'
      });
      asaasLog('payout_recovery_unexpected_error', {
        saqueId: row.id,
        error: err?.message
      });
    }
  }

  financeLog('payout_recovery_cycle_end', {
    provider: 'asaas',
    ...summary,
    results: undefined
  });

  return { success: true, ...summary };
}

module.exports = {
  SAQUE_RECOVERY_SELECT,
  TERMINAL_RECOVERY_STATUSES,
  STATUS_TO_EVENT,
  isAsaasPayoutRecoveryEnabled,
  buildRecoveryWebhookPayload,
  reconcileSingleAsaasPayout,
  reconcileAsaasPendingPayouts
};
