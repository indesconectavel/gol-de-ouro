'use strict';



/**

 * PE.2I — resolver da surface financeira (sempre legado homologado nesta fase).

 *

 * Flag ON/OFF não muda implementação financeira — apenas marca o modo de boundary.

 * Mutação financeira permanece idêntica (mesmos módulos finance/domain).

 */



const { isCoreFinanceBoundaryEnabled, FLAG_NAME, DEFAULT_VALUE } = require('./core-finance-boundary-config');

const financeLegacySurface = require('../compat/financeLegacySurface');



/**

 * @returns {{

 *   mode: 'legacy_direct'|'core_bridge',

 *   boundaryEnabled: boolean,

 *   surface: typeof financeLegacySurface

 * }}

 */

function resolveFinanceSurface() {

  const boundaryEnabled = isCoreFinanceBoundaryEnabled();

  return {

    mode: boundaryEnabled ? 'core_bridge' : 'legacy_direct',

    boundaryEnabled,

    flag: FLAG_NAME,

    flagDefault: DEFAULT_VALUE,

    surface: financeLegacySurface

  };

}



function getFinanceSurface() {

  return resolveFinanceSurface().surface;

}



module.exports = {

  resolveFinanceSurface,

  getFinanceSurface,

  isCoreFinanceBoundaryEnabled,

  FLAG_NAME,

  DEFAULT_VALUE

};

