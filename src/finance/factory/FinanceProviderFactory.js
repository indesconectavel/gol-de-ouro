const MercadoPagoPayoutProvider = require('../providers/mercadopago/MercadoPagoPayoutProvider');
const MockPayoutProvider = require('../providers/mock/MockPayoutProvider');

let bootChecked = false;
/** @type {import('../contracts/PayoutProvider').PayoutProvider | null} */
let cachedPayoutProvider = null;

function isProduction() {
  return String(process.env.NODE_ENV || '').toLowerCase() === 'production';
}

function isMockFinanceEnabled() {
  return String(process.env.MOCK_FINANCE_ENABLED || '').toLowerCase() === 'true';
}

function normalizePayoutProviderEnv() {
  const raw = process.env.PAYOUT_PROVIDER;
  if (raw == null || String(raw).trim() === '') {
    return 'mercadopago';
  }
  return String(raw).trim().toLowerCase();
}

function assertBootConfig() {
  if (isProduction() && isMockFinanceEnabled()) {
    throw new Error('MOCK_FINANCE_ENABLED=true is forbidden in production');
  }

  const payoutProvider = normalizePayoutProviderEnv();
  if (payoutProvider === 'efi') {
    throw new Error('PAYOUT_PROVIDER=efi is not implemented (F4.0E-S1)');
  }
  if (payoutProvider !== 'mercadopago' && !isMockFinanceEnabled()) {
    throw new Error(`Unknown PAYOUT_PROVIDER: ${payoutProvider}`);
  }
}

function ensureBootChecked() {
  if (!bootChecked) {
    assertBootConfig();
    bootChecked = true;
  }
}

/** @returns {import('../contracts/PayoutProvider').PayoutProvider} */
function resolvePayoutProvider() {
  ensureBootChecked();
  if (cachedPayoutProvider) {
    return cachedPayoutProvider;
  }

  if (isMockFinanceEnabled() && !isProduction()) {
    cachedPayoutProvider = MockPayoutProvider;
    return cachedPayoutProvider;
  }

  cachedPayoutProvider = MercadoPagoPayoutProvider;
  return cachedPayoutProvider;
}

/** @returns {import('../contracts/PaymentProvider').PaymentProvider | null} */
function resolvePaymentProvider() {
  ensureBootChecked();
  return null;
}

function getHealthSnapshot() {
  ensureBootChecked();
  const payoutProvider = resolvePayoutProvider();
  return {
    paymentProvider: null,
    payoutProvider: payoutProvider.name,
    mercadoPagoPayout: MercadoPagoPayoutProvider.isConfigured()
  };
}

module.exports = {
  assertBootConfig,
  resolvePayoutProvider,
  resolvePaymentProvider,
  getHealthSnapshot
};
