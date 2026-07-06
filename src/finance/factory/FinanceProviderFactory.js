'use strict';

const MercadoPagoPayoutProvider = require('../providers/mercadopago/MercadoPagoPayoutProvider');
const MercadoPagoPaymentProvider = require('../providers/mercadopago/MercadoPagoPaymentProvider');
const MockPayoutProvider = require('../providers/mock/MockPayoutProvider');
const CelcoinPayoutProvider = require('../providers/celcoin/CelcoinPayoutProvider');
const AsaasPayoutProvider = require('../providers/asaas/AsaasPayoutProvider');
const AsaasPaymentProvider = require('../providers/asaas/AsaasPaymentProvider');
const { isCelcoinEnabled, isCelcoinHttpEnabled } = require('../providers/celcoin/celcoin-config');
const {
  isAsaasEnabled,
  isAsaasHttpEnabled,
  isAsaasConfigured,
  isAsaasWebhookEnabled,
  isAsaasProviderResolvable,
  isAsaasPaymentProviderResolvable,
  isAsaasPixInEnabled
} = require('../providers/asaas/asaas-config');
const {
  getArchitecturalPrimaryPsp,
  getEffectiveProviderEnv,
  getExplicitProviderEnv,
  isAsaasProductionEnabled,
  isProductionRuntime,
  classifyProviderRole,
  LEGACY_PSP
} = require('../config/primary-psp');
const { getAsaasPixOutGateSnapshot } = require('../config/asaas-pix-out-config');

/** ASAAS_ENV normalizado — não é segredo (production/sandbox). */
function getAsaasEnvName() {
  const raw = String(process.env.ASAAS_ENV || '').trim().toLowerCase();
  return raw || 'unset';
}

let bootChecked = false;
/** @type {import('../contracts/PayoutProvider').PayoutProvider | null} */
let cachedPayoutProvider = null;
/** @type {import('../contracts/PaymentProvider').PaymentProvider | null} */
let cachedPaymentProvider = null;
/** @type {boolean | null} */
let cachedLegacyPaymentFallback = null;
/** @type {boolean | null} */
let cachedLegacyPayoutFallback = null;

function logPixOutProviderResolve(providerName, payoutProviderEnv, legacyFallback) {
  console.log(
    `[PSP][RESOLVE][PIX_OUT] provider=${providerName} env=${payoutProviderEnv} legacyFallback=${legacyFallback === true}`
  );
}

function logPixInProviderResolve(providerName, paymentProviderEnv, legacyFallback) {
  console.log(
    `[PSP][RESOLVE][PIX_IN] provider=${providerName} env=${paymentProviderEnv} legacyFallback=${legacyFallback === true}`
  );
}

function warnPaymentProviderGateMismatch() {
  if (!isProductionRuntime()) {
    return;
  }

  const explicitPayment = getExplicitProviderEnv('PAYMENT_PROVIDER');
  const effectivePayment = normalizePaymentProviderEnv();
  const gateOpen = isAsaasProductionEnabled();
  const architectural = getArchitecturalPrimaryPsp();

  if (explicitPayment === 'asaas' && !gateOpen) {
    console.error(
      '[PSP][GATE][CRITICAL] PAYMENT_PROVIDER=asaas com ASAAS_PRODUCTION_ENABLED=false — boot deve falhar; não usar Mercado Pago silenciosamente'
    );
    return;
  }

  if (!gateOpen && architectural === 'asaas' && effectivePayment === LEGACY_PSP) {
    console.warn(
      `[PSP][GATE][WARN] ASAAS_PRODUCTION_ENABLED=false — PIX IN efetivo=${effectivePayment} (arquitetura=${architectural})`
    );
  }
}

function isMockFinanceEnabled() {
  return String(process.env.MOCK_FINANCE_ENABLED || '').toLowerCase() === 'true';
}

function normalizePayoutProviderEnv() {
  return getEffectiveProviderEnv('PAYOUT_PROVIDER');
}

function normalizePaymentProviderEnv() {
  return getEffectiveProviderEnv('PAYMENT_PROVIDER');
}

