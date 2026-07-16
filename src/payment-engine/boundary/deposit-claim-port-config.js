'use strict';



/**

 * PE.2F — flag específica de DepositClaimPort (default: desligado).

 *

 * Separada de PE_ADAPTER_BOUNDARY_ENABLED para evitar ativar claim financeiro

 * ao ligar apenas o boundary de webhook/ports shadow (PE.2B / PE.2E).

 *

 * Produção permanece false. Flag ligada somente em local/staging autorizado HITL.

 */

function isTruthyEnv(name) {

  return String(process.env[name] || '').trim().toLowerCase() === 'true';

}



function isDepositClaimPortEnabled() {

  return isTruthyEnv('PE_DEPOSIT_CLAIM_PORT_ENABLED');

}



module.exports = {

  isDepositClaimPortEnabled,

  FLAG_NAME: 'PE_DEPOSIT_CLAIM_PORT_ENABLED',

  DEFAULT_VALUE: false,

  RELATED_BOUNDARY_FLAG: 'PE_ADAPTER_BOUNDARY_ENABLED'

};

