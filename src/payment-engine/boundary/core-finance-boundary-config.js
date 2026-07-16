'use strict';



/**

 * PE.2I — flag da fronteira Core ↔ Finance (default: desligado).

 *

 * Flag OFF: fachada resolve surface legado (comportamento idêntico pré-PE.2I).

 * Flag ON:  fachada documenta path "Core → Bridge → Finance" (mesma surface;

 *           core permanece sem imports finance/*).

 *

 * Independente de PE_ADAPTER_BOUNDARY / DEPOSIT_CLAIM / IDEMPOTENCY / WEBHOOK_STORE.

 */

function isTruthyEnv(name) {

  return String(process.env[name] || '').trim().toLowerCase() === 'true';

}



function isCoreFinanceBoundaryEnabled() {

  return isTruthyEnv('PE_CORE_FINANCE_BOUNDARY_ENABLED');

}



module.exports = {

  isCoreFinanceBoundaryEnabled,

  FLAG_NAME: 'PE_CORE_FINANCE_BOUNDARY_ENABLED',

  DEFAULT_VALUE: false,

  RELATED_FLAGS: [

    'PE_ADAPTER_BOUNDARY_ENABLED',

    'PE_DEPOSIT_CLAIM_PORT_ENABLED',

    'PE_IDEMPOTENCY_PORT_ENABLED',

    'PE_WEBHOOK_STORE_PORT_ENABLED'

  ]

};