function assertBootConfig() {
  if (isProductionRuntime() && isMockFinanceEnabled()) {
    throw new Error('MOCK_FINANCE_ENABLED=true is forbidden in production');
  }

  warnPaymentProviderGateMismatch();

  const payoutProvider = normalizePayoutProviderEnv();
  const paymentProvider = normalizePaymentProviderEnv();

  if (payoutProvider === 'efi') {
    throw new Error('PAYOUT_PROVIDER=efi is not implemented (F4.0E-S1)');
  }
  if (payoutProvider === 'celcoin' && !isCelcoinEnabled()) {
    throw new Error('PAYOUT_PROVIDER=celcoin requires CELCOIN_ENABLED=true');
  }

  if (getExplicitProviderEnv('PAYMENT_PROVIDER') === 'asaas' && !isAsaasPaymentProviderResolvable()) {
    throw new Error(
      'PAYMENT_PROVIDER=asaas explicit requires Asaas PIX IN resolvable (sandbox F4.4 ou ASAAS_PRODUCTION_ENABLED)'
    );
  }
  if (getExplicitProviderEnv('PAYOUT_PROVIDER') === 'asaas' && !isAsaasProviderResolvable()) {
    throw new Error(
      'PAYOUT_PROVIDER=asaas explicit requires Asaas resolvable (sandbox F4.3A ou ASAAS_PRODUCTION_ENABLED)'
    );
  }

  if (
    payoutProvider !== LEGACY_PSP &&
    payoutProvider !== 'celcoin' &&
    payoutProvider !== 'asaas' &&
    !isMockFinanceEnabled()
  ) {
    throw new Error(`Unknown PAYOUT_PROVIDER: ${payoutProvider}`);
  }
  if (
    paymentProvider !== LEGACY_PSP &&
    paymentProvider !== 'asaas' &&
    !isMockFinanceEnabled()
  ) {
    throw new Error(`Unknown PAYMENT_PROVIDER: ${paymentProvider}`);
  }
}

function ensureBootChecked() {
  if (!bootChecked) {
    assertBootConfig();
    bootChecked = true;
  }
}

function resetProviderCache() {
  cachedPayoutProvider = null;
  cachedPaymentProvider = null;
  cachedLegacyPaymentFallback = null;
  cachedLegacyPayoutFallback = null;
  bootChecked = false;
}

/** @returns {import('../contracts/PayoutProvider').PayoutProvider} */
function resolvePayoutProvider() {
  ensureBootChecked();
  if (cachedPayoutProvider) {
    return cachedPayoutProvider;
  }

  if (isMockFinanceEnabled() && !isProductionRuntime()) {
    cachedPayoutProvider = MockPayoutProvider;
    cachedLegacyPayoutFallback = false;
    return cachedPayoutProvider;
  }

  const payoutProviderEnv = normalizePayoutProviderEnv();

  if (payoutProviderEnv === 'celcoin') {
    cachedPayoutProvider = CelcoinPayoutProvider;
    cachedLegacyPayoutFallback = false;
    return cachedPayoutProvider;
  }

  if (payoutProviderEnv === 'asaas' && isAsaasProviderResolvable()) {
    cachedPayoutProvider = AsaasPayoutProvider;
    cachedLegacyPayoutFallback = false;
    logPixOutProviderResolve(AsaasPayoutProvider.name, payoutProviderEnv, false);
    return cachedPayoutProvider;
  }

  cachedPayoutProvider = MercadoPagoPayoutProvider;
  cachedLegacyPayoutFallback = payoutProviderEnv === 'asaas';
  if (cachedLegacyPayoutFallback === true) {
    console.error(
      '[PSP][GATE][CRITICAL] PAYOUT_PROVIDER=asaas solicitado mas provider efetivo=mercadopago (gate PIX OUT ou ASAAS_PRODUCTION_ENABLED)'
    );
  }
  logPixOutProviderResolve(
    MercadoPagoPayoutProvider.name,
    payoutProviderEnv,
    cachedLegacyPayoutFallback
  );
  return cachedPayoutProvider;
}

/** @returns {import('../contracts/PaymentProvider').PaymentProvider} */
function resolvePaymentProvider() {
  ensureBootChecked();
  if (cachedPaymentProvider) {
    return cachedPaymentProvider;
  }

  const paymentProviderEnv = normalizePaymentProviderEnv();

  if (paymentProviderEnv === 'asaas' && isAsaasPaymentProviderResolvable()) {
    cachedPaymentProvider = AsaasPaymentProvider;
    cachedLegacyPaymentFallback = false;
    logPixInProviderResolve(AsaasPaymentProvider.name, paymentProviderEnv, false);
    return cachedPaymentProvider;
  }

  cachedPaymentProvider = MercadoPagoPaymentProvider;
  cachedLegacyPaymentFallback = paymentProviderEnv === 'asaas';
  if (cachedLegacyPaymentFallback === true) {
    console.error(
      '[PSP][GATE][CRITICAL] PAYMENT_PROVIDER=asaas solicitado mas provider efetivo=mercadopago (gate ASAAS_PRODUCTION_ENABLED ou PIX IN não resolvível)'
    );
  }
  logPixInProviderResolve(
    MercadoPagoPaymentProvider.name,
    paymentProviderEnv,
    cachedLegacyPaymentFallback
  );
  return cachedPaymentProvider;
}

