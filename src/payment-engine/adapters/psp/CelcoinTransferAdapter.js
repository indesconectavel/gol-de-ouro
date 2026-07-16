'use strict';



/**

 * PE.2L — Celcoin Transfer Adapter (PIX OUT).

 */



const CelcoinPayoutProvider = require('../../../finance/providers/celcoin/CelcoinPayoutProvider');



/** @type {import('../../ports/TransferProviderPort').TransferProviderPort} */

const CelcoinTransferAdapter = {

  name: CelcoinPayoutProvider.name,

  isConfigured() {

    return CelcoinPayoutProvider.isConfigured();

  },

  requestPixPayout(input) {

    return CelcoinPayoutProvider.requestPixPayout(input);

  },

  getPayoutStatus(providerRef) {

    return CelcoinPayoutProvider.getPayoutStatus(providerRef);

  },

  handlePayoutWebhook(payload) {

    return CelcoinPayoutProvider.handlePayoutWebhook(payload);

  }

};



module.exports = CelcoinTransferAdapter;

