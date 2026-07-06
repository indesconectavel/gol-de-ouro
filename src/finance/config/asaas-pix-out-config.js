'use strict';

/**
 * P1.5B — Configuração centralizada PIX OUT Asaas (sandbox + produção).
 * Módulo autossuficiente — sem importar asaas-config (evita dependência circular).
 *
 * Env:
 *   ASAAS_PIX_OUT_ENABLED
 *   ALLOW_ASAAS_SANDBOX_PIX_OUT
 *   ASAAS_PIX_OUT_PRODUCTION_ENABLED
 *   PAYMENT_ENGINE_PIXOUT_ENABLED
 */

const PIX_OUT_PRODUCTION_PHASE = 'pix_out_production_http_v1';
const PIX_OUT_PRODUCTION_TRANSFERS_PATH = '/transfers';

function isTruthyEnv(name) {
  return String(process.env[name] || '').trim().toLowerCase() === 'true';
}

function readEnv(name) {
  const value = process.env[name];
  if (value == null || String(value).trim() === '') {
    return null;
  }
  return String(value).trim();
}

function isAsaasEnabled() {
  return isTruthyEnv('ASAAS_ENABLED');
}

function isAsaasSandboxAuthAllowed() {
  return String(process.env.ALLOW_ASAAS_SANDBOX_AUTH || '').trim() === '1';
}

function isAsaasSandboxEnv() {
  return String(readEnv('ASAAS_ENV') || 'sandbox').trim().toLowerCase() === 'sandbox';
}

function isProductionNodeEnv() {
  return String(process.env.NODE_ENV || '').trim().toLowerCase() === 'production';
}

function isAsaasHttpEnabled() {
  return isAsaasEnabled() && isAsaasSandboxAuthAllowed() && isAsaasSandboxEnv();
}

function hasValidAsaasApiKey(apiKey = readEnv('ASAAS_API_KEY')) {
  return Boolean(apiKey && String(apiKey).trim().length > 0);
}

function isAsaasPixOutEnabled() {
  return isTruthyEnv('ASAAS_PIX_OUT_ENABLED');
}

function isAsaasSandboxPixOutAllowed() {
  return String(process.env.ALLOW_ASAAS_SANDBOX_PIX_OUT || '').trim() === '1';
}

function isAsaasPixOutHttpEnabled() {
  return isAsaasHttpEnabled() && isAsaasPixOutEnabled() && isAsaasSandboxPixOutAllowed();
}

function isAsaasPixOutProductionGateEnabled() {
  return isTruthyEnv('ASAAS_PIX_OUT_PRODUCTION_ENABLED');
}

function isPaymentEnginePixOutEnabled() {
  return isTruthyEnv('PAYMENT_ENGINE_PIXOUT_ENABLED');
}

function isAsaasPixOutProductionHttpReady() {
  if (!isProductionNodeEnv()) {
    return false;
  }
  if (isAsaasSandboxEnv()) {
    return false;
  }
  if (!isAsaasEnabled()) {
    return false;
  }
  if (!isAsaasPixOutEnabled()) {
    return false;
  }
  return hasValidAsaasApiKey();
}

function isAsaasPixOutProductionHttpWired() {
  return isAsaasPixOutProductionConfigured();
}

function isAsaasPixOutProductionConfigured() {
  return (
    isAsaasPixOutProductionHttpReady() &&
    isAsaasPixOutProductionGateEnabled() &&
    isPaymentEnginePixOutEnabled()
  );
}

function isAsaasPixOutProductionHttpEnabled() {
  return isAsaasPixOutProductionConfigured() && isAsaasPixOutProductionHttpWired();
}

function resolveAsaasPixOutHttpGate() {
  if (isAsaasPixOutProductionHttpEnabled()) {
    return 'pixOutProduction';
  }
  if (isAsaasPixOutHttpEnabled()) {
    return 'pixOut';
  }
  return null;
}

