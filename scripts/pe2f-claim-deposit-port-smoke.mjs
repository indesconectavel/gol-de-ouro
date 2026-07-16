'use strict';

/**
 * PE.2F — smoke test Claim Deposit Port Extraction (sem produção / sem banco / sem mutação real).
 * Executar: node scripts/pe2f-claim-deposit-port-smoke.mjs
 */

import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const {
  isDepositClaimPortEnabled,
  FLAG_NAME,
  DEFAULT_VALUE
} = require('../src/payment-engine/boundary/deposit-claim-port-config');
const { resolveDepositClaimPort } = require('../src/payment-engine/boundary/index');
const {
  claimApprovedDeposit,
  claimApprovedDepositOrchestrated
} = require('../src/payment-engine/core/claimApprovedDeposit');
const { createGolDeOuroDepositClaimAdapter } = require('../src/payment-engine/adapters/goldeouro/GolDeOuroDepositClaimAdapter');
const { createInMemoryDepositClaimPorts } = require('../src/payment-engine/adapters/memory/InMemoryDepositClaimPorts');
const {
  claimApprovedPixDepositCompat,
  compareLegacyAndPortClaim
} = require('../src/payment-engine/compat/depositClaimPortBridge');
const {
  normalizeDepositClaimInput,
  inferProvider
} = require('../src/payment-engine/types/DepositClaimInput');
const { PaymentEngine } = require('../src/payment-engine');

const prevClaimFlag = process.env.PE_DEPOSIT_CLAIM_PORT_ENABLED;
const prevBoundaryFlag = process.env.PE_ADAPTER_BOUNDARY_ENABLED;

function restoreFlags() {
  if (prevClaimFlag === undefined) delete process.env.PE_DEPOSIT_CLAIM_PORT_ENABLED;
  else process.env.PE_DEPOSIT_CLAIM_PORT_ENABLED = prevClaimFlag;
  if (prevBoundaryFlag === undefined) delete process.env.PE_ADAPTER_BOUNDARY_ENABLED;
  else process.env.PE_ADAPTER_BOUNDARY_ENABLED = prevBoundaryFlag;
}

