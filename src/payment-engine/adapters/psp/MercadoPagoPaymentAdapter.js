'use strict';



/**

 * PE.2L — Mercado Pago Payment Adapter (PIX IN).

 * Encapsula finance provider — services/pix-mercado-pago permanece atrás do legado MP.

 */



const MercadoPagoPaymentProvider = require('../../../finance/providers/mercadopago/MercadoPagoPaymentProvider');



/** @type {import('../../ports/PaymentProviderPort').PaymentProviderPort} */

const MercadoPagoPaymentAdapter = {

  name: MercadoPagoPaymentProvider.name,

  isConfigured() {

    return MercadoPagoPaymentProvider.isConfigured();

  },

  createPixDeposit(input) {

    return MercadoPagoPaymentProvider.createPixDeposit(input);

  },

  getPixDepositStatus(providerRef) {

    return MercadoPagoPaymentProvider.getPixDepositStatus(providerRef);

  },

  handleDepositWebhook(payload) {

    return MercadoPagoPaymentProvider.handleDepositWebhook(payload);

  }

};



module.exports = MercadoPagoPaymentAdapter;

