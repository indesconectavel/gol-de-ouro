'use strict';



/**

 * PE.2L — superfície pública de providers da Payment Engine.

 * Toda resolução passa por ProviderResolver (nunca Core → PSP SDK).

 */



const ProviderResolver = require('./ProviderResolver');



module.exports = {

  ProviderResolver,

  resolvePaymentProvider: ProviderResolver.resolvePaymentProvider,

  resolvePayoutProvider: ProviderResolver.resolvePayoutProvider,

  getHealthSnapshot: ProviderResolver.getHealthSnapshot,

  getPublicPspSnapshot: ProviderResolver.getPublicPspSnapshot,

  assertBootConfig: ProviderResolver.assertBootConfig,

  resetProviderCache: ProviderResolver.resetProviderCache,

  inspect: ProviderResolver.inspect,

  resolveByName: ProviderResolver.resolveByName,

  deriveResolutionSide: ProviderResolver.deriveResolutionSide,

  getResolutionMetadata: ProviderResolver.getResolutionMetadata,

  isProviderBoundaryEnabled: ProviderResolver.isProviderBoundaryEnabled,

  FLAG_NAME: ProviderResolver.FLAG_NAME,

  DEFAULT_VALUE: ProviderResolver.DEFAULT_VALUE

};

