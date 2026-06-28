'use strict';

const { timingSafeEqual } = require('node:crypto');
const {
  getAsaasConfig,
  isAsaasWebhookEnabled,
  isAsaasWebhookStrictMode,
  isAsaasWebhookLiveSandboxActive,
  isAsaasSandboxEnv,
  maskWebhookTokenPreview,
  asaasLog
} = require('./asaas-config');

/** Header oficial Asaas — docs.asaas.com/docs/about-webhooks */
const ASAAS_WEBHOOK_AUTH_HEADER = 'asaas-access-token';

/**
 * Eventos documentados (pagamentos + transferências) — F4.2C mapeamento preparatório.
 * @see https://docs.asaas.com/docs/webhooks-events
 */
const KNOWN_PAYMENT_EVENTS = new Set([
  'PAYMENT_CREATED',
  'PAYMENT_UPDATED',
  'PAYMENT_CONFIRMED',
  'PAYMENT_RECEIVED',
  'PAYMENT_OVERDUE',
  'PAYMENT_DELETED',
  'PAYMENT_REFUNDED',
  'PAYMENT_REFUND_IN_PROGRESS',
  'PAYMENT_RESTORED',
  'PAYMENT_ANTICIPATED',
  'PAYMENT_AWAITING_RISK_ANALYSIS',
  'PAYMENT_APPROVED_BY_RISK_ANALYSIS',
  'PAYMENT_REPROVED_BY_RISK_ANALYSIS'
]);

const KNOWN_TRANSFER_EVENTS = new Set([
  'TRANSFER_CREATED',
  'TRANSFER_PENDING',
  'TRANSFER_IN_BANK_PROCESSING',
  'TRANSFER_BLOCKED',
  'TRANSFER_DONE',
  'TRANSFER_FAILED',
  'TRANSFER_CANCELLED'
]);

const KNOWN_EVENTS = new Set([...KNOWN_PAYMENT_EVENTS, ...KNOWN_TRANSFER_EVENTS]);

const DECISION = {
  IGNORED_DISABLED: 'IGNORED_DISABLED',
  IGNORED_UNKNOWN_EVENT: 'IGNORED_UNKNOWN_EVENT',
  VALID_SIMULATED_EVENT: 'VALID_SIMULATED_EVENT',
  VALID_SANDBOX_EVENT: 'VALID_SANDBOX_EVENT',
  VALID_SANDBOX_PAYMENT_EVENT: 'VALID_SANDBOX_PAYMENT_EVENT',
  VALID_SANDBOX_TRANSFER_EVENT: 'VALID_SANDBOX_TRANSFER_EVENT',
  INVALID_SIGNATURE_OR_TOKEN: 'INVALID_SIGNATURE_OR_TOKEN',
  INVALID_PAYLOAD: 'INVALID_PAYLOAD'
};

const VALID_DECISIONS = new Set([
  DECISION.VALID_SIMULATED_EVENT,
  DECISION.VALID_SANDBOX_EVENT,
  DECISION.VALID_SANDBOX_PAYMENT_EVENT,
  DECISION.VALID_SANDBOX_TRANSFER_EVENT
]);

function resolveValidDecision(classification) {
  if (isAsaasWebhookLiveSandboxActive()) {
    if (classification.category === 'payment') {
      return DECISION.VALID_SANDBOX_PAYMENT_EVENT;
    }
    if (classification.category === 'transfer') {
      return DECISION.VALID_SANDBOX_TRANSFER_EVENT;
    }
    return DECISION.VALID_SANDBOX_EVENT;
  }
  return DECISION.VALID_SIMULATED_EVENT;
}

function isValidDecision(decision) {
  return VALID_DECISIONS.has(decision);
}

function normalizeHeaders(headers = {}) {
  const normalized = {};
  for (const [key, value] of Object.entries(headers || {})) {
    if (value == null) continue;
    normalized[String(key).toLowerCase()] = Array.isArray(value) ? value[0] : String(value);
  }
  return normalized;
}

