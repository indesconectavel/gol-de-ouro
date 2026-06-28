'use strict';

/**
 * Configuração Celcoin — F4 Payment Engine.
 * Leitura de env, guards e helpers (sem chamadas HTTP).
 */

const DEFAULT_SANDBOX_BASE_URL = 'https://sandbox.openfinance.celcoin.dev';

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

function isCelcoinEnabled() {
  return isTruthyEnv('CELCOIN_ENABLED');
}

function isCelcoinHttpEnabled() {
  return isTruthyEnv('CELCOIN_HTTP_ENABLED');
}

function getAuthBaseUrl() {
  const base = readEnv('CELCOIN_BASE_URL');
  if (base) {
    return base.replace(/\/+$/, '');
  }
  return DEFAULT_SANDBOX_BASE_URL;
}

function getCelcoinConfig() {
  return {
    enabled: isCelcoinEnabled(),
    httpEnabled: isCelcoinHttpEnabled(),
    baseUrl: readEnv('CELCOIN_BASE_URL'),
    authBaseUrl: getAuthBaseUrl(),
    clientId: readEnv('CELCOIN_CLIENT_ID'),
    clientSecret: readEnv('CELCOIN_CLIENT_SECRET'),
    mtlsCertPath: readEnv('CELCOIN_MTLS_CERT_PATH'),
    mtlsKeyPath: readEnv('CELCOIN_MTLS_KEY_PATH'),
    webhookSecret: readEnv('CELCOIN_WEBHOOK_SECRET')
  };
}

function getMissingCredentialFields(config = getCelcoinConfig()) {
  const required = ['clientId', 'clientSecret'];
  return required.filter((field) => !config[field]);
}

function isCelcoinConfigured(config = getCelcoinConfig()) {
  if (!config.enabled) {
    return false;
  }
  return getMissingCredentialFields(config).length === 0;
}

function celcoinLog(event, meta = {}) {
  const payload = {
    event: `celcoin_${event}`,
    provider: 'celcoin',
    enabled: isCelcoinEnabled(),
    httpEnabled: isCelcoinHttpEnabled(),
    ts: new Date().toISOString(),
    ...meta
  };
  console.log(JSON.stringify(payload));
}

module.exports = {
  DEFAULT_SANDBOX_BASE_URL,
  getAuthBaseUrl,
  getCelcoinConfig,
  getMissingCredentialFields,
  isCelcoinEnabled,
  isCelcoinHttpEnabled,
  isCelcoinConfigured,
  celcoinLog
};
