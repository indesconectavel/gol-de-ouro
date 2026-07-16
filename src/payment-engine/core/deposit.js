'use strict';



/**

 * PE.2I — Core deposit (somente ports / compat de ports).

 * ZERO require de finance/*.

 */



const {

  claimApprovedDeposit,

  claimApprovedDepositOrchestrated

} = require('./claimApprovedDeposit');

const { claimApprovedPixDepositCompat } = require('../compat/depositClaimPortBridge');



module.exports = {

  claimApprovedDeposit,

  claimApprovedDepositOrchestrated,

  /** PE.2F compat — bridge pode tocar finance; core não importa finance diretamente */

  claimApprovedPixDepositCompat

};

