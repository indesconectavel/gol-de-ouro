'use strict';



/**

 * PE.2H — flag WebhookStorePort (default: desligado).

 * Independente das flags PE.2B / PE.2F / PE.2G.

 */

function isTruthyEnv(name) {

  return String(process.env[name] || '').trim().toLowerCase() === 'true';

}



function isWebhookStorePortEnabled() {

  return isTruthyEnv('PE_WEBHOOK_STORE_PORT_ENABLED');

}



module.exports = {

  isWebhookStorePortEnabled,

  FLAG_NAME: 'PE_WEBHOOK_STORE_PORT_ENABLED',

  DEFAULT_VALUE: false,

  RELATED_FLAGS: [

    'PE_ADAPTER_BOUNDARY_ENABLED',

    'PE_DEPOSIT_CLAIM_PORT_ENABLED',

    'PE_IDEMPOTENCY_PORT_ENABLED'

  ]

};

