'use strict';

const crypto = require('node:crypto');

/**
 * Configuração Asaas — F4.2A Payment Engine.
 * Leitura de env, guards e helpers (sem chamadas HTTP).
 */

const DEFAULT_SANDBOX_BASE_URL = 'https://sandbox.asaas.com/api/v3';
const DEFAULT_PRODUCTION_BASE_URL = 'https://api.asaas.com/v3';
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
  if (!isAsaasSandboxEnv()) {
    return DEFAULT_PRODUCTION_BASE_URL;
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

/**
 * Diagnóstico read-only de ASAAS_API_KEY — sem expor valor.
 */
function getAsaasApiKeyDiagnostics() {
  const raw = process.env.ASAAS_API_KEY;
  const trimmed = raw == null ? '' : String(raw).trim();
  return {
    present: raw != null,
    length: trimmed.length,
    empty: trimmed.length === 0,
    sha256Prefix:
      trimmed.length > 0 ? crypto.createHash('sha256').update(trimmed).digest('hex').slice(0, 16) : null
  };
}

function hasValidAsaasApiKey(apiKey = readEnv('ASAAS_API_KEY')) {
  return Boolean(apiKey && String(apiKey).trim().length > 0);
}

/**
 * P1.3F — PIX IN produção tecnicamente pronto (config + chave), sem exigir gate financeiro.
 */
function isAsaasPixInProductionHttpReady() {
  if (!isProductionNodeEnv()) {
    return false;
  }
  if (isAsaasSandboxEnv()) {
    return false;
  }
  if (!isAsaasEnabled()) {
    return false;
  }
  if (!isAsaasPixInEnabled()) {
    return false;
  }
  return hasValidAsaasApiKey();
}

/**
 * P1.3F — PIX IN produção executável: prontidão + ASAAS_PRODUCTION_ENABLED (gate financeiro).
 */
function isAsaasPixInProductionHttpEnabled() {
  return isAsaasPixInProductionHttpReady() && isAsaasProductionEnabled();
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

const asaasPixOutConfig = require('../../config/asaas-pix-out-config');

function isAsaasPixOutEnabled() {
  return asaasPixOutConfig.isAsaasPixOutEnabled();
}

function isAsaasSandboxPixOutAllowed() {
  return asaasPixOutConfig.isAsaasSandboxPixOutAllowed();
}

function isAsaasPixOutHttpEnabled() {
  return asaasPixOutConfig.isAsaasPixOutHttpEnabled();
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
 * P1.8 — GET /transfers/{id} para recovery/reconciliação (read-only).
 * Produção: ASAAS_ENABLED + API key, sem exigir gates PIX OUT de escrita.
 * Sandbox: mesmo gate HTTP PIX OUT sandbox.
 */
function isAsaasPayoutReconcileReadEnabled() {
  if (String(process.env.ASAAS_PAYOUT_RECOVERY_ENABLED || '').trim().toLowerCase() === 'false') {
    return false;
  }
  if (!isAsaasEnabled() || !hasValidAsaasApiKey()) {
    return false;
  }
  if (!isAsaasSandboxEnv()) {
    return true;
  }
  return isAsaasPixOutHttpEnabled();
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
    pixInProductionHttpReady: isAsaasPixInProductionHttpReady(),
    pixInProductionHttpEnabled: isAsaasPixInProductionHttpEnabled(),
    apiKeyDiagnostics: getAsaasApiKeyDiagnostics(),
    ...asaasPixOutConfig.getAsaasPixOutGateSnapshot(),
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
  return hasValidAsaasApiKey(config.apiKey);
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
  DEFAULT_PRODUCTION_BASE_URL,
  USER_AGENT,
  getAsaasBaseUrl,
  getAsaasConfig,
  getAsaasApiKeyDiagnostics,
  hasValidAsaasApiKey,
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
  isAsaasPixInProductionHttpReady,
  isAsaasPixInProductionHttpEnabled,
  isAsaasPixOutEnabled,
  isAsaasSandboxPixOutAllowed,
  isAsaasPixOutHttpEnabled,
  isAsaasPixOutProductionHttpReady: asaasPixOutConfig.isAsaasPixOutProductionHttpReady,
  isAsaasPixOutProductionHttpEnabled: asaasPixOutConfig.isAsaasPixOutProductionHttpEnabled,
  isAsaasPixOutProductionConfigured: asaasPixOutConfig.isAsaasPixOutProductionConfigured,
  getAsaasPixOutGateSnapshot: asaasPixOutConfig.getAsaasPixOutGateSnapshot,
  guardAsaasPixOutProduction: asaasPixOutConfig.guardAsaasPixOutProduction,
  isAsaasPayoutReconcileReadEnabled,
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
