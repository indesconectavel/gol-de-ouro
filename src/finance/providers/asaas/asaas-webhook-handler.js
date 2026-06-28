'use strict';

const {
  validateAsaasWebhook,
  DECISION,
  isValidDecision
} = require('./asaas-webhook-validator');
const { isAsaasWebhookEnabled, asaasLog } = require('./asaas-config');

const HANDLER_PHASE_STUB = 'webhook_stub_v1';
const HANDLER_PHASE_LIVE = 'webhook_live_sandbox_v1';

function buildSuccessResponse(validation, phase) {
  return {
    handled: true,
    decision: validation.decision,
    success: true,
    financialEffect: false,
    phase,
    event: validation.eventType ?? validation.event ?? null,
    eventId: validation.eventId ?? null,
    category: validation.category ?? null,
    resourceId: validation.resourceId ?? null,
    paymentStatus: validation.paymentStatus ?? null,
    transferStatus: validation.transferStatus ?? null,
    sandboxEnv: validation.sandboxEnv,
    liveSandbox: validation.liveSandbox === true,
    message: validation.message
  };
}

/**
 * Handler Asaas — validação estrutural/local, sem wallet/ledger/HTTP financeiro.
 */
async function handleAsaasWebhook(input = {}) {
  if (!isAsaasWebhookEnabled()) {
    asaasLog('webhook_handler_ignored_disabled', { phase: HANDLER_PHASE_STUB });
    return {
      handled: false,
      decision: DECISION.IGNORED_DISABLED,
      success: false,
      financialEffect: false,
      phase: HANDLER_PHASE_STUB,
      message: 'Handler ignorado: ASAAS_WEBHOOK_ENABLED=false'
    };
  }

  const validation = validateAsaasWebhook(input);
  const phase = validation.liveSandbox ? HANDLER_PHASE_LIVE : HANDLER_PHASE_STUB;

  if (isValidDecision(validation.decision)) {
    return buildSuccessResponse(validation, phase);
  }

  return {
    handled: validation.decision !== DECISION.IGNORED_DISABLED,
    decision: validation.decision,
    success: validation.success === true,
    financialEffect: false,
    phase,
    error: validation.error,
    message: validation.message,
    event: validation.eventType ?? validation.event ?? null,
    eventId: validation.eventId ?? null,
    category: validation.category ?? null,
    resourceId: validation.resourceId ?? null,
    paymentStatus: validation.paymentStatus ?? null,
    transferStatus: validation.transferStatus ?? null
  };
}

module.exports = {
  HANDLER_PHASE_STUB,
  HANDLER_PHASE_LIVE,
  handleAsaasWebhook
};
