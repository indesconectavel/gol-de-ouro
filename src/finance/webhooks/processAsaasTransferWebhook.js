'use strict';

const { classifyEventType } = require('../providers/asaas/asaas-webhook-validator');
const { asaasLog } = require('../providers/asaas/asaas-config');
const {
  normalizeAsaasTransferWebhook,
  TERMINAL_FAIL,
  ASAAS_TRANSFER_STATUSES
} = require('../providers/asaas/asaas-transfer-webhook-normalizer');
const {
  createLedgerEntry,
  rollbackWithdraw,
  payoutCounters
} = require('../../domain/payout/processPendingWithdrawals');

const SAQUE_SELECT =
  'id, usuario_id, status, amount, valor, fee, net_amount, correlation_id, payout_external_reference, asaas_transfer_id, asaas_transfer_status, mp_transaction_intent_id';
const TERMINAL_SAQUE_STATUSES = new Set(['processado', 'falhou', 'cancelado', 'pago_manual', 'cancelado_manual']);

function isTerminalSaqueStatus(status) {
  return TERMINAL_SAQUE_STATUSES.has(String(status || '').toLowerCase());
}

function buildAsaasPersistencePatch(event) {
  const now = new Date().toISOString();
  const patch = {
    asaas_payout_raw: event.sanitizedTransfer,
    last_asaas_sync_at: now,
    updated_at: now
  };
  if (event.transferId) {
    patch.asaas_transfer_id = event.transferId;
  }
  if (event.transferStatus) {
    patch.asaas_transfer_status = event.transferStatus;
  }
  return patch;
}

