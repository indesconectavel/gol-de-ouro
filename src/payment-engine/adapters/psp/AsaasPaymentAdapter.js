'use strict';



/**

 * PE.2L — Asaas Payment Adapter (PIX IN).

 * Encapsula finance/providers/asaas — Core/Resolver não importam SDK Asaas.

 */



const AsaasPaymentProvider = require('../../../finance/providers/asaas/AsaasPaymentProvider');



/** @type {import('../../ports/PaymentProviderPort').PaymentProviderPort} */

const AsaasPaymentAdapter = {

  name: AsaasPaymentProvider.name,

  isConfigured() {

    return AsaasPaymentProvider.isConfigured();

  },

  createPixDeposit(input) {

    return AsaasPaymentProvider.createPixDeposit(input);

  },

  getPixDepositStatus(providerRef) {

    return AsaasPaymentProvider.getPixDepositStatus(providerRef);

  },

  handleDepositWebhook(payload) {

    return AsaasPaymentProvider.handleDepositWebhook(payload);

  }

};



module.exports = AsaasPaymentAdapter;

