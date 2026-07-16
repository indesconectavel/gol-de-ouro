'use strict';



/**

 * PE.2G — core neutro de idempotência (somente IdempotencyStore).

 * Sem cliente DB, sem nomes de tabela, sem schema de produto.

 */



const { normalizeIdempotencyKey, normalizeIdempotencyRecord } = require('../types/IdempotencyKey');



/**

 * @param {import('../ports/IdempotencyStore').IdempotencyStore} store

 * @param {string | import('../ports/IdempotencyStore').IdempotencyKey} rawKey

 */

async function exists(store, rawKey) {

  if (!store || typeof store.exists !== 'function') {

    return normalizeIdempotencyRecord({

      state: 'none',

      exists: false,

      error: new Error('IDEMPOTENCY_STORE_UNAVAILABLE')

    });

  }

  const key = normalizeIdempotencyKey(rawKey);

  if (!key.key) {

    return normalizeIdempotencyRecord({

      scope: key.scope,

      key: '',

      state: 'none',

      exists: false,

      error: new Error('INVALID_KEY')

    });

  }

  return normalizeIdempotencyRecord(await store.exists(key));

}



async function reserve(store, rawKey) {

  if (!store || typeof store.reserve !== 'function') {

    return normalizeIdempotencyRecord({

      state: 'none',

      exists: false,

      reserved: false,

      error: new Error('IDEMPOTENCY_STORE_UNAVAILABLE')

    });

  }

  return normalizeIdempotencyRecord(await store.reserve(normalizeIdempotencyKey(rawKey)));

}



async function commit(store, rawKey) {

  if (!store || typeof store.commit !== 'function') {

    return normalizeIdempotencyRecord({

      state: 'none',

      error: new Error('IDEMPOTENCY_STORE_UNAVAILABLE')

    });

  }

  return normalizeIdempotencyRecord(await store.commit(normalizeIdempotencyKey(rawKey)));

}



async function rollback(store, rawKey) {

  if (!store || typeof store.rollback !== 'function') {

    return normalizeIdempotencyRecord({

      state: 'none',

      error: new Error('IDEMPOTENCY_STORE_UNAVAILABLE')

    });

  }

  return normalizeIdempotencyRecord(await store.rollback(normalizeIdempotencyKey(rawKey)));

}



async function release(store, rawKey) {

  if (!store || typeof store.release !== 'function') {

    return normalizeIdempotencyRecord({

      state: 'none',

      error: new Error('IDEMPOTENCY_STORE_UNAVAILABLE')

    });

  }

  return normalizeIdempotencyRecord(await store.release(normalizeIdempotencyKey(rawKey)));

}



async function markProcessed(store, rawKey) {

  if (!store || typeof store.markProcessed !== 'function') {

    return normalizeIdempotencyRecord({

      state: 'none',

      error: new Error('IDEMPOTENCY_STORE_UNAVAILABLE')

    });

  }

  return normalizeIdempotencyRecord(await store.markProcessed(normalizeIdempotencyKey(rawKey)));

}



async function markFailed(store, rawKey) {

  if (!store || typeof store.markFailed !== 'function') {

    return normalizeIdempotencyRecord({

      state: 'failed',

      error: new Error('IDEMPOTENCY_STORE_UNAVAILABLE')

    });

  }

  return normalizeIdempotencyRecord(await store.markFailed(normalizeIdempotencyKey(rawKey)));

}



async function find(store, rawKey) {

  if (!store || typeof store.find !== 'function') {

    return null;

  }

  const rec = await store.find(normalizeIdempotencyKey(rawKey));

  return rec ? normalizeIdempotencyRecord(rec) : null;

}



/**

 * Shape legado para webhooks de depósito: { alreadyProcessed, existingStatus }.

 * @param {import('../ports/IdempotencyStore').IdempotencyStore} store

 * @param {string} paymentId

 */

async function checkDepositAlreadyProcessed(store, paymentId) {

  const rec = await exists(store, { scope: 'deposit_pix', key: String(paymentId || '').trim() });

  const status = rec.status || rec.metadata?.existingStatus || null;

  const alreadyProcessed =

    rec.exists === true &&

    (rec.state === 'processed' ||

      String(status || '').toLowerCase() === 'approved' ||

      rec.duplicate === true);

  return {

    alreadyProcessed,

    existingStatus: status

  };

}



module.exports = {

  exists,

  find,

  reserve,

  commit,

  rollback,

  release,

  markProcessed,

  markFailed,

  checkDepositAlreadyProcessed

};

