'use strict';

/**
 * P1.6A — Configuração do webhook de autorização de transferência Asaas.
 * Separado do webhook financeiro (PAYMENT_* / TRANSFER_*).
 */

function readEnv(name) {
  const value = process.env[name];
  if (value == null || String(value).trim() === '') {
    return null;
  }
  return String(value).trim();
}

function isTruthyEnv(name) {
  return String(process.env[name] || '').trim().toLowerCase() === 'true';
}

/** IPs oficiais de webhook Asaas produção — docs.asaas.com/docs/official-asaas-ips */
const OFFICIAL_ASAAS_WEBHOOK_IPS = Object.freeze([
  '52.67.12.206',
  '18.230.8.159',
  '54.94.136.112',
  '54.94.183.101'
]);

/**
 * Gate principal P1.6A — default OFF (ausente ou !== true).
 * Alias legado: ASAAS_TRANSFER_AUTH_ENABLED (P1.6).
 */
function isAsaasTransferAuthWebhookEnabled() {
  if (isTruthyEnv('ASAAS_TRANSFER_AUTH_WEBHOOK_ENABLED')) {
    return true;
  }
  return isTruthyEnv('ASAAS_TRANSFER_AUTH_ENABLED');
}

function isAsaasTransferAuthStrictMode() {
  const raw = process.env.ASAAS_TRANSFER_AUTH_STRICT_MODE;
  if (raw == null || String(raw).trim() === '') {
    return true;
  }
  return isTruthyEnv('ASAAS_TRANSFER_AUTH_STRICT_MODE');
}

function isAsaasTransferAuthIpCheckEnabled() {
  return isTruthyEnv('ASAAS_TRANSFER_AUTH_IP_CHECK');
}

/**
 * Token exclusivo do webhook de autorização — default ausente.
 * Sem fallback para ASAAS_WEBHOOK_TOKEN (isolamento P1.6A).
 */
function getAsaasTransferAuthWebhookToken() {
  return readEnv('ASAAS_TRANSFER_AUTH_WEBHOOK_TOKEN') || readEnv('ASAAS_TRANSFER_AUTH_TOKEN') || null;
}

function getAsaasTransferAuthConfig() {
  return {
    enabled: isAsaasTransferAuthWebhookEnabled(),
    strictMode: isAsaasTransferAuthStrictMode(),
    ipCheckEnabled: isAsaasTransferAuthIpCheckEnabled(),
    tokenConfigured: Boolean(getAsaasTransferAuthWebhookToken()),
    officialIps: OFFICIAL_ASAAS_WEBHOOK_IPS
  };
}

module.exports = {
  OFFICIAL_ASAAS_WEBHOOK_IPS,
  isAsaasTransferAuthWebhookEnabled,
  isAsaasTransferAuthEnabled: isAsaasTransferAuthWebhookEnabled,
  isAsaasTransferAuthStrictMode,
  isAsaasTransferAuthIpCheckEnabled,
  getAsaasTransferAuthWebhookToken,
  getAsaasTransferAuthToken: getAsaasTransferAuthWebhookToken,
  getAsaasTransferAuthConfig
};
