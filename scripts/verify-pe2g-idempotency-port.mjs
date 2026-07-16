'use strict';

/**
 * PE.2G — verify IdempotencyStore (mocks only).
 * node scripts/verify-pe2g-idempotency-port.mjs
 */

import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const idemCore = require('../src/payment-engine/core/idempotency');
const { createInMemoryIdempotencyStore } = require('../src/payment-engine/adapters/memory/InMemoryIdempotencyStore');
const { createGolDeOuroIdempotencyStore } = require('../src/payment-engine/adapters/goldeouro/GolDeOuroIdempotencyStore');
const { checkDepositIdempotencyCompat } = require('../src/payment-engine/compat/idempotencyPortBridge');
const { isIdempotencyPortEnabled } = require('../src/payment-engine/boundary/idempotency-port-config');

const prev = process.env.PE_IDEMPOTENCY_PORT_ENABLED;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`OK ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`FAIL ${name}:`, err.message);
  }
}

await test('primeira execução reserve+commit', async () => {
  const { store, state } = createInMemoryIdempotencyStore();
  const r = await idemCore.reserve(store, { scope: 'deposit_pix', key: 'a1' });
  assert.equal(r.reserved, true);
  const c = await idemCore.commit(store, { scope: 'deposit_pix', key: 'a1' });
  assert.equal(c.state, 'processed');
  assert.equal(state.commitCalls, 1);
});

await test('segunda execução idempotente', async () => {
  const { store } = createInMemoryIdempotencyStore({
    entries: { 'deposit_pix:a2': { state: 'processed', status: 'approved' } }
  });
  const e = await idemCore.exists(store, { scope: 'deposit_pix', key: 'a2' });
  assert.equal(e.duplicate, true);
  const check = await idemCore.checkDepositAlreadyProcessed(store, 'a2');
  assert.equal(check.alreadyProcessed, true);
});

await test('corrida simultânea reserve', async () => {
  const { store, state } = createInMemoryIdempotencyStore();
  const [x, y] = await Promise.all([
    idemCore.reserve(store, { scope: 'deposit_pix', key: 'race' }),
    idemCore.reserve(store, { scope: 'deposit_pix', key: 'race' })
  ]);
  const reservedCount = [x, y].filter((r) => r.reserved).length;
  assert.equal(reservedCount, 1);
  assert.equal(state.reserveCalls, 2);
});

await test('rollback após reserve', async () => {
  const { store } = createInMemoryIdempotencyStore();
  await idemCore.reserve(store, { scope: 'deposit_pix', key: 'rb1' });
  const rb = await idemCore.rollback(store, { scope: 'deposit_pix', key: 'rb1' });
  assert.equal(rb.metadata.rolledBack, true);
  const ex = await idemCore.exists(store, { scope: 'deposit_pix', key: 'rb1' });
  assert.equal(ex.exists, false);
});

await test('rollback duplicado / noop processed', async () => {
  const { store } = createInMemoryIdempotencyStore();
  await idemCore.reserve(store, { scope: 'deposit_pix', key: 'rb2' });
  await idemCore.commit(store, { scope: 'deposit_pix', key: 'rb2' });
  const rb = await idemCore.rollback(store, { scope: 'deposit_pix', key: 'rb2' });
  assert.equal(rb.metadata.reason, 'ROLLBACK_ON_PROCESSED_NOOP');
});

await test('reserve duplicado', async () => {
  const { store } = createInMemoryIdempotencyStore();
  await idemCore.reserve(store, { scope: 'deposit_pix', key: 'dup' });
  const d = await idemCore.reserve(store, { scope: 'deposit_pix', key: 'dup' });
  assert.equal(d.duplicate, true);
});

await test('commit duplicado', async () => {
  const { store } = createInMemoryIdempotencyStore();
  await idemCore.commit(store, { scope: 'deposit_pix', key: 'cd' });
  const d = await idemCore.commit(store, { scope: 'deposit_pix', key: 'cd' });
  assert.equal(d.duplicate, true);
});

await test('markFailed', async () => {
  const { store } = createInMemoryIdempotencyStore();
  const f = await idemCore.markFailed(store, { scope: 'deposit_pix', key: 'fail1', reason: 'timeout' });
  assert.equal(f.state, 'failed');
});

await test('erro parcial — store indisponível', async () => {
  const r = await idemCore.reserve(null, { scope: 'deposit_pix', key: 'x' });
  assert.ok(r.error);
});

await test('compat flag OFF legado', async () => {
  process.env.PE_IDEMPOTENCY_PORT_ENABLED = 'false';
  assert.equal(isIdempotencyPortEnabled(), false);
  const r = await checkDepositIdempotencyCompat(
    {
      supabase: {
        from() {
          return {
            select() {
              return this;
            },
            eq() {
              return this;
            },
            maybeSingle: async () => ({ data: null, error: null })
          };
        }
      }
    },
    'pay_new'
  );
  assert.equal(r.alreadyProcessed, false);
});

await test('compat flag ON porta', async () => {
  process.env.PE_IDEMPOTENCY_PORT_ENABLED = 'true';
  const { store } = createInMemoryIdempotencyStore({
    entries: { 'deposit_pix:pay_on': { state: 'processed', status: 'approved' } }
  });
  const r = await checkDepositIdempotencyCompat({ idempotencyStore: store }, 'pay_on');
  assert.equal(r.alreadyProcessed, true);
});

await test('GolDeOuro adapter find mapeia neutro', async () => {
  const adapter = createGolDeOuroIdempotencyStore({
    supabase: {
      from() {
        const builder = {
          select() {
            return builder;
          },
          eq(c, v) {
            builder._c = c;
            builder._v = v;
            return builder;
          },
          async maybeSingle() {
            if (builder._v === 'pid1') {
              return { data: { id: 'row1', status: 'pending' }, error: null };
            }
            return { data: null, error: null };
          }
        };
        return builder;
      }
    }
  });
  const found = await adapter.find({ scope: 'deposit_pix', key: 'pid1' });
  assert.ok(found);
  assert.equal(found.exists, true);
  assert.equal(found.status, 'pending');
  assert.equal(found.state, 'reserved');
  assert.equal(Object.prototype.hasOwnProperty.call(found, 'usuario_id'), false);
});

await test('release equivalente a rollback', async () => {
  const { store } = createInMemoryIdempotencyStore();
  await idemCore.reserve(store, { scope: 'deposit_pix', key: 'rel' });
  await idemCore.release(store, { scope: 'deposit_pix', key: 'rel' });
  const e = await idemCore.exists(store, { scope: 'deposit_pix', key: 'rel' });
  assert.equal(e.exists, false);
});

await test('wallet/ledger fail simulation — markFailed path', async () => {
  const { store } = createInMemoryIdempotencyStore();
  await idemCore.reserve(store, { scope: 'deposit_pix', key: 'wl' });
  // simula falha parcial após reserve: markFailed em vez de commit
  const f = await idemCore.markFailed(store, { scope: 'deposit_pix', key: 'wl', reason: 'wallet_fail' });
  assert.equal(f.state, 'failed');
  const e = await idemCore.exists(store, { scope: 'deposit_pix', key: 'wl' });
  assert.equal(e.state, 'failed');
});

await test('timeout simulation — reserve then no commit', async () => {
  const { store } = createInMemoryIdempotencyStore();
  await idemCore.reserve(store, { scope: 'deposit_pix', key: 'to' });
  // timeout → release
  await idemCore.release(store, { scope: 'deposit_pix', key: 'to' });
  const again = await idemCore.reserve(store, { scope: 'deposit_pix', key: 'to' });
  assert.equal(again.reserved, true);
});

if (prev === undefined) delete process.env.PE_IDEMPOTENCY_PORT_ENABLED;
else process.env.PE_IDEMPOTENCY_PORT_ENABLED = prev;

if (failed) {
  console.error(`PE.2G verify: ${failed} FAIL`);
  process.exit(1);
}
console.log('PE.2G verify-pe2g-idempotency-port: ALL OK');
