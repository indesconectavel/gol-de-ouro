'use strict';



/**

 * PE.2L — flag Provider Boundary (default: desligado).

 *

 * OFF: providers → FinanceProviderFactory (legado idêntico).

 * ON:  ProviderResolver → PaymentProviderPort / TransferProviderPort → adapters PSP → legado.

 *

 * Independente das flags PE.2B–K. Produção permanece false.

 */

function isTruthyEnv(name) {

  return String(process.env[name] || '').trim().toLowerCase() === 'true';

}



function isProviderBoundaryEnabled() {

  return isTruthyEnv('PE_PROVIDER_BOUNDARY_ENABLED');

}



module.exports = {

  isProviderBoundaryEnabled,

  FLAG_NAME: 'PE_PROVIDER_BOUNDARY_ENABLED',

  DEFAULT_VALUE: false,

  RELATED_FLAGS: [

    'PE_RUNTIME_BOUNDARY_ENABLED',

    'PE_ADAPTER_BOUNDARY_ENABLED',

    'PE_PAYOUT_BOUNDARY_ENABLED'

  ]

};