function extractBody(input) {
  if (input == null) return null;
  if (typeof input !== 'object') return null;
  if (input.body != null && typeof input.body === 'object') {
    return input.body;
  }
  if (Object.prototype.hasOwnProperty.call(input, 'event')) {
    return input;
  }
  return input;
}

function safeEqualToken(provided, expected) {
  if (!provided || !expected) return false;
  const a = Buffer.from(String(provided));
  const b = Buffer.from(String(expected));
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function classifyEventType(eventName) {
  if (!eventName || typeof eventName !== 'string') {
    return { category: 'unknown', known: false };
  }
  const normalized = eventName.trim().toUpperCase();
  if (KNOWN_PAYMENT_EVENTS.has(normalized)) {
    return { category: 'payment', known: true, event: normalized };
  }
  if (KNOWN_TRANSFER_EVENTS.has(normalized)) {
    return { category: 'transfer', known: true, event: normalized };
  }
  return { category: 'unknown', known: false, event: normalized };
}

function validateWebhookToken(headers, config = getAsaasConfig()) {
  const normalizedHeaders = normalizeHeaders(headers);
  const headerToken = normalizedHeaders[ASAAS_WEBHOOK_AUTH_HEADER] ?? null;

  if (!isAsaasWebhookStrictMode()) {
    return {
      valid: true,
      skipped: true,
      headerPresent: Boolean(headerToken),
      tokenPreview: headerToken ? maskWebhookTokenPreview(headerToken) : null
    };
  }

  if (!config.webhookToken) {
    return {
      valid: false,
      error: 'ASAAS_WEBHOOK_TOKEN_MISSING',
      message: 'Modo strict: ASAAS_WEBHOOK_TOKEN ausente',
      headerPresent: Boolean(headerToken)
    };
  }

  if (!headerToken) {
    return {
      valid: false,
      error: 'ASAAS_WEBHOOK_TOKEN_HEADER_MISSING',
      message: `Header ${ASAAS_WEBHOOK_AUTH_HEADER} ausente`
    };
  }

  if (!safeEqualToken(headerToken, config.webhookToken)) {
    return {
      valid: false,
      error: 'ASAAS_WEBHOOK_TOKEN_MISMATCH',
      message: 'Token do webhook não confere',
      tokenPreview: maskWebhookTokenPreview(headerToken)
    };
  }

  return {
    valid: true,
    tokenPreview: maskWebhookTokenPreview(headerToken)
  };
}

function validatePayloadStructure(body) {
  if (body == null || typeof body !== 'object') {
    return {
      valid: false,
      error: 'ASAAS_WEBHOOK_EMPTY_BODY',
      message: 'Payload ausente ou inválido'
    };
  }

  const keys = Object.keys(body);
  if (keys.length === 0) {
    return {
      valid: false,
      error: 'ASAAS_WEBHOOK_EMPTY_BODY',
      message: 'Payload vazio'
    };
  }

  const eventName = body.event;
  if (!eventName || typeof eventName !== 'string' || String(eventName).trim() === '') {
    return {
      valid: false,
      error: 'ASAAS_WEBHOOK_MISSING_EVENT',
      message: 'Campo event ausente ou inválido'
    };
  }

  const eventId = body.id;
  if (eventId == null || String(eventId).trim() === '') {
    return {
      valid: false,
      error: 'ASAAS_WEBHOOK_MISSING_EVENT_ID',
      message: 'Campo id (event id) ausente ou inválido'
    };
  }

  return {
    valid: true,
    event: String(eventName).trim().toUpperCase(),
    eventId: String(eventId).trim()
  };
}

function summarizePayloadForLog(body, classification) {
  return {
    eventType: classification.event ?? body?.event ?? null,
    eventId: body?.id ? String(body.id).slice(0, 48) : null,
    category: classification.category,
    resourceId:
      body?.payment?.id?.slice?.(0, 24) ??
      body?.transfer?.id?.slice?.(0, 24) ??
      null,
    paymentStatus: body?.payment?.status ?? null,
    transferStatus: body?.transfer?.status ?? null
  };
}

/**
 * Validação estrutural de webhook Asaas — sem efeitos financeiros.
 */
function validateAsaasWebhook(input = {}) {
  if (!isAsaasWebhookEnabled()) {
    asaasLog('webhook_ignored_disabled', { decision: DECISION.IGNORED_DISABLED });
    return {
      valid: false,
      decision: DECISION.IGNORED_DISABLED,
      success: false,
      financialEffect: false,
      message: 'Webhook Asaas ignorado: ASAAS_WEBHOOK_ENABLED=false'
    };
  }

  const config = getAsaasConfig();
  const headers = input.headers ?? input.req?.headers ?? {};
  const body = extractBody(input.body != null ? input : input.req ?? input);

  const payloadCheck = validatePayloadStructure(body);
  if (!payloadCheck.valid) {
    asaasLog('webhook_invalid_payload', {
      decision: DECISION.INVALID_PAYLOAD,
      error: payloadCheck.error
    });
    return {
      valid: false,
      decision: DECISION.INVALID_PAYLOAD,
      success: false,
      financialEffect: false,
      error: payloadCheck.error,
      message: payloadCheck.message
    };
  }

  const tokenCheck = validateWebhookToken(headers, config);
  if (!tokenCheck.valid) {
    asaasLog('webhook_invalid_token', {
      decision: DECISION.INVALID_SIGNATURE_OR_TOKEN,
      error: tokenCheck.error,
      tokenPreview: tokenCheck.tokenPreview ?? null
    });
    return {
      valid: false,
      decision: DECISION.INVALID_SIGNATURE_OR_TOKEN,
      success: false,
      financialEffect: false,
      error: tokenCheck.error,
      message: tokenCheck.message
    };
  }

  const classification = classifyEventType(payloadCheck.event);
  const summary = summarizePayloadForLog(body, classification);

  if (!classification.known) {
    asaasLog('webhook_unknown_event', {
      decision: DECISION.IGNORED_UNKNOWN_EVENT,
      ...summary,
      env: config.env
    });
    return {
      valid: false,
      decision: DECISION.IGNORED_UNKNOWN_EVENT,
      success: false,
      financialEffect: false,
      message: `Evento não mapeado: ${classification.event}`,
      ...summary,
      sandboxEnv: isAsaasSandboxEnv()
    };
  }

  const decision = resolveValidDecision(classification);

  asaasLog('webhook_valid_event', {
    decision,
    ...summary,
    env: config.env,
    tokenPreview: tokenCheck.tokenPreview ?? null,
    strictMode: isAsaasWebhookStrictMode(),
    liveSandbox: isAsaasWebhookLiveSandboxActive()
  });

  return {
    valid: true,
    decision,
    success: true,
    financialEffect: false,
    message:
      decision === DECISION.VALID_SIMULATED_EVENT
        ? 'Evento simulado validado — sem processamento financeiro'
        : 'Evento sandbox validado — sem processamento financeiro',
    ...summary,
    sandboxEnv: isAsaasSandboxEnv(),
    strictMode: isAsaasWebhookStrictMode(),
    liveSandbox: isAsaasWebhookLiveSandboxActive()
  };
}

module.exports = {
  ASAAS_WEBHOOK_AUTH_HEADER,
  DECISION,
  VALID_DECISIONS,
  KNOWN_EVENTS,
  KNOWN_PAYMENT_EVENTS,
  KNOWN_TRANSFER_EVENTS,
  classifyEventType,
  isValidDecision,
  resolveValidDecision,
  validateAsaasWebhook,
  validatePayloadStructure,
  validateWebhookToken
};
