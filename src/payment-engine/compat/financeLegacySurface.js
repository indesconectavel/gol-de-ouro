'use strict';



/**

 * PE.2I — Finance Legacy Surface™

 *

 * Compatibilidade transitória: concentra requires de finance/* e domain/payout

 * fora do Core da Payment Engine.

 *

 * Core (src/payment-engine/core) NÃO deve importar finance/*.

 * A fachada, schedulers e smoke usam esta surface (ou o resolver de boundary).

 */



const {

  createPixDepositCompat,

  isPixDepositConfigured,

  getPixDepositHealth

} = require('../../finance/compat/createPixDepositCompat');

const { claimApprovedPixDeposit } = require('../../finance/deposit/claimApprovedPixDeposit');

const { createPixDeposit } = require('../../finance/deposit/createPixDeposit');



const { createPixWithdrawCompat } = require('../../finance/compat/createPixWithdrawCompat');

const {

  createLedgerEntry,

  rollbackWithdraw,

  processPendingWithdrawals,

  payoutCounters

} = require('../../domain/payout/processPendingWithdrawals');



const {

  processPaymentWebhookCompat,

  isPaymentWebhookEngineEnabled,

  isAsaasWebhookRouteAllowed

} = require('../../finance/compat/processPaymentWebhookCompat');

const { processPaymentWebhook } = require('../../finance/webhooks/processPaymentWebhook');

const { processAsaasTransferWebhook } = require('../../finance/webhooks/processAsaasTransferWebhook');

const { handleAsaasTransferAuthorization } = require('../../finance/webhooks/asaasTransferAuthorization');



const {

  reconcileAsaasPendingPayouts,

  reconcileSingleAsaasPayout,

  isAsaasPayoutRecoveryEnabled

} = require('../../finance/reconciliation/asaasPayoutRecovery');



const deposit = {

  createPixDepositCompat,

  isPixDepositConfigured,

  getPixDepositHealth,

  createPixDeposit,

  claimApprovedPixDeposit

};



const withdraw = {

  createPixWithdrawCompat,

  createLedgerEntry,

  rollbackWithdraw,

  processPendingWithdrawals,

  payoutCounters

};



const webhooks = {

  processPaymentWebhookCompat,

  processPaymentWebhook,

  processAsaasTransferWebhook,

  handleAsaasTransferAuthorization,

  isPaymentWebhookEngineEnabled,

  isAsaasWebhookRouteAllowed

};



const reconciliation = {

  reconcileAsaasPendingPayouts,

  reconcileSingleAsaasPayout,

  isAsaasPayoutRecoveryEnabled

};



module.exports = {

  deposit,

  withdraw,

  webhooks,

  reconciliation,

  /** Atalhos planos para consumidores simples */

  createPixDepositCompat,

  isPixDepositConfigured,

  getPixDepositHealth,

  createPixDeposit,

  claimApprovedPixDeposit,

  createPixWithdrawCompat,

  createLedgerEntry,

  rollbackWithdraw,

  processPendingWithdrawals,

  payoutCounters,

  processPaymentWebhookCompat,

  processPaymentWebhook,

  processAsaasTransferWebhook,

  handleAsaasTransferAuthorization,

  isPaymentWebhookEngineEnabled,

  isAsaasWebhookRouteAllowed,

  reconcileAsaasPendingPayouts,

  reconcileSingleAsaasPayout,

  isAsaasPayoutRecoveryEnabled

};