async function findSaqueForTransfer(supabase, event) {
  if (event.transferId) {
    const byId = await supabase
      .from('saques')
      .select(SAQUE_SELECT)
      .eq('asaas_transfer_id', event.transferId)
      .maybeSingle();
    if (byId.error) {
      return { error: byId.error };
    }
    if (byId.data?.id) {
      return { saque: byId.data, matchedBy: 'asaas_transfer_id' };
    }
  }

  if (event.externalReference) {
    const byRef = await supabase
      .from('saques')
      .select(SAQUE_SELECT)
      .eq('payout_external_reference', event.externalReference)
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

function isIdempotentReplay(saqueRow, event) {
  const prevStatus = String(saqueRow.asaas_transfer_status || '').toUpperCase();
  const nextStatus = String(event.transferStatus || '').toUpperCase();
  const prevSaque = String(saqueRow.status || '').toLowerCase();
  const targetSaque = event.saqueStatusTarget;

  if (prevStatus && nextStatus && prevStatus === nextStatus) {
    if (!targetSaque || prevSaque === targetSaque) {
      return true;
    }
  }

  if (isTerminalSaqueStatus(prevSaque) && targetSaque && prevSaque === targetSaque) {
    return true;
  }

  return false;
}

function parseSaqueAmounts(saqueRow) {
  const amount = parseFloat(saqueRow.amount ?? saqueRow.valor ?? 0);
  const fee = parseFloat(saqueRow.fee ?? 0);
  const netAmount = parseFloat(saqueRow.net_amount ?? (amount - fee));
  return { amount, fee, netAmount };
}

async function findExistingTerminalLedger(supabase, correlationId, saqueId) {
  const { data, error } = await supabase
    .from('ledger_financeiro')
    .select('id, tipo')
    .eq('correlation_id', correlationId)
    .eq('referencia', saqueId)
    .in('tipo', ['payout_confirmado', 'falha_payout'])
    .maybeSingle();
  if (error) {
    return { error };
  }
  return { existing: data };
}

async function applyTerminalLedgerReconciliation({
  supabase,
  saqueRow,
  event,
  financeLog
}) {
  const correlationId = saqueRow.correlation_id;
  const saqueId = saqueRow.id;
  const userId = saqueRow.usuario_id;
  const { amount, fee, netAmount } = parseSaqueAmounts(saqueRow);
  const transferSt = String(event.transferStatus || '').toUpperCase();

  const ledgerLookup = await findExistingTerminalLedger(supabase, correlationId, saqueId);
  if (ledgerLookup.error) {
    return {
      success: false,
      error: 'LEDGER_LOOKUP_FAILED',
      message: ledgerLookup.error.message,
      financialEffect: false
    };
  }
  if (ledgerLookup.existing?.id) {
    financeLog('withdraw_webhook_duplicate', {
      provider: 'asaas',
      correlation_id: correlationId,
      payment_id: saqueId,
      user_id: userId,
      tipo: 'saque',
      status: 'idempotent',
      ledger_tipo: ledgerLookup.existing.tipo,
      valor: netAmount
    });
    return {
      success: true,
      ledgerIdempotent: true,
      ledgerTipo: ledgerLookup.existing.tipo,
      financialEffect: false
    };
  }

  if (transferSt === ASAAS_TRANSFER_STATUSES.DONE) {
    const ledgerPayout = await createLedgerEntry({
      supabase,
      tipo: 'payout_confirmado',
      usuarioId: userId,
      valor: netAmount,
      referencia: saqueId,
      correlationId
    });
    if (!ledgerPayout.success) {
      return {
        success: false,
        error: 'PAYOUT_CONFIRMADO_LEDGER_FAILED',
        message: ledgerPayout.error?.message,
        financialEffect: false
      };
    }
    payoutCounters.success++;
    financeLog('withdraw_webhook_confirmed', {
      provider: 'asaas',
      correlation_id: correlationId,
      payment_id: saqueId,
      user_id: userId,
      tipo: 'saque',
      status: 'processado',
      valor: netAmount,
      transfer_id: event.transferId
    });
    return {
      success: true,
      ledgerTipo: 'payout_confirmado',
      ledgerDeduped: ledgerPayout.deduped === true,
      financialEffect: ledgerPayout.deduped !== true
    };
  }

  if (TERMINAL_FAIL.has(transferSt)) {
    const ledgerFail = await createLedgerEntry({
      supabase,
      tipo: 'falha_payout',
      usuarioId: userId,
      valor: netAmount,
      referencia: saqueId,
      correlationId
    });
    if (!ledgerFail.success) {
      return {
        success: false,
        error: 'FALHA_PAYOUT_LEDGER_FAILED',
        message: ledgerFail.error?.message,
        financialEffect: false
      };
    }
    const rb = await rollbackWithdraw({
      supabase,
      saqueId,
      userId,
      correlationId,
      amount,
      fee,
      motivo: `payout_asaas_${transferSt.toLowerCase()}`
    });
    if (!rb.success) {
      return {
        success: false,
        error: 'ROLLBACK_FAILED',
        message: rb.error?.message,
        rollbackResult: rb,
        financialEffect: false
      };
    }
    payoutCounters.fail++;
    financeLog('withdraw_webhook_failed_rollback', {
      provider: 'asaas',
      correlation_id: correlationId,
      payment_id: saqueId,
      user_id: userId,
      tipo: 'saque',
      status: 'falhou',
      valor: netAmount,
      transfer_id: event.transferId,
      transfer_status: transferSt
    });
    return {
      success: true,
      ledgerTipo: 'falha_payout',
      ledgerDeduped: ledgerFail.deduped === true,
      rollbackApplied: true,
      financialEffect: ledgerFail.deduped !== true
    };
  }

  return { success: true, financialEffect: false, ledgerSkipped: true };
}

/**
 * Processa webhook Asaas TRANSFER_* — atualiza saques.asaas_* + reconciliação ledger (P1.5I).
 */
async function processAsaasTransferWebhook(input = {}) {
  const { validation, body, supabase, financeLog = () => {} } = input;

  if (!supabase) {
    return {
      success: false,
      provider: 'asaas',
      category: 'transfer',
      error: 'SUPABASE_REQUIRED',
      message: 'Supabase ausente para processamento de transferência',
      financialEffect: false
    };
  }

  const normalized = normalizeAsaasTransferWebhook({ validation, body });
  if (normalized.rejected) {
    return {
      success: false,
      provider: 'asaas',
      category: 'transfer',
      rejected: true,
      httpStatus: 401,
      error: normalized.reason,
      financialEffect: false
    };
  }

  if (normalized.ignored || !normalized.success || !normalized.event) {
    return {
      success: true,
      provider: 'asaas',
      category: 'transfer',
      ignored: true,
      reason: normalized.reason,
      financialEffect: false
    };
  }

  const event = normalized.event;

  if (!event.transferId && !event.externalReference) {
    return {
      success: false,
      provider: 'asaas',
      category: 'transfer',
      error: 'TRANSFER_IDENTIFIER_MISSING',
      httpStatus: 422,
      message: 'transfer.id ou transfer.externalReference obrigatório',
      financialEffect: false
    };
  }

  const lookup = await findSaqueForTransfer(supabase, event);
  if (lookup.error) {
    return {
      success: false,
      provider: 'asaas',
      category: 'transfer',
      error: 'SAQUE_LOOKUP_FAILED',
      message: lookup.error.message,
      financialEffect: false
    };
  }

  if (!lookup.saque?.id) {
    asaasLog('transfer_webhook_saque_not_found', {
      transferId: event.transferId ? String(event.transferId).slice(0, 24) : null,
      externalReference: event.externalReference
        ? String(event.externalReference).slice(0, 32)
        : null,
      eventType: event.eventType
    });
    return {
      success: false,
      provider: 'asaas',
      category: 'transfer',
      error: 'WITHDRAWAL_NOT_FOUND',
      httpStatus: 404,
      message: 'Saque não encontrado para transferência',
      financialEffect: false,
      controlled: true
    };
  }

  const saqueRow = lookup.saque;
  const previousTransferStatus = saqueRow.asaas_transfer_status ?? null;
  const previousSaqueStatus = saqueRow.status ?? null;

  if (
    event.transferId &&
    saqueRow.asaas_transfer_id &&
    String(saqueRow.asaas_transfer_id) !== String(event.transferId)
  ) {
    return {
      success: false,
      provider: 'asaas',
      category: 'transfer',
      error: 'TRANSFER_ID_MISMATCH',
      httpStatus: 409,
      message: 'asaas_transfer_id divergente do persistido',
      financialEffect: false,
      saqueId: saqueRow.id
    };
  }

  if (isIdempotentReplay(saqueRow, event)) {
    financeLog('withdraw_webhook_transfer_idempotent', {
      provider: 'asaas',
      saque_id: saqueRow.id,
      transfer_id: event.transferId,
      status_previous: previousTransferStatus,
      status_new: event.transferStatus,
      replay: true
    });
    asaasLog('transfer_webhook_idempotent_replay', {
      saqueId: saqueRow.id,
      transferId: event.transferId ? String(event.transferId).slice(0, 24) : null,
      transferStatus: event.transferStatus,
      saqueStatus: previousSaqueStatus
    });
    return {
      success: true,
      provider: 'asaas',
      category: 'transfer',
      idempotent: true,
      replay: true,
      event,
      saqueId: saqueRow.id,
      previousTransferStatus,
      transferStatus: event.transferStatus,
      financialEffect: false
    };
  }

  const patch = buildAsaasPersistencePatch(event);
  const statusPatch = {};
  if (event.saqueStatusTarget && !isTerminalSaqueStatus(previousSaqueStatus)) {
    statusPatch.status = event.saqueStatusTarget;
  } else if (event.saqueStatusTarget && isTerminalSaqueStatus(previousSaqueStatus)) {
    // Saque já terminal — só sincroniza asaas_* sem regredir status
    asaasLog('transfer_webhook_status_preserved_terminal', {
      saqueId: saqueRow.id,
      saqueStatus: previousSaqueStatus,
      incomingTransferStatus: event.transferStatus
    });
  }

  const { error: updateError } = await supabase
    .from('saques')
    .update({ ...patch, ...statusPatch })
    .eq('id', saqueRow.id);

  if (updateError) {
    return {
      success: false,
      provider: 'asaas',
      category: 'transfer',
      error: 'SAQUE_UPDATE_FAILED',
      message: updateError.message,
      financialEffect: false,
      saqueId: saqueRow.id
    };
  }

  financeLog('withdraw_webhook_transfer_sync', {
    provider: 'asaas',
    saque_id: saqueRow.id,
    transfer_id: event.transferId,
    matched_by: lookup.matchedBy,
    status_previous: previousTransferStatus,
    status_new: event.transferStatus,
    saque_status_previous: previousSaqueStatus,
    saque_status_new: statusPatch.status || previousSaqueStatus,
    event_type: event.eventType
  });

  asaasLog('transfer_webhook_applied', {
    saqueId: saqueRow.id,
    transferId: event.transferId ? String(event.transferId).slice(0, 24) : null,
    transferStatus: event.transferStatus,
    saqueStatus: statusPatch.status || previousSaqueStatus,
    matchedBy: lookup.matchedBy
  });

  const transferSt = String(event.transferStatus || '').toUpperCase();
  const isTerminal =
    transferSt === ASAAS_TRANSFER_STATUSES.DONE || TERMINAL_FAIL.has(transferSt);

  let ledgerResult = { success: true, financialEffect: false, ledgerSkipped: true };
  if (isTerminal && saqueRow.correlation_id) {
    ledgerResult = await applyTerminalLedgerReconciliation({
      supabase,
      saqueRow,
      event,
      financeLog
    });
    if (!ledgerResult.success) {
      return {
        success: false,
        provider: 'asaas',
        category: 'transfer',
        error: ledgerResult.error,
        message: ledgerResult.message,
        financialEffect: false,
        saqueId: saqueRow.id,
        rollbackResult: ledgerResult.rollbackResult
      };
    }
  }

  return {
    success: true,
    provider: 'asaas',
    category: 'transfer',
    event,
    saqueId: saqueRow.id,
    matchedBy: lookup.matchedBy,
    previousTransferStatus,
    transferStatus: event.transferStatus,
    saqueStatus: statusPatch.status || previousSaqueStatus,
    terminalFail: TERMINAL_FAIL.has(transferSt),
    terminalSuccess: transferSt === ASAAS_TRANSFER_STATUSES.DONE,
    ledgerTipo: ledgerResult.ledgerTipo ?? null,
    ledgerIdempotent: ledgerResult.ledgerIdempotent === true,
    ledgerDeduped: ledgerResult.ledgerDeduped === true,
    rollbackApplied: ledgerResult.rollbackApplied === true,
    financialEffect: ledgerResult.financialEffect === true
  };
}

function isAsaasTransferWebhookEvent(body = {}) {
  const eventName = String(body.event || '').trim().toUpperCase();
  if (!eventName) {
    return false;
  }
  return classifyEventType(eventName).category === 'transfer';
}

module.exports = {
  processAsaasTransferWebhook,
  isAsaasTransferWebhookEvent,
  buildAsaasPersistencePatch,
  findSaqueForTransfer,
  isIdempotentReplay,
  findExistingTerminalLedger,
  applyTerminalLedgerReconciliation,
  SAQUE_SELECT
};
