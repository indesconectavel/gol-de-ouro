'use strict';



/**

 * PE.2J — flag Payout Boundary (default: desligado).

 *

 * Independente de PE_ADAPTER_BOUNDARY / DEPOSIT_CLAIM / IDEMPOTENCY / WEBHOOK_STORE / CORE_FINANCE.

 * Produção permanece false. TRUE somente local/staging autorizado HITL.

 */

function isTruthyEnv(name) {

  return String(process.env[name] || '').trim().toLowerCase() === 'true';

}



function isPayoutBoundaryEnabled() {

  return isTruthyEnv('PE_PAYOUT_BOUNDARY_ENABLED');

}



module.exports = {

  isPayoutBoundaryEnabled,

  FLAG_NAME: 'PE_PAYOUT_BOUNDARY_ENABLED',

  DEFAULT_VALUE: false,

  RELATED_FLAGS: [

    'PE_ADAPTER_BOUNDARY_ENABLED',

    'PE_CORE_FINANCE_BOUNDARY_ENABLED',

    'PE_DEPOSIT_CLAIM_PORT_ENABLED'

  ]

};