function getAsaasPixOutProductionBlockReason() {
  if (!isProductionNodeEnv()) {
    return 'ASAAS_PIX_OUT_PRODUCTION_NOT_PRODUCTION_RUNTIME';
  }
  if (isAsaasSandboxEnv()) {
    return 'ASAAS_PIX_OUT_PRODUCTION_SANDBOX_ENV';
  }
  if (!isAsaasEnabled()) {
    return 'ASAAS_PIX_OUT_DISABLED';
  }
  if (!isAsaasPixOutEnabled()) {
    return 'ASAAS_PIX_OUT_DISABLED';
  }
  if (!hasValidAsaasApiKey()) {
    return 'ASAAS_PIX_OUT_NOT_CONFIGURED';
  }
  if (!isAsaasPixOutProductionGateEnabled()) {
    return 'ASAAS_PIX_OUT_PRODUCTION_DISABLED';
  }
  if (!isPaymentEnginePixOutEnabled()) {
    return 'PAYMENT_ENGINE_PIXOUT_DISABLED';
  }
  return null;
}

function guardAsaasPixOutProduction() {
  const reason = getAsaasPixOutProductionBlockReason();
  if (!reason) {
    return null;
  }

  const messages = {
    ASAAS_PIX_OUT_DISABLED: 'PIX OUT Asaas bloqueado: ASAAS_PIX_OUT_ENABLED=false',
    ASAAS_PIX_OUT_PRODUCTION_DISABLED:
      'PIX OUT Asaas produção bloqueado: ASAAS_PIX_OUT_PRODUCTION_ENABLED=false',
    PAYMENT_ENGINE_PIXOUT_DISABLED:
      'PIX OUT Asaas bloqueado: PAYMENT_ENGINE_PIXOUT_ENABLED=false',
    ASAAS_PIX_OUT_NOT_CONFIGURED: 'PIX OUT Asaas bloqueado: ASAAS_API_KEY ausente ou inválida',
    ASAAS_PIX_OUT_PRODUCTION_NOT_PRODUCTION_RUNTIME:
      'PIX OUT Asaas produção bloqueado: NODE_ENV≠production',
    ASAAS_PIX_OUT_PRODUCTION_SANDBOX_ENV:
      'PIX OUT Asaas produção bloqueado: ASAAS_ENV=sandbox'
  };

  return {
    blocked: true,
    success: false,
    error: reason,
    message: messages[reason] || `PIX OUT Asaas produção bloqueado: ${reason}`,
    phase: PIX_OUT_PRODUCTION_PHASE,
    financialEffect: false
  };
}

function getAsaasPixOutProductionTransferEndpoint() {
  return {
    method: 'POST',
    path: PIX_OUT_PRODUCTION_TRANSFERS_PATH
  };
}

function getAsaasPixOutGateSnapshot() {
  return {
    pixOutEnabled: isAsaasPixOutEnabled(),
    sandboxPixOutAllowed: isAsaasSandboxPixOutAllowed(),
    pixOutHttpEnabled: isAsaasPixOutHttpEnabled(),
    pixOutProductionHttpReady: isAsaasPixOutProductionHttpReady(),
    pixOutProductionGateEnabled: isAsaasPixOutProductionGateEnabled(),
    paymentEnginePixOutEnabled: isPaymentEnginePixOutEnabled(),
    pixOutProductionConfigured: isAsaasPixOutProductionConfigured(),
    pixOutProductionHttpWired: isAsaasPixOutProductionHttpWired(),
    pixOutProductionHttpEnabled: isAsaasPixOutProductionHttpEnabled(),
    resolvedHttpGate: resolveAsaasPixOutHttpGate(),
    productionBlockReason: getAsaasPixOutProductionBlockReason()
  };
}

module.exports = {
  PIX_OUT_PRODUCTION_PHASE,
  PIX_OUT_PRODUCTION_TRANSFERS_PATH,
  isAsaasPixOutEnabled,
  isAsaasSandboxPixOutAllowed,
  isAsaasPixOutHttpEnabled,
  isAsaasPixOutProductionGateEnabled,
  isPaymentEnginePixOutEnabled,
  isAsaasPixOutProductionHttpReady,
  isAsaasPixOutProductionConfigured,
  isAsaasPixOutProductionHttpWired,
  isAsaasPixOutProductionHttpEnabled,
  resolveAsaasPixOutHttpGate,
  getAsaasPixOutProductionBlockReason,
  guardAsaasPixOutProduction,
  getAsaasPixOutGateSnapshot,
  getAsaasPixOutProductionTransferEndpoint,
  hasValidAsaasApiKey
};
