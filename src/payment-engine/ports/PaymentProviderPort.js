'use strict';



/**

 * PE.2L — PaymentProviderPort™ (PIX IN / deposit).

 *

 * Contrato neutro no package Payment Engine.

 * Sem SDK, HTTP, tokens ou nomes de tabela.

 *

 * Espelha finance/contracts/PaymentProvider (comportamento idêntico nos adapters).

 *

 * @typedef {Object} PaymentProviderPort

 * @property {string} name

 * @property {() => boolean} isConfigured

 * @property {(input: object) => Promise<object>} createPixDeposit

 * @property {(providerRef: string) => Promise<object>} getPixDepositStatus

 * @property {(payload: object) => Promise<object>} [handleDepositWebhook]

 */



module.exports = {};

