'use strict';

/**
 * Configuração Asaas — F4.2A Payment Engine.
 * Leitura de env, guards e helpers (sem chamadas HTTP).
 */

const DEFAULT_SANDBOX_BASE_URL = 'https://sandbox.asaas.com/api/v3';
const USER_AGENT = 'GolDeOuro-Backend/1.0';

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

/**
 * Gate HTTP real: ASAAS_ENABLED=true, ALLOW_ASAAS_SANDBOX_AUTH=1, ASAAS_ENV=sandbox.
 */
function isAsaasHttpEnabled() {
  return isAsaasEnabled() && isAsaasSandboxAuthAllowed() && isAsaasSandboxEnv();
}

function getAsaasBaseUrl() {
  const base = readEnv('ASAAS_BASE_URL');
  if (base) {
    return base.replace(/\/+$/, '');
  }
  return DEFAULT_SANDBOX_BASE_URL;
}

function isAsaasWebhookEnabled() {
  return isTruthyEnv('ASAAS_WEBHOOK_ENABLED');
}

function isAsaasWebhookStrictMode() {
  const raw = process.env.ASAAS_WEBHOOK_STRICT_MODE;
  if (raw == null || String(raw).trim() === '') {
    return true;
  }
  return isTruthyEnv('ASAAS_WEBHOOK_STRICT_MODE');
}

function isAsaasWebhookLiveTestEnabled() {
  return String(process.env.ASAAS_WEBHOOK_LIVE_TEST || '').trim() === '1';
}

function isAsaasSandboxWebhookAllowed() {
  return String(process.env.ALLOW_ASAAS_SANDBOX_WEBHOOK || '').trim() === '1';
}

/**
 * Gate validação live sandbox de webhook — F4.2F.
 */
function isAsaasWebhookLiveSandboxActive() {
  return (
    isAsaasWebhookEnabled() &&
    isAsaasWebhookLiveTestEnabled() &&
    isAsaasSandboxWebhookAllowed() &&
    isAsaasSandboxEnv()
  );
}

function isAsaasPixInEnabled() {
  return isTruthyEnv('ASAAS_PIX_IN_ENABLED');
}

function isAsaasSandboxPixInAllowed() {
  return String(process.env.ALLOW_ASAAS_SANDBOX_PIX_IN || '').trim() === '1';
}

/**
 * Gate HTTP PIX IN sandbox: HTTP base + ASAAS_PIX_IN_ENABLED + ALLOW_ASAAS_SANDBOX_PIX_IN.
 */
function isAsaasPixInHttpEnabled() {
  return isAsaasHttpEnabled() && isAsaasPixInEnabled() && isAsaasSandboxPixInAllowed();
}

function isAsaasPixOutEnabled() {
  return isTruthyEnv('ASAAS_PIX_OUT_ENABLED');
}

function isAsaasSandboxPixOutAllowed() {
  return String(process.env.ALLOW_ASAAS_SANDBOX_PIX_OUT || '').trim() === '1';
}

/**
 * Gate HTTP PIX OUT sandbox — F4.2G capability validation only.
 */
function isAsaasPixOutHttpEnabled() {
  return isAsaasHttpEnabled() && isAsaasPixOutEnabled() && isAsaasSandboxPixOutAllowed();
}

function isAsaasTransferAuthTestEnabled() {
  return String(process.env.ASAAS_TRANSFER_AUTH_TEST || '').trim() === '1';
}

/**
 * Gate investigação autorização transferência — F4.2G.2.
 */
function isAsaasTransferAuthHttpEnabled() {
  return isAsaasPixOutHttpEnabled() && isAsaasTransferAuthTestEnabled();
}

function isProductionNodeEnv() {
  return String(process.env.NODE_ENV || '').trim().toLowerCase() === 'production';
}

function normalizeFinanceProviderEnv(name, fallback = null) {
  if (fallback != null) {
    const raw = process.env[name];
    if (raw == null || String(raw).trim() === '') {
      return String(fallback).trim().toLowerCase();
    }
    return String(raw).trim().toLowerCase();
  }
  const { getEffectiveProviderEnv } = require('../../config/primary-psp');
  return getEffectiveProviderEnv(name);
}

