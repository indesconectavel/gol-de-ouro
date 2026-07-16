'use strict';



/**

 * PE.2L — Mercado Pago Transfer Adapter (PIX OUT).

 * Encapsula MercadoPagoPayoutProvider (que por sua vez usa services/pix-mercado-pago).

 * Engine pública nunca importa services/pix-mercado-pago.

 */



const MercadoPagoPayoutProvider = require('../../../finance/providers/mercadopago/MercadoPagoPayoutProvider');



/** @type {import('../../ports/TransferProviderPort').TransferProviderPort} */

const MercadoPagoTransferAdapter = {

  name: MercadoPagoPayoutProvider.name,

  isConfigured() {

    return MercadoPagoPayoutProvider.isConfigured();

  },

  requestPixPayout(input) {

    return MercadoPagoPayoutProvider.requestPixPayout(input);

  },

  getPayoutStatus(providerRef) {

    return MercadoPagoPayoutProvider.getPayoutStatus(providerRef);

  },

  handlePayoutWebhook(payload) {

    return MercadoPagoPayoutProvider.handlePayoutWebhook(payload);

  }

};



module.exports = MercadoPagoTransferAdapter;

