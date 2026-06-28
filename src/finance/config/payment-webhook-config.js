'use strict';

const { isProductionRuntime, isAsaasProductionEnabled } = require('../config/primary-psp');
const { isAsaasSandboxEnv } = require('../providers/asaas/asaas-config');

function isTruthyEnv(name) {
  return String(process.env[name] || '').trim().toLowerCase() === 'true';
}

function isFlagOne(name) {
  return String(process.env[name] || '').trim() === '1';
}

function isPaymentWebhookEngineEnabled() {
  return isTruthyEnv('PAYMENT_WEBHOOK_ENGINE_ENABLED');
}
/**
 * Crédito controlado Asaas — F4.6.
 * Exige sandbox + non-production + flags explícitas.
 */
function isAsaasControlledCreditEnabled() {
  if (!isPaymentWebhookEngineEnabled()) {
    return false;
  }
  if (isProductionRuntime()) {
    return false;
  }
  if (!isAsaasSandboxEnv()) {
    return false;
  }
  if (!isTruthyEnv('ASAAS_CONTROLLED_CREDIT_ENABLED')) {
    return false;
  }
  if (!isFlagOne('PAYMENT_WEBHOOK_CONTROLLED_CREDIT')) {
    return false;
  }
  const storeKind = String(process.env.CONTROLLED_CREDIT_STORE || 'local').trim().toLowerCase();
  return storeKind === 'local';
}

/**
 * Crédito real Asaas em produção — P1.0.
 * Exige gate ASAAS_PRODUCTION_ENABLED + NODE_ENV=production + engine ON.
 */
function isAsaasProductionWebhookCreditEnabled() {
  if (!isPaymentWebhookEngineEnabled()) {
    return false;
  }
  if (!isAsaasProductionEnabled()) {
    return false;
  }
  return isProductionRuntime();
}

function getControlledCreditBlockReason() {
  if (isAsaasProductionWebhookCreditEnabled()) {
    return null;
  }
  if (isProductionRuntime()) {
    return 'blocked_prod';
  }
  if (!isAsaasSandboxEnv()) {
    return 'blocked_invalid';
  }
  if (!isAsaasControlledCreditEnabled()) {
    return 'controlled_credit_disabled';
  }
  return null;
}

module.exports = {
  isAsaasControlledCreditEnabled,
  isAsaasProductionWebhookCreditEnabled,
  getControlledCreditBlockReason,
  isPaymentWebhookEngineEnabled
};