function isAsaasProductionEnabled() {
  const { isAsaasProductionEnabled: prodEnabled } = require('../../config/primary-psp');
  return prodEnabled();
}

/**
 * F4.4 — PIX IN sandbox controlado (sem exigir PIX OUT/webhook).
 */
function isAsaasPrimarySandboxPixInMode() {
  if (isProductionNodeEnv()) {
    return false;
  }
  if (!isAsaasSandboxEnv()) {
    return false;
  }
  if (String(process.env.ASAAS_TEST_LIVE || '').trim() !== '1') {
    return false;
  }
  if (normalizeFinanceProviderEnv('PAYMENT_PROVIDER') !== 'asaas') {
    return false;
  }
  return isAsaasEnabled() && isAsaasSandboxAuthAllowed() && isAsaasPixInHttpEnabled();
}

/**
 * Asaas resolvível para PIX IN: sandbox PIX IN (F4.4), primary sandbox (F4.3A) ou produção homologada.
 */
function isAsaasPaymentProviderResolvable() {
  if (isAsaasPrimarySandboxMode() || isAsaasPrimarySandboxPixInMode()) {
    return true;
  }
  return (
    isAsaasProductionEnabled() &&
    isProductionNodeEnv() &&
    isAsaasEnabled() &&
    isAsaasConfigured() &&
    !isAsaasSandboxEnv()
  );
}

/**
 * Asaas resolvível: sandbox controlado (F4.3A) ou produção homologada (F4.3C gate).
 */
function isAsaasProviderResolvable() {
  if (isAsaasPrimarySandboxMode()) {
    return true;
  }
  return (
    isAsaasProductionEnabled() &&
    isProductionNodeEnv() &&
    isAsaasEnabled() &&
    isAsaasConfigured() &&
    !isAsaasSandboxEnv()
  );
}

/**
 * F4.3A — Asaas provider principal em Sandbox controlado (local/teste apenas).
 * Exige PAYMENT_PROVIDER=asaas, PAYOUT_PROVIDER=asaas, ASAAS_TEST_LIVE=1 e guards sandbox.
 */
function isAsaasPrimarySandboxMode() {
  if (isProductionNodeEnv()) {
    return false;
  }
  if (!isAsaasSandboxEnv()) {
    return false;
  }
  if (String(process.env.ASAAS_TEST_LIVE || '').trim() !== '1') {
    return false;
  }
  if (normalizeFinanceProviderEnv('PAYMENT_PROVIDER') !== 'asaas') {
    return false;
  }
  if (normalizeFinanceProviderEnv('PAYOUT_PROVIDER') !== 'asaas') {
    return false;
  }
  return (
    isAsaasEnabled() &&
    isAsaasSandboxAuthAllowed() &&
    isAsaasPixInHttpEnabled() &&
    isAsaasPixOutHttpEnabled() &&
    isAsaasWebhookEnabled()
  );
}

function getAsaasConfig() {
  return {
    enabled: isAsaasEnabled(),
    sandboxAuthAllowed: isAsaasSandboxAuthAllowed(),
    httpEnabled: isAsaasHttpEnabled(),
    pixInEnabled: isAsaasPixInEnabled(),
    sandboxPixInAllowed: isAsaasSandboxPixInAllowed(),
    pixInHttpEnabled: isAsaasPixInHttpEnabled(),
    pixOutEnabled: isAsaasPixOutEnabled(),
    sandboxPixOutAllowed: isAsaasSandboxPixOutAllowed(),
    pixOutHttpEnabled: isAsaasPixOutHttpEnabled(),
    transferAuthTest: isAsaasTransferAuthTestEnabled(),
    transferAuthHttpEnabled: isAsaasTransferAuthHttpEnabled(),
    primarySandboxMode: isAsaasPrimarySandboxMode(),
    webhookEnabled: isAsaasWebhookEnabled(),
    webhookStrictMode: isAsaasWebhookStrictMode(),
    webhookLiveTest: isAsaasWebhookLiveTestEnabled(),
    sandboxWebhookAllowed: isAsaasSandboxWebhookAllowed(),
    webhookLiveSandboxActive: isAsaasWebhookLiveSandboxActive(),
    env: readEnv('ASAAS_ENV') || 'sandbox',
    baseUrl: getAsaasBaseUrl(),
    apiKey: readEnv('ASAAS_API_KEY'),
    webhookToken: readEnv('ASAAS_WEBHOOK_TOKEN'),
    sandboxCustomerId: readEnv('ASAAS_SANDBOX_CUSTOMER_ID')
  };
}

