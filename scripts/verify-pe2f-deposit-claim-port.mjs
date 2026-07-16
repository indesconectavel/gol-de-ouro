'use strict';

/**
 * PE.2F — testes unitários / equivalência (mocks only; sem banco produtivo).
 * Executar: node scripts/verify-pe2f-deposit-claim-port.mjs
 */

import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const {
  claimApprovedDeposit,
  claimApprovedDepositOrchestrated
} = require('../src/payment-engine/core/claimApprovedDeposit');
const { createInMemoryDepositClaimPorts } = require('../src/payment-engine/adapters/memory/InMemoryDepositClaimPorts');
const { createGolDeOuroDepositClaimAdapter } = require('../src/payment-engine/adapters/goldeouro/GolDeOuroDepositClaimAdapter');
const { normalizeDepositClaimInput } = require('../src/payment-engine/types/DepositClaimInput');
const { isDepositClaimPortEnabled } = require('../src/payment-engine/boundary/deposit-claim-port-config');
const { claimApprovedPixDepositCompat } = require('../src/payment-engine/compat/depositClaimPortBridge');

const prev = process.env.PE_DEPOSIT_CLAIM_PORT_ENABLED;
let failed = 0;

function ok(name) {
  console.log(`OK ${name}`);
}
function fail(name, err) {
  failed += 1;
  console.error(`FAIL ${name}:`, err?.message || err);
}

async function test(name, fn) {
  try {
    await fn();
    ok(name);
  } catch (err) {
    fail(name, err);
  }
}

await test('DepositClaimPort: depósito encontrado', async () => {
  const { depositClaim } = createInMemoryDepositClaimPorts({
    deposits: {
      pay_f: {
        depositId: 'd1',
        accountId: 'a1',
        amount: 10,
        status: 'pending',
        providerPaymentId: 'pay_f',
        correlationId: 'pay_f'
      }
    }
  });
  const found = await depositClaim.findByProviderPaymentId('pay_f');
  assert.equal(found.found, true);
  assert.equal(found.deposit.accountId, 'a1');
});

await test('DepositClaimPort: depósito inexistente', async () => {
  const { depositClaim } = createInMemoryDepositClaimPorts();
  const found = await depositClaim.findByProviderPaymentId('pay_x');
  assert.equal(found.found, false);
  const res = await claimApprovedDeposit('pay_x', { depositClaim });
  assert.equal(res.ok, false);
  assert.equal(res.reason, 'DEPOSIT_NOT_FOUND');
});

await test('DepositClaimPort: aprovado (atomic) + idempotente', async () => {
  const ports = createInMemoryDepositClaimPorts({
    deposits: {
      pay_a: {
        depositId: 'd2',
        accountId: 'a2',
        amount: 15,
        status: 'pending',
        providerPaymentId: 'pay_a',
        correlationId: 'pay_a'
      }
    },
    balances: { a2: 0 }
  });
  const r1 = await claimApprovedDeposit(
    { providerPaymentId: 'pay_a', metadata: { atomic: true } },
    ports
  );
  assert.equal(r1.credited, true);
  const r2 = await claimApprovedDeposit(
    { providerPaymentId: 'pay_a', metadata: { atomic: true } },
    ports
  );
  assert.equal(r2.idempotent, true);
  assert.equal(ports.state.creditCalls, 1);
});

await test('DepositClaimPort: status inválido', async () => {
  const { depositClaim } = createInMemoryDepositClaimPorts({
    deposits: {
      pay_i: {
        depositId: 'd3',
        accountId: 'a3',
        amount: 1,
        status: 'cancelled',
        providerPaymentId: 'pay_i',
        correlationId: 'pay_i'
      }
    }
  });
  const r = await claimApprovedDeposit(
    { providerPaymentId: 'pay_i', metadata: { atomic: true } },
    { depositClaim }
  );
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'INVALID_STATUS');
});

await test('WalletPort: crédito único + correlação (orquestrado)', async () => {
  const ports = createInMemoryDepositClaimPorts({
    deposits: {
      pay_w: {
        depositId: 'dw',
        accountId: 'aw',
        amount: 7,
        status: 'pending',
        providerPaymentId: 'pay_w',
        correlationId: 'pay_w'
      }
    },
    balances: { aw: 3 }
  });
  const r = await claimApprovedDepositOrchestrated('pay_w', ports);
  assert.equal(r.ok, true);
  assert.equal(r.credited, true);
  assert.equal(ports.state.balances.get('aw'), 10);
  assert.equal(ports.state.creditCalls, 1);
  await claimApprovedDepositOrchestrated('pay_w', ports);
  assert.equal(ports.state.creditCalls, 1);
});

await test('LedgerPort: registro único + metadata', async () => {
  const ports = createInMemoryDepositClaimPorts({
    deposits: {
      pay_l: {
        depositId: 'dl',
        accountId: 'al',
        amount: 2,
        status: 'pending',
        providerPaymentId: 'pay_l',
        correlationId: 'pay_l'
      }
    },
    balances: { al: 0 }
  });
  await claimApprovedDepositOrchestrated('pay_l', ports);
  assert.equal(ports.state.ledger.length, 1);
  assert.equal(ports.state.ledger[0].correlationId, 'pay_l');
  assert.equal(ports.state.ledgerAppends, 1);
});

