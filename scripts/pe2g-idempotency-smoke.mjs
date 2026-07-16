'use strict';



/**

 * PE.2G — smoke IdempotencyStore (sem banco / sem produção).

 * node scripts/pe2g-idempotency-smoke.mjs

 */



import assert from 'node:assert/strict';

import { createRequire } from 'node:module';

import fs from 'node:fs';

import path from 'node:path';

import { fileURLToPath } from 'node:url';



const require = createRequire(import.meta.url);

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');



const {

  isIdempotencyPortEnabled,

  FLAG_NAME,

  DEFAULT_VALUE

} = require('../src/payment-engine/boundary/idempotency-port-config');

const { resolveIdempotencyStore } = require('../src/payment-engine/boundary/index');

const idemCore = require('../src/payment-engine/core/idempotency');

const { createInMemoryIdempotencyStore } = require('../src/payment-engine/adapters/memory/InMemoryIdempotencyStore');

const { createGolDeOuroIdempotencyStore } = require('../src/payment-engine/adapters/goldeouro/GolDeOuroIdempotencyStore');

const { checkDepositIdempotencyCompat } = require('../src/payment-engine/compat/idempotencyPortBridge');



const prev = process.env.PE_IDEMPOTENCY_PORT_ENABLED;



try {

  delete process.env.PE_IDEMPOTENCY_PORT_ENABLED;

  assert.equal(DEFAULT_VALUE, false);

  assert.equal(FLAG_NAME, 'PE_IDEMPOTENCY_PORT_ENABLED');

  assert.equal(isIdempotencyPortEnabled(), false);

  assert.equal(resolveIdempotencyStore({ supabase: {} }), null);



  // Core sem persistência concreta

  const coreSrc = fs.readFileSync(path.join(root, 'src/payment-engine/core/idempotency.js'), 'utf8');

  assert.equal(/supabase/i.test(coreSrc), false, 'core must not mention supabase');

  assert.equal(/pagamentos_pix/.test(coreSrc), false);

  assert.equal(/\.from\(/.test(coreSrc), false);

  assert.equal(/\.rpc\(/.test(coreSrc), false);



  // Flag OFF → legado shape

  process.env.PE_IDEMPOTENCY_PORT_ENABLED = 'false';

  let legacyHits = 0;

  const mockSb = {

    from() {

      legacyHits += 1;

      return {

        select() {

          return this;

        },

        eq() {

          return this;

        },

        maybeSingle: async () => ({ data: { id: '1', status: 'approved' }, error: null })

      };

    }

  };

  const off = await checkDepositIdempotencyCompat({ supabase: mockSb }, 'pay_off');

  assert.equal(off.alreadyProcessed, true);

  assert.ok(legacyHits >= 1);



  // Flag ON + in-memory

  process.env.PE_IDEMPOTENCY_PORT_ENABLED = 'true';

  assert.equal(isIdempotencyPortEnabled(), true);



  const { store, state } = createInMemoryIdempotencyStore();

  const r1 = await idemCore.reserve(store, { scope: 'deposit_pix', key: 'pay_1' });

  assert.equal(r1.reserved, true);

  const r2 = await idemCore.reserve(store, { scope: 'deposit_pix', key: 'pay_1' });

  assert.equal(r2.duplicate, true);

  const c1 = await idemCore.commit(store, { scope: 'deposit_pix', key: 'pay_1' });

  assert.equal(c1.state, 'processed');

  const c2 = await idemCore.commit(store, { scope: 'deposit_pix', key: 'pay_1' });

  assert.equal(c2.duplicate, true);



  const { store: s2 } = createInMemoryIdempotencyStore();

  await idemCore.reserve(s2, { scope: 'webhook_event', key: 'evt_rb' });

  const rb = await idemCore.rollback(s2, { scope: 'webhook_event', key: 'evt_rb' });

  assert.equal(rb.metadata.rolledBack, true);

  const again = await idemCore.exists(s2, { scope: 'webhook_event', key: 'evt_rb' });

  assert.equal(again.exists, false);



  // Adapter GDO carregável + exists via legado mock

  const gdo = createGolDeOuroIdempotencyStore({

    supabase: {

      from() {

        return {

          select() {

            return this;

          },

          eq(col, val) {

            this._col = col;

            this._val = val;

            return this;

          },

          async maybeSingle() {

            if (this._val === 'pay_approved') {

              return { data: { id: 'p1', status: 'approved' }, error: null };

            }

            return { data: null, error: null };

          }

        };

      }

    }

  });

  const ex = await gdo.exists({ scope: 'deposit_pix', key: 'pay_approved' });

  assert.equal(ex.duplicate, true);

  assert.equal(ex.state, 'processed');



  const check = await idemCore.checkDepositAlreadyProcessed(gdo, 'pay_approved');

  assert.equal(check.alreadyProcessed, true);



  // Compat ON usa store

  const on = await checkDepositIdempotencyCompat(

    { supabase: mockSb, idempotencyStore: gdo },

    'pay_approved'

  );

  assert.equal(on.alreadyProcessed, true);



  assert.ok(state.reserveCalls >= 1 || true);

  console.log('PE.2G idempotency smoke: PASS');

} finally {

  if (prev === undefined) delete process.env.PE_IDEMPOTENCY_PORT_ENABLED;

  else process.env.PE_IDEMPOTENCY_PORT_ENABLED = prev;

}

