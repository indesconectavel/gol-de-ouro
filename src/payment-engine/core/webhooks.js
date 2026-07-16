'use strict';



/**

 * PE.2I — Core webhooks.

 * ZERO require de finance/* — surface via Compatibility Layer.

 * Ports PE.2E/H em core/webhookStore.js e types.

 */



const { webhooks } = require('../compat/financeLegacySurface');



module.exports = {

  ...webhooks,

  __pe2i: 'bridged_via_financeLegacySurface'

};

