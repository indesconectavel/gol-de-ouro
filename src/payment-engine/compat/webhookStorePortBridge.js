'use strict';



/**

 * PE.2H — bridge compat dry-run / WebhookStorePort.

 *

 * Flag OFF → PaymentWebhookDryRunStore.markProcessed (legado idêntico).

 * Flag ON  → core → WebhookStorePort (GolDeOuroWebhookStore envolvendo o mesmo backing).

 *

 * Nunca executa dois stores mutáveis em paralelo com escrita financeira.

 */



const { defaultStore } = require('../../finance/webhooks/paymentWebhookDryRunStore');

const { isWebhookStorePortEnabled } = require('../boundary/webhook-store-port-config');

const { createGolDeOuroWebhookStore } = require('../adapters/goldeouro/GolDeOuroWebhookStore');

const webhookStoreCore = require('../core/webhookStore');



/**

 * @param {{ dryRunStore?: object, webhookStore?: object }} deps

 * @param {object} event

 * @param {object} [meta]

 * @returns {Promise<{ duplicate: boolean, record: object }>|{ duplicate: boolean, record: object }}

 */

function markWebhookProcessedCompat(deps, event, meta = {}) {

  const dryRunStore = deps?.dryRunStore || defaultStore;



  if (!isWebhookStorePortEnabled()) {

    return dryRunStore.markProcessed(event, meta);

  }



  const store =

    deps?.webhookStore ||

    createGolDeOuroWebhookStore({ backingStore: dryRunStore });



  return webhookStoreCore.markProcessedLegacyShape(store, event, meta);

}



/**

 * @param {{ dryRunStore?: object, webhookStore?: object }} deps

 * @param {object} event

 * @param {string} decision

 */

function recordWebhookCreditDecisionCompat(deps, event, decision) {

  const dryRunStore = deps?.dryRunStore || defaultStore;

  if (!isWebhookStorePortEnabled()) {

    return dryRunStore.recordCreditDecision(event, decision);

  }

  const store =

    deps?.webhookStore ||

    createGolDeOuroWebhookStore({ backingStore: dryRunStore });

  if (typeof store.recordCreditDecision === 'function') {

    return store.recordCreditDecision(event, decision);

  }

  return decision;

}



/**

 * Snapshot do store ativo (legado ou port).

 */

function webhookStoreSnapshotCompat(deps = {}) {

  const dryRunStore = deps.dryRunStore || defaultStore;

  if (!isWebhookStorePortEnabled()) {

    return dryRunStore.snapshot();

  }

  const store = deps.webhookStore || createGolDeOuroWebhookStore({ backingStore: dryRunStore });

  return typeof store.snapshot === 'function' ? store.snapshot() : dryRunStore.snapshot();

}



module.exports = {

  markWebhookProcessedCompat,

  recordWebhookCreditDecisionCompat,

  webhookStoreSnapshotCompat

};

