'use strict';



/**

 * PE.2L — Asaas Payout / Transfer Adapter (PIX OUT).

 */



const AsaasPayoutProvider = require('../../../finance/providers/asaas/AsaasPayoutProvider');



/** @type {import('../../ports/TransferProviderPort').TransferProviderPort} */

const AsaasTransferAdapter = {

  name: AsaasPayoutProvider.name,

  isConfigured() {

    return AsaasPayoutProvider.isConfigured();

  },

  requestPixPayout(input) {

    return AsaasPayoutProvider.requestPixPayout(input);

  },

  getPayoutStatus(providerRef) {

    return AsaasPayoutProvider.getPayoutStatus(providerRef);

  },

  handlePayoutWebhook(payload) {

    return AsaasPayoutProvider.handlePayoutWebhook(payload);

  }

};



module.exports = AsaasTransferAdapter;

