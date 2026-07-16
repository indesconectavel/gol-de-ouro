'use strict';



/**

 * PE.2L — Efí Adapter stubs (não implementado — espelha F4.0E-S1).

 */



const EfiPaymentAdapter = {

  name: 'efi',

  isConfigured() {

    return false;

  },

  async createPixDeposit() {

    throw new Error('PAYMENT_PROVIDER=efi is not implemented (PE.2L stub)');

  },

  async getPixDepositStatus() {

    throw new Error('PAYMENT_PROVIDER=efi is not implemented (PE.2L stub)');

  }

};



const EfiTransferAdapter = {

  name: 'efi',

  isConfigured() {

    return false;

  },

  async requestPixPayout() {

    throw new Error('PAYOUT_PROVIDER=efi is not implemented (PE.2L stub)');

  },

  async getPayoutStatus() {

    throw new Error('PAYOUT_PROVIDER=efi is not implemented (PE.2L stub)');

  }

};



module.exports = {

  EfiPaymentAdapter,

  EfiTransferAdapter

};

