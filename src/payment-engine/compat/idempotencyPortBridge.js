'use strict';



/**

 * PE.2G — bridge compat idempotência depósito.

 *

 * Flag OFF → checkSupabaseDepositIdempotency legado (idêntico).

 * Flag ON  → core + GolDeOuroIdempotencyStore (sem dupla mutação).

 */



const { checkSupabaseDepositIdempotency } = require('../../finance/webhooks/paymentWebhookIdempotency');

const { isIdempotencyPortEnabled } = require('../boundary/idempotency-port-config');

const { createGolDeOuroIdempotencyStore } = require('../adapters/goldeouro/GolDeOuroIdempotencyStore');

const { checkDepositAlreadyProcessed } = require('../core/idempotency');



/**

 * @param {{ supabase?: object, idempotencyStore?: object }} deps

 * @param {string} paymentId

 * @returns {Promise<{ alreadyProcessed: boolean, existingStatus: string | null }>}

 */

async function checkDepositIdempotencyCompat(deps, paymentId) {

  if (!isIdempotencyPortEnabled()) {

    return checkSupabaseDepositIdempotency(deps?.supabase, paymentId);

  }



  const store =

    deps?.idempotencyStore ||

    createGolDeOuroIdempotencyStore({ supabase: deps?.supabase });



  return checkDepositAlreadyProcessed(store, paymentId);

}



module.exports = {

  checkDepositIdempotencyCompat

};

