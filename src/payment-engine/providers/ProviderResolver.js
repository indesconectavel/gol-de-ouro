'use strict';



/**

 * PE.2L / PE.2L.1 — ProviderResolver™

 *

 * Único ponto autorizado da Payment Engine para selecionar PSP.

 * Flag OFF → FinanceProviderFactory (legado idêntico).

 * Flag ON  → mesma seleção legado + retorno via adapters PE (ports).

 *

 * Core nunca importa Asaas/MP/Celcoin/SDKs.

 *

 * PE.2L.1 — metadados de resolução (requested / effective / fallback) são

 * derivados do snapshot da factory homologada; não alteram seleção produtiva.

 */



const { isProviderBoundaryEnabled, FLAG_NAME, DEFAULT_VALUE } = require('../boundary/provider-boundary-config');

const {

  getPaymentAdapterByName,

  getTransferAdapterByName,

  PAYMENT_ADAPTERS,

  TRANSFER_ADAPTERS

} = require('../adapters/psp');



function legacyFactory() {

  return require('../../finance/factory/FinanceProviderFactory');

}



/**

 * PE.2L.1 — deriva contrato oficial a partir de valores já homologados.

 * Não decide provider; apenas normaliza nomenclatura de observability.

 *

 * @param {object} input

 * @param {string} input.requestedProvider

 * @param {string} input.effectiveProvider

 * @param {boolean} input.legacyFallbackActive — booleano da factory (significado A)

 * @returns {{

 *   requestedProvider: string,

 *   effectiveProvider: string,

 *   fallbackApplied: boolean,

 *   legacyFallbackApplied: boolean,

 *   fallbackReason: string|null

 * }}

 */

function deriveResolutionSide({ requestedProvider, effectiveProvider, legacyFallbackActive }) {

  const requested = String(requestedProvider || '').trim().toLowerCase();

  const effective = String(effectiveProvider || '').trim().toLowerCase();

  // Semântica oficial PE.2L.1: legacyFallbackActive === "fallback legado foi aplicado" (A).

  // fallbackApplied é o nome canônico do mesmo fato; um booleano = um conceito.

  const fallbackApplied = legacyFallbackActive === true;

  let fallbackReason = null;

  if (fallbackApplied) {

    if (requested === 'asaas' && effective === 'mercadopago') {

      fallbackReason = 'ASAAS_GATE_NOT_RESOLVABLE';

    } else {

      fallbackReason = 'CONTROLLED_LEGACY_FALLBACK';

    }

  }

  return {

    requestedProvider: requested,

    effectiveProvider: effective,

    fallbackApplied,

    legacyFallbackApplied: fallbackApplied,

    fallbackReason

  };

}



/**

 * Metadados de resolução PIX IN / PIX OUT (PE.2L.1).

 * Lê health da factory; não muda cache nem seleção.

 */

function getResolutionMetadata() {

  const health = getHealthSnapshot();

  const boundaryEnabled = isProviderBoundaryEnabled();

  return {

    boundaryEnabled,

    boundaryMode: boundaryEnabled ? 'ports_adapters' : 'legacy_factory',

    payment: deriveResolutionSide({

      requestedProvider: health.paymentProviderEnv,

      effectiveProvider: health.paymentProvider,

      legacyFallbackActive: health.paymentLegacyFallbackActive

    }),

    payout: deriveResolutionSide({

      requestedProvider: health.payoutProviderEnv,

      effectiveProvider: health.payoutProvider,

      legacyFallbackActive: health.legacyFallbackActive

    })

  };

}



/**

 * @returns {import('../ports/PaymentProviderPort').PaymentProviderPort}

 */

function resolvePaymentProvider() {

  const factory = legacyFactory();

  const provider = factory.resolvePaymentProvider();

  if (!isProviderBoundaryEnabled()) {

    return provider;

  }

  if (provider.name === 'mock') {

    return provider;

  }

  return getPaymentAdapterByName(provider.name);

}



/**

 * @returns {import('../ports/TransferProviderPort').TransferProviderPort}

 */

function resolvePayoutProvider() {

  const factory = legacyFactory();

  const provider = factory.resolvePayoutProvider();

  if (!isProviderBoundaryEnabled()) {

    return provider;

  }

  if (provider.name === 'mock') {

    return provider;

  }

  return getTransferAdapterByName(provider.name);

}



function getHealthSnapshot() {

  return legacyFactory().getHealthSnapshot();

}



function getPublicPspSnapshot() {

  return legacyFactory().getPublicPspSnapshot();

}



function assertBootConfig() {

  return legacyFactory().assertBootConfig();

}



function resetProviderCache() {

  return legacyFactory().resetProviderCache();

}



function inspect() {

  return {

    flag: FLAG_NAME,

    flagDefault: DEFAULT_VALUE,

    enabled: isProviderBoundaryEnabled(),

    mode: isProviderBoundaryEnabled() ? 'ports_adapters' : 'legacy_factory',

    registeredPayment: Object.keys(PAYMENT_ADAPTERS),

    registeredTransfer: Object.keys(TRANSFER_ADAPTERS)

  };

}



/**

 * Seleção explícita por nome (testes / smoke) — não bypassa factory em runtime produtivo.

 * @param {'payment'|'transfer'} kind

 * @param {string} name

 */

function resolveByName(kind, name) {

  if (kind === 'payment') return getPaymentAdapterByName(name);

  return getTransferAdapterByName(name);

}



module.exports = {

  resolvePaymentProvider,

  resolvePayoutProvider,

  getHealthSnapshot,

  getPublicPspSnapshot,

  assertBootConfig,

  resetProviderCache,

  inspect,

  resolveByName,

  deriveResolutionSide,

  getResolutionMetadata,

  isProviderBoundaryEnabled,

  FLAG_NAME,

  DEFAULT_VALUE

};

