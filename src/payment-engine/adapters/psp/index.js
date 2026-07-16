'use strict';



/**

 * PE.2L — registry de adapters PSP do Payment Engine.

 */



const AsaasPaymentAdapter = require('./AsaasPaymentAdapter');

const AsaasTransferAdapter = require('./AsaasTransferAdapter');

const MercadoPagoPaymentAdapter = require('./MercadoPagoPaymentAdapter');

const MercadoPagoTransferAdapter = require('./MercadoPagoTransferAdapter');

const CelcoinTransferAdapter = require('./CelcoinTransferAdapter');

const { EfiPaymentAdapter, EfiTransferAdapter } = require('./EfiAdapters');



const PAYMENT_ADAPTERS = {

  asaas: AsaasPaymentAdapter,

  mercadopago: MercadoPagoPaymentAdapter,

  efi: EfiPaymentAdapter

};



const TRANSFER_ADAPTERS = {

  asaas: AsaasTransferAdapter,

  mercadopago: MercadoPagoTransferAdapter,

  celcoin: CelcoinTransferAdapter,

  efi: EfiTransferAdapter

};



/**

 * @param {string} name

 * @returns {import('../../ports/PaymentProviderPort').PaymentProviderPort}

 */

function getPaymentAdapterByName(name) {

  const key = String(name || '').trim().toLowerCase();

  if (PAYMENT_ADAPTERS[key]) return PAYMENT_ADAPTERS[key];

  // factory legado usa name === 'mercadopago' | 'asaas'

  if (key === 'mercadopago' || key.includes('mercado')) return MercadoPagoPaymentAdapter;

  if (key === 'asaas') return AsaasPaymentAdapter;

  return MercadoPagoPaymentAdapter;

}



/**

 * @param {string} name

 * @returns {import('../../ports/TransferProviderPort').TransferProviderPort}

 */

function getTransferAdapterByName(name) {

  const key = String(name || '').trim().toLowerCase();

  if (TRANSFER_ADAPTERS[key]) return TRANSFER_ADAPTERS[key];

  if (key === 'mercadopago' || key.includes('mercado')) return MercadoPagoTransferAdapter;

  if (key === 'asaas') return AsaasTransferAdapter;

  if (key === 'celcoin') return CelcoinTransferAdapter;

  return MercadoPagoTransferAdapter;

}



module.exports = {

  PAYMENT_ADAPTERS,

  TRANSFER_ADAPTERS,

  getPaymentAdapterByName,

  getTransferAdapterByName,

  AsaasPaymentAdapter,

  AsaasTransferAdapter,

  MercadoPagoPaymentAdapter,

  MercadoPagoTransferAdapter,

  CelcoinTransferAdapter,

  EfiPaymentAdapter,

  EfiTransferAdapter

};

