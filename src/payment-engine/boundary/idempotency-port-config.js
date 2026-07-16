'use strict';



/**

 * PE.2G — flag IdempotencyStore (default: desligado).

 * Independente de PE_ADAPTER_BOUNDARY_ENABLED e PE_DEPOSIT_CLAIM_PORT_ENABLED.

 */

function isTruthyEnv(name) {

  return String(process.env[name] || '').trim().toLowerCase() === 'true';

}



function isIdempotencyPortEnabled() {

  return isTruthyEnv('PE_IDEMPOTENCY_PORT_ENABLED');

}



module.exports = {

  isIdempotencyPortEnabled,

  FLAG_NAME: 'PE_IDEMPOTENCY_PORT_ENABLED',

  DEFAULT_VALUE: false,

  RELATED_FLAGS: ['PE_ADAPTER_BOUNDARY_ENABLED', 'PE_DEPOSIT_CLAIM_PORT_ENABLED']

};