try {
  // --- Flag default OFF ---
  delete process.env.PE_DEPOSIT_CLAIM_PORT_ENABLED;
  assert.equal(DEFAULT_VALUE, false);
  assert.equal(FLAG_NAME, 'PE_DEPOSIT_CLAIM_PORT_ENABLED');
  assert.equal(isDepositClaimPortEnabled(), false);
  assert.equal(resolveDepositClaimPort({ supabase: {}, createLedgerEntry: () => {} }), null);

  // --- Imports / bootstrap ---
  assert.ok(typeof claimApprovedDeposit === 'function');
  assert.ok(typeof createGolDeOuroDepositClaimAdapter === 'function');
  assert.ok(typeof PaymentEngine.deposit.claimApprovedViaPorts === 'function');
  assert.equal(inferProvider('pay_abc123'), 'asaas');
  assert.equal(inferProvider('123456'), 'mercadopago');

  const input = normalizeDepositClaimInput('pay_smoke1');
  assert.equal(input.providerPaymentId, 'pay_smoke1');
  assert.equal(input.correlationId, 'pay_smoke1');
  assert.equal(input.provider, 'asaas');

  // --- Core sem Supabase / schema GDO ---
  const coreSrc = fs.readFileSync(path.join(root, 'src/payment-engine/core/claimApprovedDeposit.js'), 'utf8');
  assert.equal(/supabase/i.test(coreSrc), false, 'core must not mention supabase');
  assert.equal(/pagamentos_pix/.test(coreSrc), false, 'core must not mention pagamentos_pix');
  assert.equal(/usuarios/.test(coreSrc), false, 'core must not mention usuarios');
  assert.equal(/ledger_financeiro/.test(coreSrc), false, 'core must not mention ledger_financeiro');
  assert.equal(/\.from\(/.test(coreSrc), false, 'core must not query tables');
  assert.equal(/\.rpc\(/.test(coreSrc), false, 'core must not call rpc');

  // --- Flag OFF: compat = legado (sem ports mutáveis) ---
  process.env.PE_DEPOSIT_CLAIM_PORT_ENABLED = 'false';
  assert.equal(isDepositClaimPortEnabled(), false);

  let legacyCalls = 0;
  const mockDeps = {
    supabase: {
      rpc: async () => {
        legacyCalls += 1;
        return { data: { ok: true, credited: false, idempotent: true }, error: null };
      }
    },
    createLedgerEntry: async () => {
      throw new Error('should not reach ledger on rpc idempotent');
    },
    log: () => {}
  };
  const offResult = await claimApprovedPixDepositCompat(mockDeps, '999001');
  assert.equal(offResult.ok, true);
  assert.equal(offResult.idempotent, true);
  assert.equal(legacyCalls, 1);

  // --- Flag ON local com fakes (in-memory) ---
  process.env.PE_DEPOSIT_CLAIM_PORT_ENABLED = 'true';
  assert.equal(isDepositClaimPortEnabled(), true);

  const { depositClaim, wallet, ledger, state } = createInMemoryDepositClaimPorts({
    deposits: {
      pay_mem1: {
        depositId: 'dep-1',
        accountId: 'acc-1',
        amount: 25,
        status: 'pending',
        providerPaymentId: 'pay_mem1',
        correlationId: 'pay_mem1'
      }
    },
    balances: { 'acc-1': 100 },
    ledger: []
  });

  const credited = await claimApprovedDeposit(
    { providerPaymentId: 'pay_mem1', metadata: { atomic: true } },
    { depositClaim }
  );
  assert.equal(credited.ok, true);
  assert.equal(credited.credited, true);
  assert.equal(state.balances.get('acc-1'), 125);
  assert.equal(state.creditCalls, 1);
  assert.equal(state.ledgerAppends, 1);

  // Idempotência — sem dupla mutação
  const again = await claimApprovedDeposit(
    { providerPaymentId: 'pay_mem1', metadata: { atomic: true } },
    { depositClaim }
  );
  assert.equal(again.ok, true);
  assert.equal(again.idempotent, true);
  assert.equal(again.credited, false);
  assert.equal(state.balances.get('acc-1'), 125);
  assert.equal(state.creditCalls, 1);

  // Orquestração WalletPort + LedgerPort (sem atomic no claim)
  const mem2 = createInMemoryDepositClaimPorts({
    deposits: {
      pay_mem2: {
        depositId: 'dep-2',
        accountId: 'acc-2',
        amount: 10,
        status: 'pending',
        providerPaymentId: 'pay_mem2',
        correlationId: 'pay_mem2'
      }
    },
    balances: { 'acc-2': 50 },
    ledger: []
  });
  const orch = await claimApprovedDepositOrchestrated('pay_mem2', mem2);
  assert.equal(orch.ok, true);
  assert.equal(orch.credited, true);
  assert.equal(mem2.state.balances.get('acc-2'), 60);
  assert.equal(mem2.state.creditCalls, 1);
  assert.equal(mem2.state.ledgerAppends, 1);

  const orch2 = await claimApprovedDepositOrchestrated('pay_mem2', mem2);
  assert.equal(orch2.idempotent, true);
  assert.equal(mem2.state.creditCalls, 1, 'no double wallet credit');

  // --- Equivalência legado vs adapter GDO (mock supabase) ---
  const paymentId = 'pay_eq1';
  const pix = {
    id: 'pix-eq',
    usuario_id: 'u-eq',
    amount: 5,
    valor: 5,
    payment_id: paymentId,
    external_id: paymentId,
    status: 'pending'
  };
  const saldoBox = { saldo: 40 };
  const ledgerBox = [];

  function buildEqSupabase() {
    return {
      rpc: async () => ({
        data: { ok: false, error: 'invalid_mercadopago_id', credited: false },
        error: null
      }),
      from(table) {
        if (table === 'ledger_financeiro') {
          return {
            select() {
              return this;
            },
            eq() {
              return this;
            },
            maybeSingle: async () => {
              const row = ledgerBox.find((r) => r.correlation_id === paymentId && r.tipo === 'deposito');
              return { data: row || null, error: null };
            }
          };
        }
        if (table === 'pagamentos_pix') {
          return {
            update(patch) {
              return {
                eq(k, v) {
                  return {
                    neq() {
                      return {
                        select: async () => {
                          if ((k === 'payment_id' || k === 'external_id') && v === paymentId) {
                            if (pix.status === 'approved') return { data: [], error: null };
                            Object.assign(pix, patch);
                            return { data: [{ ...pix }], error: null };
                          }
                          return { data: [], error: null };
                        }
                      };
                    }
                  };
                }
              };
            },
            select() {
              return this;
            },
            eq() {
              return this;
            },
            maybeSingle: async () => ({ data: { ...pix }, error: null })
          };
        }
        if (table === 'usuarios') {
          return {
            select() {
              return {
                eq() {
                  return {
                    single: async () => ({ data: { saldo: saldoBox.saldo }, error: null })
                  };
                }
              };
            },
            update(patch) {
              return {
                eq: async () => {
                  saldoBox.saldo = patch.saldo;
                  return { error: null };
                }
              };
            }
          };
        }
        throw new Error(`unexpected table ${table}`);
      }
    };
  }

  const createLedgerEntry = async ({ correlationId, tipo, usuarioId, valor, referencia }) => {
    const existing = ledgerBox.find((r) => r.correlation_id === correlationId && r.tipo === tipo);
    if (existing) return { success: true, deduped: true, id: existing.id };
    const row = {
      id: `led-${correlationId}`,
      correlation_id: correlationId,
      tipo,
      usuario_id: usuarioId,
      valor,
      referencia
    };
    ledgerBox.push(row);
    return { success: true, id: row.id, deduped: false };
  };

  // Duas instâncias de estado separados para comparação lado a lado
  // (compareLegacyAndPortClaim no mesmo state seria second-call idempotent)
  async function runOnFresh(fn) {
    pix.status = 'pending';
    saldoBox.saldo = 40;
    ledgerBox.length = 0;
    return fn({
      supabase: buildEqSupabase(),
      createLedgerEntry,
      log: () => {}
    });
  }

  const legacyRes = await runOnFresh(async (deps) => {
    const { claimApprovedPixDeposit } = require('../src/finance/deposit/claimApprovedPixDeposit');
    return claimApprovedPixDeposit(deps, paymentId);
  });
  const portRes = await runOnFresh(async (deps) => {
    const adapter = createGolDeOuroDepositClaimAdapter(deps);
    return claimApprovedDeposit(paymentId, { depositClaim: adapter });
  });

  assert.equal(legacyRes.ok, portRes.ok);
  assert.equal(legacyRes.credited, portRes.credited);
  assert.equal(legacyRes.idempotent, portRes.idempotent);

  // Adapter carregável
  const adapterProbe = createGolDeOuroDepositClaimAdapter({
    supabase: { from() { return {}; }, rpc: async () => ({ data: null, error: null }) },
    createLedgerEntry: async () => ({ success: false })
  });
  assert.equal(adapterProbe.productId, 'gol-de-ouro');
  assert.equal(typeof adapterProbe.claimApprovedDeposit, 'function');
  assert.equal(typeof adapterProbe.findByProviderPaymentId, 'function');

  // ViaPorts facade
  const via = await PaymentEngine.deposit.claimApprovedViaPorts(
    { providerPaymentId: 'missing' },
    { depositClaim }
  );
  assert.equal(via.ok, false);

  // compare helper exists
  assert.equal(typeof compareLegacyAndPortClaim, 'function');

  // Wallet / ledger fakes ok
  assert.ok(wallet.credit);
  assert.ok(ledger.append);

  console.log('PE.2F claim deposit port smoke: PASS');
} finally {
  restoreFlags();
}
