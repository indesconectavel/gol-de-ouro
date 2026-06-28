'use strict';

/**
 * F4.3C — PSP primário da arquitetura V1 vs provider efetivo de runtime.
 *
 * Arquitetura: PRIMARY_PSP=asaas (default)
 * Produção efetiva: Mercado Pago legado até ASAAS_PRODUCTION_ENABLED=true
 */

const ARCHITECTURAL_PRIMARY_PSP = 'asaas';
const LEGACY_PSP = 'mercadopago';
const SECONDARY_PREP_PSP = 'celcoin';

function normalizeProvider(value) {
  return String(value || '').trim().toLowerCase();
}

function getArchitecturalPrimaryPsp() {
  return normalizeProvider(process.env.PRIMARY_PSP || ARCHITECTURAL_PRIMARY_PSP);
}

function isProductionRuntime() {
  return String(process.env.NODE_ENV || '').trim().toLowerCase() === 'production';
}

function isAsaasProductionEnabled() {
  return String(process.env.ASAAS_PRODUCTION_ENABLED || '').trim().toLowerCase() === 'true';
}

function getExplicitProviderEnv(name) {
  const raw = process.env[name];
  if (raw == null || String(raw).trim() === '') {
    return null;
  }
  return normalizeProvider(raw);
}

/**
 * Provider efetivo para runtime (pode diferir do PSP arquitetural em produção).
 */
function getEffectiveProviderEnv(name) {
  const explicit = getExplicitProviderEnv(name);
  if (explicit) {
    return explicit;
  }

  if (isProductionRuntime() && !isAsaasProductionEnabled()) {
    return LEGACY_PSP;
  }

  return getArchitecturalPrimaryPsp();
}

function classifyProviderRole(providerName) {
  const provider = normalizeProvider(providerName);
  if (provider === getArchitecturalPrimaryPsp()) {
    return 'primary';
  }
  if (provider === LEGACY_PSP) {
    return 'legacy';
  }
  if (provider === SECONDARY_PREP_PSP) {
    return 'secondary';
  }
  return 'other';
}

module.exports = {
  ARCHITECTURAL_PRIMARY_PSP,
  LEGACY_PSP,
  SECONDARY_PREP_PSP,
  getArchitecturalPrimaryPsp,
  getExplicitProviderEnv,
  getEffectiveProviderEnv,
  isProductionRuntime,
  isAsaasProductionEnabled,
  classifyProviderRole
};