function getHealthSnapshot() {
  ensureBootChecked();
  const payoutProvider = resolvePayoutProvider();
  const paymentProvider = resolvePaymentProvider();
  const payoutEnv = normalizePayoutProviderEnv();
  const paymentEnv = normalizePaymentProviderEnv();

  return {
    architecturalPrimaryPsp: getArchitecturalPrimaryPsp(),
    paymentProvider: paymentProvider.name,
    payoutProvider: payoutProvider.name,
    paymentProviderEnv: paymentEnv,
    payoutProviderEnv: payoutEnv,
    paymentProviderEnvRole: classifyProviderRole(paymentEnv),
    payoutProviderEnvRole: classifyProviderRole(payoutEnv),
    paymentProviderRole: classifyProviderRole(paymentProvider.name),
    payoutProviderRole: classifyProviderRole(payoutProvider.name),
    legacyFallbackActive: cachedLegacyPayoutFallback === true,
    paymentLegacyFallbackActive: cachedLegacyPaymentFallback === true,
    asaasProviderResolvable: isAsaasProviderResolvable(),
    asaasPaymentProviderResolvable: isAsaasPaymentProviderResolvable(),
    asaasProductionEnabled: isAsaasProductionEnabled(),
    productionRuntime: isProductionRuntime(),
    mercadoPagoPayout: MercadoPagoPayoutProvider.isConfigured(),
    mercadoPagoPayment: MercadoPagoPaymentProvider.isConfigured(),
    celcoinEnabled: isCelcoinEnabled(),
    celcoinHttpEnabled: isCelcoinHttpEnabled(),
    celcoinPayoutConfigured: CelcoinPayoutProvider.isConfigured(),
    asaasEnabled: isAsaasEnabled(),
    asaasHttpEnabled: isAsaasHttpEnabled(),
    asaasConfigured: isAsaasConfigured(),
    asaasPayoutConfigured: AsaasPayoutProvider.isConfigured(),
    asaasPaymentConfigured: AsaasPaymentProvider.isConfigured(),
    asaasWebhookEnabled: isAsaasWebhookEnabled(),
    registeredPayoutProviders: ['asaas', 'mercadopago', 'celcoin', 'mock'],
    registeredPaymentProviders: ['asaas', 'mercadopago', 'mock'],
    asaasPixInEnabled: isAsaasPixInEnabled(),
    asaasEnv: getAsaasEnvName(),
    pixOutGates: getAsaasPixOutGateSnapshot()
  };
}

/**
 * Subconjunto seguro para /health e /meta (sem secrets).
 */
function getPublicPspSnapshot() {
  const health = getHealthSnapshot();
  return {
    architecturalPrimaryPsp: health.architecturalPrimaryPsp,
    paymentProvider: health.paymentProvider,
    payoutProvider: health.payoutProvider,
    paymentProviderEnv: health.paymentProviderEnv,
    payoutProviderEnv: health.payoutProviderEnv,
    paymentProviderRole: health.paymentProviderRole,
    payoutProviderRole: health.payoutProviderRole,
    paymentLegacyFallbackActive: health.paymentLegacyFallbackActive,
    legacyFallbackActive: health.legacyFallbackActive,
    asaasProductionEnabled: health.asaasProductionEnabled,
    asaasPaymentProviderResolvable: health.asaasPaymentProviderResolvable,
    asaasPixInEnabled: health.asaasPixInEnabled,
    asaasWebhookEnabled: health.asaasWebhookEnabled,
    asaasEnv: health.asaasEnv,
    productionRuntime: health.productionRuntime,
    pixOut: {
      productionHttpEnabled: health.pixOutGates.pixOutProductionHttpEnabled,
      productionGateEnabled: health.pixOutGates.pixOutProductionGateEnabled,
      paymentEnginePixOutEnabled: health.pixOutGates.paymentEnginePixOutEnabled,
      pixOutEnabled: health.pixOutGates.pixOutEnabled,
      productionBlockReason: health.pixOutGates.productionBlockReason
    }
  };
}

module.exports = {
  assertBootConfig,
  resolvePayoutProvider,
  resolvePaymentProvider,
  getHealthSnapshot,
  getPublicPspSnapshot,
  resetProviderCache
};
