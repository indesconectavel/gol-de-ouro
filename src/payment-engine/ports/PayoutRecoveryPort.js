'use strict';



/**

 * PE.2J — PayoutRecoveryPort™ (neutro).

 *

 * Recovery / reconcile de payouts pendentes no PSP (ex.: Asaas).

 * Sem Express, sem schema, sem SQL no contrato.

 *

 * @typedef {Object} PayoutRecoveryPort

 * @property {string} productId

 * @property {() => boolean} isEnabled

 * @property {(input?: object) => Promise<object>} reconcilePending

 * @property {(input?: object) => Promise<object>} [reconcileSingle]

 */



module.exports = {};

