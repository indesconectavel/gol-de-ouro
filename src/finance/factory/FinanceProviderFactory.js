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
  isAsaasPaymentProviderResolvable
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

let bootChecked = false;
/** @type {import('../contracts/PayoutProvider').PayoutProvider | null} */
let cachedPayoutProvider = null;
/** @type {import('../contracts/PaymentProvider').PaymentProvider | null} */
let cachedPaymentProvider = null;
/** @type {boolean | null} */
let cachedLegacyPaymentFallback = null;

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
    cachedLegacyFallback = false;
    return cachedPayoutProvider;
  }

  const payoutProviderEnv = normalizePayoutProviderEnv();

  if (payoutProviderEnv === 'celcoin') {
    cachedPayoutProvider = CelcoinPayoutProvider;
    cachedLegacyFallback = false;
    return cachedPayoutProvider;
  }

  if (payoutProviderEnv === 'asaas' && isAsaasProviderResolvable()) {
    cachedPayoutProvider = AsaasPayoutProvider;
    cachedLegacyFallback = false;
    return cachedPayoutProvider;
  }

  cachedPayoutProvider = MercadoPagoPayoutProvider;
  cachedLegacyFallback = payoutProviderEnv === 'asaas';
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
    return cachedPaymentProvider;
  }

  cachedPaymentProvider = MercadoPagoPaymentProvider;
  cachedLegacyPaymentFallback = paymentProviderEnv === 'asaas';
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
    legacyFallbackActive: cachedLegacyFallback === true,
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
    registeredPaymentProviders: ['asaas', 'mercadopago', 'mock']
  };
}

module.exports = {
  assertBootConfig,
  resolvePayoutProvider,
  resolvePaymentProvider,
  getHealthSnapshot,
  resetProviderCache
};
