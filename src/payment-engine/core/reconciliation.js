'use strict';



/**

 * PE.2I — Core reconciliation.

 * ZERO require de finance/* — surface via Compatibility Layer.

 */



const { reconciliation } = require('../compat/financeLegacySurface');



module.exports = {

  ...reconciliation,

  __pe2i: 'bridged_via_financeLegacySurface'

};