function isAsaasConfigured(config = getAsaasConfig()) {
  if (!config.enabled) {
    return false;
  }
  return Boolean(config.apiKey);
}

function maskApiKeyPreview(apiKey) {
  if (!apiKey || typeof apiKey !== 'string') {
    return '***masked***';
  }
  const trimmed = apiKey.trim();
  if (trimmed.length <= 12) {
    return '***masked***';
  }
  return `${trimmed.slice(0, 14)}...${trimmed.slice(-3)}`;
}

function maskWebhookTokenPreview(token) {
  return maskApiKeyPreview(token);
}

function maskPixPayloadPreview(payload) {
  if (!payload || typeof payload !== 'string') {
    return null;
  }
  const trimmed = payload.trim();
  if (trimmed.length <= 24) {
    return '***masked***';
  }
  return `${trimmed.slice(0, 20)}...${trimmed.slice(-8)}`;
}

function maskPixKeyPreview(pixKey) {
  if (!pixKey || typeof pixKey !== 'string') {
    return null;
  }
  const trimmed = pixKey.trim();
  if (trimmed.length <= 8) {
    return '***masked***';
  }
  if (trimmed.includes('@')) {
    const [local, domain] = trimmed.split('@');
    const maskedLocal = local.length <= 3 ? '***' : `${local.slice(0, 3)}***`;
    return `${maskedLocal}@${domain}`;
  }
  return `${trimmed.slice(0, 4)}...${trimmed.slice(-3)}`;
}

function asaasLog(event, meta = {}) {
  const payload = {
    event: `asaas_${event}`,
    provider: 'asaas',
    enabled: isAsaasEnabled(),
    sandboxAuthAllowed: isAsaasSandboxAuthAllowed(),
    httpEnabled: isAsaasHttpEnabled(),
    env: readEnv('ASAAS_ENV') || 'sandbox',
    ts: new Date().toISOString(),
    ...meta
  };
  console.log(JSON.stringify(payload));
}

module.exports = {
  DEFAULT_SANDBOX_BASE_URL,
  USER_AGENT,
  getAsaasBaseUrl,
  getAsaasConfig,
  isAsaasConfigured,
  isAsaasEnabled,
  isAsaasHttpEnabled,
  isAsaasSandboxAuthAllowed,
  isAsaasSandboxEnv,
  isAsaasWebhookEnabled,
  isAsaasWebhookStrictMode,
  isAsaasWebhookLiveTestEnabled,
  isAsaasSandboxWebhookAllowed,
  isAsaasWebhookLiveSandboxActive,
  isAsaasPixInEnabled,
  isAsaasSandboxPixInAllowed,
  isAsaasPixInHttpEnabled,
  isAsaasPixOutEnabled,
  isAsaasSandboxPixOutAllowed,
  isAsaasPixOutHttpEnabled,
  isAsaasTransferAuthTestEnabled,
  isAsaasTransferAuthHttpEnabled,
  isProductionNodeEnv,
  normalizeFinanceProviderEnv,
  isAsaasPrimarySandboxMode,
  isAsaasPrimarySandboxPixInMode,
  isAsaasPaymentProviderResolvable,
  isAsaasProviderResolvable,
  isAsaasProductionEnabled,
  maskApiKeyPreview,
  maskWebhookTokenPreview,
  maskPixPayloadPreview,
  maskPixKeyPreview,
  asaasLog
};