await test('Core: input inválido + port indisponível', async () => {
  const empty = await claimApprovedDeposit('', {});
  assert.equal(empty.reason, 'INVALID_INPUT');
  const noPort = await claimApprovedDeposit('pay_1', {});
  assert.equal(noPort.reason, 'DEPOSIT_CLAIM_PORT_UNAVAILABLE');
});

await test('Core: erro wallet parcial (ledger ok, wallet fail)', async () => {
  const ports = createInMemoryDepositClaimPorts({
    deposits: {
      pay_pf: {
        depositId: 'dpf',
        accountId: 'apf',
        amount: 9,
        status: 'pending',
        providerPaymentId: 'pay_pf',
        correlationId: 'pay_pf'
      }
    },
    balances: { apf: 0 }
  });
  ports.wallet.credit = async () => ({ success: false, error: new Error('wallet_down') });
  const r = await claimApprovedDepositOrchestrated('pay_pf', ports);
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'WALLET_ERROR');
  assert.equal(ports.state.ledger.length, 1);
});

await test('normalizeDepositClaimInput neutro', async () => {
  const n = normalizeDepositClaimInput({
    provider: 'asaas',
    providerPaymentId: 'pay_n',
    accountId: 'u1',
    amount: 50,
    eventId: 'evt',
    correlationId: 'corr'
  });
  assert.equal(n.provider, 'asaas');
  assert.equal(n.correlationId, 'corr');
  assert.equal(n.currency, 'BRL');
});

await test('Flag OFF preserva caminho legado via compat', async () => {
  process.env.PE_DEPOSIT_CLAIM_PORT_ENABLED = 'false';
  assert.equal(isDepositClaimPortEnabled(), false);
  const r = await claimApprovedPixDepositCompat(
    {
      supabase: {
        rpc: async () => ({ data: { ok: true, credited: true, idempotent: false }, error: null })
      },
      createLedgerEntry: async () => ({ success: true }),
      log: () => {}
    },
    '888777'
  );
  assert.equal(r.ok, true);
  assert.equal(r.credited, true);
});

await test('GolDeOuroDepositClaimAdapter: find mapeia neutro', async () => {
  const adapter = createGolDeOuroDepositClaimAdapter({
    supabase: {
      from() {
        const builder = {
          select() {
            return builder;
          },
          eq(col, val) {
            builder._col = col;
            builder._val = val;
            return builder;
          },
          async maybeSingle() {
            if (builder._col === 'payment_id' && builder._val === 'pay_map') {
              return {
                data: {
                  id: 'pix-1',
                  usuario_id: 'u-1',
                  amount: 12,
                  valor: 12,
                  payment_id: 'pay_map',
                  external_id: 'pay_map',
                  status: 'pending'
                },
                error: null
              };
            }
            return { data: null, error: null };
          }
        };
        return builder;
      }
    },
    createLedgerEntry: async () => ({ success: true })
  });
  const found = await adapter.findByProviderPaymentId('pay_map');
  assert.equal(found.found, true);
  assert.equal(found.deposit.depositId, 'pix-1');
  assert.equal(found.deposit.accountId, 'u-1');
  assert.equal(found.deposit.amount, 12);
  assert.equal(found.deposit.status, 'pending');
  assert.equal(found.deposit.providerPaymentId, 'pay_map');
  assert.equal(found.deposit.correlationId, 'pay_map');
  assert.equal(found.deposit.metadata.hasPaymentId, true);
  assert.equal(found.deposit.metadata.hasExternalId, true);
  assert.equal(Object.prototype.hasOwnProperty.call(found.deposit, 'usuario_id'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(found.deposit, 'payment_id'), false);
});

await test('Concorrência simulada: segunda claim idempotente', async () => {
  const ports = createInMemoryDepositClaimPorts({
    deposits: {
      pay_c: {
        depositId: 'dc',
        accountId: 'ac',
        amount: 4,
        status: 'pending',
        providerPaymentId: 'pay_c',
        correlationId: 'pay_c'
      }
    },
    balances: { ac: 0 }
  });
  const [a, b] = await Promise.all([
    claimApprovedDeposit({ providerPaymentId: 'pay_c', metadata: { atomic: true } }, ports),
    claimApprovedDeposit({ providerPaymentId: 'pay_c', metadata: { atomic: true } }, ports)
  ]);
  const creditedCount = [a, b].filter((x) => x.credited).length;
  assert.ok(creditedCount <= 1, 'at most one credit');
  assert.equal(ports.state.creditCalls, 1);
});

if (prev === undefined) delete process.env.PE_DEPOSIT_CLAIM_PORT_ENABLED;
else process.env.PE_DEPOSIT_CLAIM_PORT_ENABLED = prev;

if (failed) {
  console.error(`PE.2F verify: ${failed} FAIL`);
  process.exit(1);
}
console.log('PE.2F verify-pe2f-deposit-claim-port: ALL OK');
