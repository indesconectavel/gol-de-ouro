'use strict';



/**

 * PE.2L — TransferProviderPort™ (PIX OUT / payout / transfer).

 *

 * Contrato neutro no package Payment Engine.

 * Sem SDK, HTTP, tokens ou schema GDO.

 *

 * Espelha finance/contracts/PayoutProvider nos adapters.

 *

 * @typedef {Object} TransferProviderPort

 * @property {string} name

 * @property {() => boolean} isConfigured

 * @property {(input: object) => Promise<object>} requestPixPayout

 * @property {(providerRef: string) => Promise<object>} getPayoutStatus

 * @property {(payload: object) => Promise<object>} [handlePayoutWebhook]

 */



module.exports = {};

