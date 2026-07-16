'use strict';



/**

 * PE.2K — flag Runtime Boundary (default: desligado).

 *

 * OFF: RuntimeBoundary delega ao legado (domain/finance) — comportamento idêntico.

 * ON:  RuntimeBoundary → PaymentEngine facade → ports/adapters/bridges → legado.

 *

 * Independente das flags PE.2B–J. Produção permanece false.

 */

function isTruthyEnv(name) {

  return String(process.env[name] || '').trim().toLowerCase() === 'true';

}



function isRuntimeBoundaryEnabled() {

  return isTruthyEnv('PE_RUNTIME_BOUNDARY_ENABLED');

}



module.exports = {

  isRuntimeBoundaryEnabled,

  FLAG_NAME: 'PE_RUNTIME_BOUNDARY_ENABLED',

  DEFAULT_VALUE: false,

  RELATED_FLAGS: [

    'PE_PAYOUT_BOUNDARY_ENABLED',

    'PE_CORE_FINANCE_BOUNDARY_ENABLED',

    'PE_ADAPTER_BOUNDARY_ENABLED'

  ]

};

